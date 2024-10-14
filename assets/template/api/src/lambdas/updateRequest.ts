// From an appsync event update a DynamoDB table with an assignment and send an email using SES 

import { Context, Callback, AppSyncResolverEvent } from 'aws-lambda';
import { UpdateItemCommandInput, UpdateItemCommand, DynamoDBClient, UpdateItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { SendEmailCommandInput, SendEmailCommand, SESv2Client} from '@aws-sdk/client-sesv2'

let returnValues:UpdateItemCommandOutput

const updateDB = async (payload: any) => {
  
  console.log(`Updating ${process.env.TABLE_NAME} with: ${payload.assignee} and status ${payload.status}`);

  const client = new DynamoDBClient();
  const params:UpdateItemCommandInput = {
    TableName: `${process.env.TABLE_NAME}`,
    Key: {
      'id': {S: payload.key.id},
      'orgid': {S: payload.key.orgid}
    },
    UpdateExpression: 'set assignee = :assignee, #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':assignee': {S: payload.assignee},
      ':status': {S: payload.status}
    },
    ReturnValues: 'ALL_NEW', // Return all the attributes of the updated item
  };
  

  try {
    const command = new UpdateItemCommand(params);
    // console.debug('Updating DB with:', JSON.stringify(command, null, 2));
    const response = await client.send(command);
    // console.debug('Update succeeded:', JSON.stringify(response, null, 2));
    if (!response){
      throw new Error('DB Update failed');
    }
    returnValues = response
    return response;
  } catch (error) {
    console.error('Update failed:', error);
    throw new Error(`Error updating DB: ${error}`);
  }
  
}

const sendEmail = async () => {
  console.debug('Payload:', JSON.stringify(returnValues.Attributes, null, 2));

  const client = new SESv2Client();
  const params:SendEmailCommandInput = {
    FromEmailAddress: process.env.NOREPLAY_ADDRESS,
    Destination: {
      ToAddresses: [returnValues!.Attributes!.assignee.S!]
    },
    Content:{
      Simple:{
        Body:{
          Text:{
            Data: `${JSON.stringify(returnValues!.Attributes!.class.S, null, 2)}`
          }
        },
        Subject:{
          Data: `Class Assignment: ${returnValues!.Attributes!.class.S} ${returnValues!.Attributes!.yeargroup.S}`
        }
      }
    }
  }

  try {
    const command = new SendEmailCommand(params);
    console.debug('Sending email with:', JSON.stringify(command, null, 2));
    const response = await client.send(command);
    console.debug('Email sent:', JSON.stringify(response, null, 2));
    console.debug(response)
  } catch (error) {
    throw new Error(`Error sending email FROM: ${process.env.NOREPLAY_ADDRESS} to ${returnValues!.Attributes!.assignee.S!} with error:\n${error}`)
  }

}

//TODO: THis lambda has full write access to the DB so we need to check the users auth token before updating the DB.
export const handler = async (event: AppSyncResolverEvent<any>, context: Context, callback: Callback) => {


  try {    
    let assign = await updateDB(event);
    if (!assign) {
      throw new Error('Error updating DB');
    } else {
      await sendEmail(event);
    }
  } catch (error) {
    throw new Error(`Error in updateReq lambda:\n${error}`);
  }

  callback(null, event);
}

