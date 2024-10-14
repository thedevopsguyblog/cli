import { SQSEvent } from 'aws-lambda';
import { DynamoDB, QueryCommand, QueryCommandInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { Organisation } from '../API';
import { 
    CognitoIdentityProviderClient, 
    CognitoIdentityProviderClientConfig, 
    AdminUpdateUserAttributesCommand, 
    AdminUpdateUserAttributesCommandInput,
    AdminAddUserToGroupCommand,
    AdminAddUserToGroupCommandInput
} from "@aws-sdk/client-cognito-identity-provider";
  

export const doesOrgExist = async (orgName: string, event:OrgEvent) => {
    const client = new DynamoDB({})
    
    const params:QueryCommandInput = {
        TableName: process.env.ORG_TABLE,
        IndexName: 'orgname-index',
        KeyConditionExpression: 'orgName = :orgName',
        ExpressionAttributeValues: {
            ':orgName': { S: orgName }
        },
        ProjectionExpression:'orgId'
    }

    try {
        const response = await client.send(new QueryCommand(params))
        console.log('Response: ', JSON.stringify(response, null, 2))

        if (response.Items && response.Items.length > 0) {
            const orgId = response.Items[0].orgId.S;
            // If the org exists, update the user with the orgName and orgId
            await updateUsersCustomAttribute(orgName, orgId!, event)
            return true
        } else {
            return false
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Known Error getting org: ', JSON.stringify(error))
            return false
        }
        console.error('Unknown Error getting org: ', error)
        return false
    }
}

export const createOrg = async (orgName: string, uid: string) => {
    const client = new DynamoDB()
    const params:PutItemCommandInput = {
        TableName: process.env.ORG_TABLE,
        Item: {
            orgId: { S: uid },
            orgName: { S: orgName },
            orgSubPlan: { S: 'free' },
            orgAddress: { S: 'N/A' },
            orgMembers: { N: '0' },
            admins: { SS: ['N/A'] }
        },

    }

    try {
        console.log(`Creating the ${orgName} org, with the ${uid} as the admin`)
        const response = await client.send(new PutItemCommand(params))
        if (response.$metadata.httpStatusCode === 200) {
            console.log('Org created')
            return true
        }

    } catch (error) {
        console.error('Error creating org: ', error)
        return false
    }
}

export const updateUsersCustomAttribute = async (orgID:string, uid:string, event:OrgEvent) => {

    const client = new CognitoIdentityProviderClient({})
    const params:AdminUpdateUserAttributesCommandInput = {
        Username: event.userName,
        UserPoolId: event.userPoolId,
        UserAttributes:[
            {
                Name: 'custom:orgName',
                Value: orgID
            },
            {
                Name: 'custom:orgId',
                Value: uid
            }
        ]
    }
    
    try {
        const response = await client.send(new AdminUpdateUserAttributesCommand(params))
        if (response.$metadata.httpStatusCode === 200) {
            console.log(`User ${event.userName} updated with orgName: ${orgID} and orgId: ${uid}`)
            return true
        } else {
            console.error('Error updating user: ', response)
        }
    } catch (error) {
        console.error('Error updating user: ', error)
        return false
    }
}

export const removeRecordFromQueue = async () => {

}

interface OrgEvent {
    version: string;
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    triggerSource: string;
    request: {
        userAttributes: {
            [key: string]: string;
        };
    };
    response: {};
}

interface OrgPayload {
    orgName: string;
    Uid: string;
    event: OrgEvent;
}


export const handler = async (event: SQSEvent, context: any) => {
    console.log('Event: ', JSON.stringify(event, null, 2))
    console.log('Context: ', JSON.stringify(context, null, 2))
    
    for (const record of event.Records) {
        
        const orgPayload:OrgPayload = JSON.parse(record.body)
        console.log('Record: ', JSON.stringify(record, null, 2))

        const orgExists = await doesOrgExist(orgPayload.orgName, orgPayload.event)
        
        // update every user with the orgName and orgId
        
        if (orgExists) {
            console.log(`Org: ${orgPayload.orgName} already exists.`)
            return false
        } else {
            try {
                await createOrg(orgPayload.orgName, orgPayload.Uid)
                await updateUsersCustomAttribute(orgPayload.orgName, orgPayload.Uid, orgPayload.event)
                return true
            } catch (error) {
                console.error('Error creating org: ', error)
                return 'Error creating org'
            }
        } 
        
    }
}