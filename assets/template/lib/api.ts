import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

interface BackendStackProps extends cdk.StackProps {
  envVars: { [key: string]: string }
}

export class APIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;

    const userPoolIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolIdImport', `/${PREFIX}${AC}/userpoolid`)
    const userPoolClientIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolClientIdImport', `/${PREFIX}${AC}/userPoolClientId`)

    const importedUserPool = cdk.aws_cognito.UserPool.fromUserPoolId(this, 'importedUserPool', userPoolIdImport.stringValue)
    const importedUserPoolClient = cdk.aws_cognito.UserPoolClient.fromUserPoolClientId(this, 'userPoolClient', userPoolClientIdImport.stringValue)
    
    const imageUploadBucketImport = cdk.Fn.importValue(`${PREFIX}${AC}BucketName`)
    const importedBucketName = cdk.aws_s3.Bucket.fromBucketName(this, 'bucketName', imageUploadBucketImport)


    //API
    const api = new cdk.aws_appsync.GraphqlApi(this, 'Api', {
      name: `${PREFIX}${AC}-API`,
      definition: cdk.aws_appsync.Definition.fromFile(join('api/schema.graphql')),
      logConfig:{
        retention: cdk.aws_logs.RetentionDays.ONE_DAY,
        fieldLogLevel: cdk.aws_appsync.FieldLogLevel.ALL
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: cdk.aws_appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool:importedUserPool,
          }
        },
        additionalAuthorizationModes: [{
          authorizationType: cdk.aws_appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            name: 'watchlist-subscribers-key',
            description: 'API Key for watchlist subscribers mutation',
            expires: cdk.Expiration.after(cdk.Duration.days(30)), //TODO: automate the refresh of this key
          }
        }]
      }
    })

    const database = new cdk.aws_dynamodb.Table(this, 'datastore', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'orgid', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy
    })

    const marketingTable = new cdk.aws_dynamodb.Table(this, 'MarketingTable', {
      partitionKey: { name: 'emailaddress', type: cdk.aws_dynamodb.AttributeType.STRING},
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy
    });

    //NOTE:GSI's can't be edited - only deleted and then re-deployed
    database.addGlobalSecondaryIndex({
      indexName: 'user-requests',
      partitionKey: { name: 'requestor', type: cdk.aws_dynamodb.AttributeType.STRING }
    })

    database.addGlobalSecondaryIndex({
      indexName: 'org-requests',
      partitionKey: { name: 'orgid', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: cdk.aws_dynamodb.AttributeType.STRING },
    })
    
    const requestsDS = api.addDynamoDbDataSource('RequestsTableSource', database)
    const marketingTableDS = api.addDynamoDbDataSource('MarketingTable', marketingTable)

    /* Re-deploying resolvers can cause issues - may need to delete the stack and redeploy it */

    api.createResolver('QueryGetRequestsByUser', {
      typeName: 'Query',
      fieldName: 'getRequestsByUser',
      dataSource: requestsDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/getRequestsByUser.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });
    
    api.createResolver('MutationUpdateWatchlist', {
      typeName: 'Mutation',
      fieldName: 'updateWatchlist',
      dataSource: marketingTableDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/updateWatchlist.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });



    //cfn Outputs
    new cdk.aws_ssm.StringParameter(this, `${PREFIX}API_ID`, {
      stringValue: api.apiId,
      parameterName: `/${PREFIX}${AC}/api/id`,
      description: `${PREFIX} API ID`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}API_URL`, {
      stringValue: api.graphqlUrl,
      parameterName: `/${PREFIX}${AC}/api/url`,
      description: `${PREFIX} API URL`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}API_KEY`, {
      stringValue: api.apiKey!,
      parameterName: `/${PREFIX}${AC}/api/key`,
      description: `${PREFIX} API Key`
    })

    new cdk.CfnOutput(this, `apiID`, {
      exportName: `${PREFIX}${AC}apiID`,
      value: api.apiId,
    })
    new cdk.CfnOutput(this, `endpoint`, {
      exportName: `${PREFIX}${AC}endpoint`,
      value: api.graphqlUrl,
    })

    new cdk.CfnOutput(this, `region`, {
      value: this.region,
    })

    new cdk.CfnOutput(this, `apiKey`, {
      exportName: `${PREFIX}${AC}apiKey`,
      value: api.apiKey!,
    })

    new cdk.CfnOutput(this, `defaultAuthMode`, {
      exportName: `${PREFIX}${AC}defaultAuthMode`,
      value: api.modes.toString(),
    })
  }
}