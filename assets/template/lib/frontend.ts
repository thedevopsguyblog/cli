import * as cdk from 'aws-cdk-lib';
import * as amplifyAlpha from '@aws-cdk/aws-amplify-alpha'
import { Construct } from 'constructs';
import * as fs from 'fs';
import type { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

interface FEStackProps extends cdk.StackProps {
  envVars: { [key: string]: string }
}

export class FEStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FEStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;
    const FQDN = props.envVars.FQDN

    const amplifyDeploymentRole = new cdk.aws_iam.Role(this, 'amplifyDeploymentRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Role for Amplify to deploy the frontend',
      roleName: `${PREFIX}${AC}-amplify-deploy-from-cdk`,
      inlinePolicies: {
        CdkDeploymentPolicy: new cdk.aws_iam.PolicyDocument({
          assignSids: true,
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [`arn:aws:iam::${props!.envVars.ACCOUNT}:role/cdk-*`],
            }),
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ['appsync:GetIntrospectionSchema'],
              resources: [`*`], //TODO: restrict to the amplify app
            }),
          ],
        }),
      },
    })

    let buildSpec:BuildSpec = cdk.aws_codebuild.BuildSpec.fromSourceFilename(fs.readFileSync('./lib/ampBuildSpec.yml', 'utf8'))
    var personalaccesstoken = cdk.aws_secretsmanager.Secret.fromSecretNameV2(this, `accessToken`, `github-token`).secretValue

    const sourceCodeProvider = new amplifyAlpha.GitHubSourceCodeProvider({
      owner: FQDN ? props!.envVars.OWNER : 'null',
      repository: FQDN ? props!.envVars.REPO : 'null',
      oauthToken: personalaccesstoken,
    })

    const fehosting = new amplifyAlpha.App(this, `${AC}Hosting`, {
      role: amplifyDeploymentRole,
      ...(FQDN !== 'www.*.amplifyapp.com' && { sourceCodeProvider: sourceCodeProvider }), //Pretty cool TS syntax
      appName:props?.envVars.PRODUCTNAME,
      description: props?.envVars.DESCRIPTION,
      platform:amplifyAlpha.Platform.WEB_COMPUTE,
      autoBranchDeletion: true,
      buildSpec,
      customRules:[{ 
        source: `https://${FQDN}`, 
        target: `https://www.${FQDN}`, 
        status: amplifyAlpha.RedirectStatus.REWRITE 
      }],
      environmentVariables: {
        APP_CODE: AC,
        AMPLIFY_MONOREPO_APP_ROOT: 'frontend',
        _CUSTOM_IMAGE: 'amplify:al2023'
      }
    });
    
    const testBranch = new amplifyAlpha.Branch(this, 'testBranch', {
      app: fehosting,
      branchName: 'test',
      environmentVariables:{
        RESOURCE_PREFIX: 'T'
      },
      // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-amplify-branch.html#cfn-amplify-branch-stage
      // TODO: Create PR in the amplify alpha project - it should be an ENUM not a string
      stage: 'DEVELOPMENT',
    })

    const devBranch = new amplifyAlpha.Branch(this, 'devBranch', {
      app: fehosting,
      environmentVariables:{
        RESOURCE_PREFIX: 'D'
      },
      branchName: 'develop',
      stage: 'EXPERIMENTAL',
    })

    const prodBranch = new amplifyAlpha.Branch(this, 'mainBranch', {
      app: fehosting,
      branchName: 'main',
      environmentVariables:{
        RESOURCE_PREFIX: 'P'
      },
      stage: 'PRODUCTION',
    })

    const domain = fehosting.addDomain(`${props!.envVars.DOMAINNAME}`, {
      enableAutoSubdomain: false,
      domainName: props!.envVars.DOMAINNAME,
      subDomains:[
        {branch:prodBranch, prefix:'www'}, 
        {branch:testBranch, prefix:'test'},
        {branch:devBranch, prefix:'dev'},
      ],
    })

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: fehosting.appId,
      description: 'The ID of the Amplify App',
      exportName: `${AC}AmplifyAppId`
    })

  }
}