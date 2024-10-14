import { Context, Callback, AppSyncResolverEvent } from 'aws-lambda';
import { PutItemCommandInput, PutItemCommand, DynamoDBClient, PutItemCommandOutput } from '@aws-sdk/client-dynamodb';


const createReqInDb = async (payload: any) => {
    console.log(`Creating ${process.env.TABLE_NAME} with: ${payload.assignee} and status ${payload.status}`);

    const client = new DynamoDBClient();
    const params: PutItemCommandInput = {
        TableName: process.env.TABLE_NAME,
        
        // {
        //     "requestor": "tigicacujolo@gotgel.org",
        //     "class": "XXXEnvironmental SciencesXXXX",
        //     "yeargroup": 1,
        //     "description": "Lessons 4-5 & google.classroom.com",
        //     "subDate": "2024-08-08T11:13:12.464Z",
        //     "location": "2XX",
        //     "status": "open",
        //     "orgid": "gotgel.org"
        // }
        
        Item: {
            "requestor": { S: payload.key.requestor },
            "class": { S: payload.key.class },
            "yeargroup": { N: payload.key.yeargroup},
            "description": { S: payload.key.description },
            "subDate": { S: payload.key.subDate },
            "location": { S: payload.key.location },
            "status": { S: payload.key.status },
            "orgid": { S: payload.key.orgid },
        }
    };

    try {
        const command = new PutItemCommand(params);
        const response = await client.send(command);
        if (!response){
            throw new Error(JSON.stringify({message:`Creating the Request failed`, code: 500}));
        }
        return response;
    } catch (error) {
        console.error('Update failed:', error);
        throw new Error(JSON.stringify({message:`Creating the Request Errored: ${error}`, code: 500}));
    }
}

export const handler = async (event: AppSyncResolverEvent<any>, context: Context, callback: Callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
    console.log('Env Vars', JSON.stringify(process.env, null, 2));

    // try {
    //     const response = await createReqInDb(event.arguments.input);
    //     return response;
    // } catch (error) {
    //     console.error('Error:', error);
    // }
    return { code: 200, message: 'Success' };
}

