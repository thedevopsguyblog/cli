import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "fs";
import { join } from "path";

interface BackendStackProps extends cdk.StackProps {
  envVars: { [key: string]: string };
}

export class APIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;

    const userPoolIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, "userPoolIdImport", `/${PREFIX}${AC}/userpoolid`);
    const userPoolClientIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this,"userPoolClientIdImport",`/${PREFIX}${AC}/userPoolClientId`);

    const importedUserPool = cdk.aws_cognito.UserPool.fromUserPoolId( this, "importedUserPool", userPoolIdImport.stringValue);
    const importedUserPoolClient = cdk.aws_cognito.UserPoolClient.fromUserPoolClientId(this,"userPoolClient",userPoolClientIdImport.stringValue);

    const imageUploadBucketImport = cdk.Fn.importValue(`${PREFIX}${AC}BucketName`);
    const importedBucketName = cdk.aws_s3.Bucket.fromBucketName( this, "bucketName", imageUploadBucketImport);

    //API
    const api = new cdk.aws_appsync.GraphqlApi(this, "Api", {
      name: `${PREFIX}${AC}-API`,
      definition: cdk.aws_appsync.Definition.fromFile(join("api/schema.graphql")),
      logConfig: {
        retention: cdk.aws_logs.RetentionDays.ONE_DAY,
        fieldLogLevel: cdk.aws_appsync.FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: cdk.aws_appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: importedUserPool,
          },
        },
      },
    });

    const database = new cdk.aws_dynamodb.Table(this, "datastore", {
      partitionKey: { name: "id", type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy,
    });

    const emailTodosLambda = new cdk.aws_lambda.Function(this, "emailTodosLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: "emailTodo.handler",
      description: `${PREFIX}${AC} Send an email to the todoOwner of the todo`,
      code: cdk.aws_lambda.Code.fromAsset(join("api/build/lambdas/emailTodo")),
      environment: {
        TABLE_NAME: database.tableName,
        NOREPLAY_ADDRESS: props.envVars.NOREPLAY_ADDRESS,
      },
    })

    const policy = new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: ['*'], // adjust this to limit the scope of the policy
    });

    emailTodosLambda.addToRolePolicy(policy);
    database.grantReadWriteData(emailTodosLambda);

    database.addGlobalSecondaryIndex({
      indexName: "todosByOwner",
      partitionKey: {
        name: "__typename",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "todoOwner", type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    // Add the Datasource that my resolvers will make use of
    const todosDS = api.addDynamoDbDataSource("TodoDS", database);
    const lambdaDS = api.addLambdaDataSource("LambdaDS", emailTodosLambda, {description: `${PREFIX}${AC} Lambda DataSource`, name: `${PREFIX}${AC}LambdaDS`});

    // Add the resolvers that will make use of the datasource

    type Resolver = {
      fieldName: string;
      type: string;
      dataSource: cdk.aws_appsync.BaseDataSource;
    };

    const resolvers: Resolver[] = [
      { fieldName: "getTodo", type: "Query", dataSource: todosDS },
      { fieldName: "listTodos", type: "Query", dataSource: todosDS },
      { fieldName: "createTodo", type: "Mutation", dataSource: todosDS },
      { fieldName: "updateTodo", type: "Mutation", dataSource: lambdaDS },
      { fieldName: "deleteTodo", type: "Mutation", dataSource: todosDS },
      { fieldName: "toggleTodo", type: "Mutation", dataSource: todosDS },
    ];
    
    // TODO: Implement resolverBuilder(), it will compile the resolvers Array on each build and create the resolvers
    // const resolverBuilder = () => {}

    resolvers.forEach((resolver) => {
      api.createResolver(resolver.fieldName, {
        typeName: resolver.type,
        fieldName: resolver.fieldName,
        dataSource: resolver.dataSource,
        runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
        code: cdk.aws_appsync.Code.fromAsset(
          join("api/build/resolvers", `${resolver.fieldName}.js`),
        ),
      });
    });

    //cfn Outputs
    new cdk.aws_ssm.StringParameter(this, `${PREFIX}API_ID`, {
      stringValue: api.apiId,
      parameterName: `/${PREFIX}${AC}/api/id`,
      description: `${PREFIX} API ID`,
    });

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}API_URL`, {
      stringValue: api.graphqlUrl,
      parameterName: `/${PREFIX}${AC}/api/url`,
      description: `${PREFIX} API URL`,
    });

    new cdk.CfnOutput(this, `apiID`, {
      exportName: `${PREFIX}${AC}apiID`,
      value: api.apiId,
    });

    new cdk.CfnOutput(this, `endpoint`, {
      exportName: `${PREFIX}${AC}endpoint`,
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, `region`, {
      value: this.region,
    });

    new cdk.CfnOutput(this, `defaultAuthMode`, {
      exportName: `${PREFIX}${AC}defaultAuthMode`,
      value: api.modes.toString(),
    });
  }
}
