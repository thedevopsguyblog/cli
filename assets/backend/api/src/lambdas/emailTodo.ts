import {AppSyncResolverEvent, Handler, Context, Callback} from 'aws-lambda'
import { UpdateItemCommandInput, UpdateItemCommand, DynamoDBClient, UpdateItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { SendEmailCommandInput, SendEmailCommand, SESv2Client} from '@aws-sdk/client-sesv2'
import { Todo, UpdateTodoInput } from '../API';

let returnValues:UpdateItemCommandOutput


const updateDb = async (payload:any):Promise<{response:UpdateItemCommandOutput}> => {
    console.info('Updating DB with:', JSON.stringify(payload));

    const client = new DynamoDBClient();
    const params:UpdateItemCommandInput = {
        TableName: `${process.env.TABLE_NAME}`,
        Key: {
            'id': {S: payload.updateObj.id},
        },
        UpdateExpression: 'set \
        title = :title, \
        description = :description, \
        isCompleted = :isCompleted, \
        assignedTo = :assignedTo, \
        updatedAt = :updatedAt, \
        todoOwner = :todoOwner',
        ExpressionAttributeValues: {
          ':title': { S: payload.updateObj.title },
          ':description': { S: payload.updateObj.description },
          ':isCompleted': { BOOL: payload.updateObj.isCompleted },
          ':assignedTo': { S: payload.updateObj.assignedTo },
          ':updatedAt': { S: payload.updatedAt },
          ':todoOwner': { S: payload.todoOwner },
        },
        ReturnValues: 'ALL_NEW',
      };

    try {
        // TODO: Add condition expression to check if the todoOwner is the same as the one in the DB
        const command = new UpdateItemCommand(params);
        const response = await client.send(command);
        if (!response){
          console.log('DB Update failed', JSON.stringify(response, null, 2));
            throw new Error('DB Update failed');
        }
        console.log('DB Update Success', JSON.stringify(response, null, 2));
        return {response:response};
    } catch (error) {
        console.error('Update failed:', error);
        throw new Error(`Error updating DB: ${error}`);
    }
}

const sendSeS = async (asignee:string):Promise<{success:boolean}> => {
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
    //   const response = await client.send(command);
      return {success:true}
    } catch (error) {
      throw new Error(`Error sending email FROM: ${process.env.NOREPLAY_ADDRESS} to ${returnValues!.Attributes!.assignee.S!} with error:\n${error}`)
    }
    
}

export const handler:Handler = async (event: AppSyncResolverEvent<any>, context: Context, callback: Callback): Promise<{statuscode:number}> => {

//Event example
//   {
//     "todoOwner": "nobelworku@gmail.com",
//     "updatedAt": "2024-11-21T18:46:14.697Z",
//     "updateObj": {
//         "title": "2B",
//         "description": "2",
//         "isCompleted": false,
//         "assignedTo": "",
//         "id": "9330aebf-0d8a-4b9d-9514-139bce34eca4"
//     }
// }
    console.log('Received event:', JSON.stringify(event, null, 2));
    event.updateObj.assignedTo = event.updateObj.assignedTo || "undefined"
    const res = await updateDb(event)
    console.log('DB Update response:', JSON.stringify(res, null, 2));

    return {
        statuscode: 200,
    }
}