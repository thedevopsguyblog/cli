import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
	IdentityPool,
	UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha'

interface AuthStackProps extends cdk.StackProps {
  envVars: { [key: string]: string }
}

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;

    /* Authentication */
    const userPool = new cdk.aws_cognito.UserPool(this, 'userPool', {
      userPoolName: `${PREFIX}${AC}`,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true }
      },
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy,
    })

    const userPoolDomainName = userPool.addDomain(`${PREFIX}DomainName`, {
      cognitoDomain:{
        domainPrefix: `${PREFIX}`.toLocaleLowerCase()
      }
    })

    const userPoolClient = new cdk.aws_cognito.UserPoolClient(this, `${PREFIX}userPoolClient`, {
      userPool: userPool,
      userPoolClientName: `${PREFIX}${AC}-WebClient`,
    })
    
    const identityPool = new IdentityPool(this, `identityPool`,{
      identityPoolName: `${PREFIX}${AC}identityPool`,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool: userPool,
            userPoolClient: userPoolClient,
          }),
        ],
      },
    })

    /* SSM Outputs */
    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolId`, {
      stringValue: userPool.userPoolId,
      parameterName: `/${PREFIX}${AC}/userpoolid`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolDomainName`, {
      stringValue: `${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com`,
      parameterName: `/${PREFIX}${AC}/userPoolDomainName`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolDomainNameRedirect`, {
      stringValue: `https://${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      parameterName: `/${PREFIX}${AC}/userPoolDomainNameRedirect`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolClientId`, {
      stringValue: `${userPoolClient.userPoolClientId}`,
      parameterName: `/${PREFIX}${AC}/userPoolClientId`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthIdentityPoolId`, {
      stringValue: `${identityPool.identityPoolId}`,
      parameterName: `/${PREFIX}${AC}/identityPoolId`
    })

    /* CfnOutputs used by frontend Project */
    new cdk.CfnOutput(this, `userPoolId`, {
      value: userPool.userPoolId,
    })

    new cdk.CfnOutput(this, `userPoolDomainName`, {
      value: `${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com`,
    })

    new cdk.CfnOutput(this, `userPoolDomainNameRedirect`, {
      value: `https://${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
    })

    new cdk.CfnOutput(this, `userPoolClientId`, {
      value: userPoolClient.userPoolClientId
    })

    new cdk.CfnOutput(this, `identityPoolId`, {
      value: identityPool.identityPoolId
    })
  }
}