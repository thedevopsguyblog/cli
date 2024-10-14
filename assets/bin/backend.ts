#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FEStack } from '../lib/frontend';
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
