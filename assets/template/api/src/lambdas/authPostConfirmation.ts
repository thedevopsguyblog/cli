import { PostAuthenticationTriggerEvent, Context, PostAuthenticationTriggerHandler } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"; 
import * as uuid from 'uuid';
import type { Organisation } from '../API';
import { 
  CognitoIdentityProviderClient, 
  CognitoIdentityProviderClientConfig, 
  AdminUpdateUserAttributesCommand, 
  AdminUpdateUserAttributesCommandInput,
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput
} from "@aws-sdk/client-cognito-identity-provider";


const updateOrgName = async (userName: string, orgName: string, UserPoolId:string) => {

  const config:CognitoIdentityProviderClientConfig = {};
  const input:AdminUpdateUserAttributesCommandInput = {
    UserPoolId,
    Username: userName,
    UserAttributes:[{
      Name: process.env.ATTR_ORGNAME,
      Value: orgName
    }]
  };

  try {
    const client = new CognitoIdentityProviderClient(config);
    const command = new AdminUpdateUserAttributesCommand(input);
    const response = await client.send(command);
    if (response.$metadata.httpStatusCode === 200) {
      console.log(`Success: ${JSON.stringify(response, null, 2)}`);
      return true
    }
  } catch (error) {
    console.error(`Error Updating the orgName: ${error}`);
    throw error;
  }
}

const updateGrpMembership = async (Username: string, GroupName:string, UserPoolId:string) => {
  
  const config:CognitoIdentityProviderClientConfig = {}
  const input:AdminAddUserToGroupCommandInput = {
    GroupName,
    UserPoolId,
    Username,
  }

  try {
    const client = new CognitoIdentityProviderClient(config);
    const command = new AdminAddUserToGroupCommand(input)
    const response = await client.send(command)
    if (response.$metadata.httpStatusCode === 200) {
      console.log(`Success: ${JSON.stringify(response, null, 2)}`);
      return true
    }
  } catch (error) {
    console.error(`Error Updating the Group Membership: ${error}`);
    throw error;
  }
}

const pushCreateOrgQ = async (orgName: string, event:PostAuthenticationTriggerEvent) => {
  console.log(JSON.stringify(event, null, 2));
  const Uid = uuid.v4()
  const MessageBody = { orgName, Uid, event }
  
  const client = new SQSClient({})
  const command = new SendMessageCommand({
    QueueUrl: process.env.ORG_CREATION_Q!,
    MessageBody: JSON.stringify(MessageBody),
  })

  console.log('Sending Payload:', JSON.stringify(MessageBody, null, 2));

  try {
    const response = await client.send(command)
    if (response.$metadata.httpStatusCode === 200) {
      console.log(`Success: ${JSON.stringify(response, null, 2)}`);
      return true
    }
  } catch (error) {
    console.error(`Error Pushing to the Queue:\n${error}`);
  }

  return true
}

export const handler: PostAuthenticationTriggerHandler = async (event: PostAuthenticationTriggerEvent, context: Context) => {

    if ( !event.userPoolId || !process.env.ATTR_ORGNAME ) {
      console.log(`ATTR_ORGNAME:${process.env.ATTR_ORGNAME}`, `UserPoolId:${event.userPoolId}`);
      console.error(`Environment Variables not set`);
      throw new Error('Environment Variables not set');
    }

    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    
    const { userName, request: { userAttributes } } = event;
    const orgName = userName.split('@')[1];

    await updateOrgName(userName, orgName, event.userPoolId);
    await updateGrpMembership(userName, process.env.DEFAULT_GRP!, event.userPoolId );
    await pushCreateOrgQ(orgName, event);


  return event;
};