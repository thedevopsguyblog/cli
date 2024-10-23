#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FEStack } from '../lib/frontend.ts';
import { APIStack } from '../lib/api.ts';
import { BucketStack } from '../lib/bucket.ts';
import { NotificationStack } from '../lib/notifications.ts';
import { AuthStack } from '../lib/auth.ts';
import { execSync } from 'node:child_process';
import { getEnvContext } from '../config';

const app = new cdk.App();
const currentBranch = process.env.AWS_BRANCH || execSync('git branch --show-current').toString().trim()

if (!currentBranch) {
	throw new Error(`No configuration found for branch: ${currentBranch}`)
} 

const envVars = getEnvContext(currentBranch)

console.log(envVars)

let RA = `${envVars.RESOURCE_PREFIX}${envVars.APP_CODE}`

if (envVars.RESOURCE_PREFIX === 'P') {
  	//Only deploy hosting stack from the main branch
    new FEStack(app, `${RA}-FE-Hosting`, {
      stackName:`${RA}-FE-Hosting`,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      envVars: envVars,
      tags: {
        app: `${RA}-FE-Hosting`,
        repoName: envVars.REPO
      }
    });
}

const notificationsStack = new NotificationStack(app, `${RA}-Notifications`, {
  stackName:`${RA}-Notifications`,
  description: `Notifications for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  envVars: envVars,
  tags: {
    app: `${RA}-Notifications`,
    repoName: envVars.REPO
  }
})

const authStack = new AuthStack(app, `${RA}-Auth`, {
  stackName:`${RA}-Auth`,
  description: `Auth for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  enVars: envVars,
  tags: {
    app: `${RA}Auth`,
    repoName: envVars.REPO
  }
});

const bucketStack = new BucketStack(app, `${RA}-Bucket`, {
  stackName:`${RA}-Bucket`,
  description: `Bucket for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  enVars: envVars,
  tags: {
    app: `${RA}Bucket`,
    repoName: envVars.REPO
  }
});

const apistack = new APIStack(app, `${RA}-API`, {
  stackName:`${RA}-API`,
  description: `Appsync and DBs for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  envVars: envVars,
  tags: {
    app: `${RA}-API-DB`,
    repoName: envVars.REPO
  }
})

// Auth is always the first stack to be created
bucketStack.addDependency(authStack, 'We need the Cognito resources to exists before we can create the bucket')
apistack.addDependency(authStack, 'We need the Cognito resources to exists before we can create the API')
apistack.addDependency(bucketStack, 'some lambdas need to be able to write to the bucket')

apistack.addDependency(notificationsStack, 'We need the SNS topics to exists before we can create the API')

