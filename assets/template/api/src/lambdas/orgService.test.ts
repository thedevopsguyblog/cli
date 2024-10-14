import { SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import * as orgService from './orgService';

const cftMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);

const event = {
    "Records": [
        {
            "messageId": "d1ce8553-6d9e-4b4d-beba-367366cc58e7",
            "receiptHandle": "AQEBPiVV2lySF/pb2goImjPlrOXReBdXuWCNE7EMTKjjaJHbgQu3W1xdH1fGqTHOTqz7ELd4cdbOcTDoVt7XfJrdD5TD/S2gDy/+hz4rGzraxEw19myDofiLq0zX14ruECpdanaH82kgaME8v4BLlB52VdnVaLIVpsFELd3AZUUPSZoPQtm3ViUxKNOZPWUxyO9XXMh5J5yNx3QuvUNynRy3bMY2qqP+NknAggrLLGYp7jIn6D23C3STPL1y7H9LwJ3cuNZ01/bBQac0ISpOj6DYQCmZr9Gq9XEHFf6/b2Hki06a1x7SXcoJnEjibADPgONbGwYT8ZbOkiQHanxoPuEABYjM7HO2PZDDo8ZKCIkjY2eFpAe/GJu0AbYRcI+74ukawzYQDxHzZ8DNJmBMpV/E/48gH/onGt/TIT85e/8T1rU=",
            "body": "{\"OrgID\":\"gmail.com\",\"Uid\":\"f22826de-41e5-4337-96fd-e308c9487228\"}",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "AWSTraceHeader": "Root=1-66eae933-4a060ddd410328ca6818fbc3;Parent=118f608e7b829711;Sampled=0;Lineage=1:d888c085:0",
                "SentTimestamp": "1726671157320",
                "SenderId": "AROAXRKMBMYB7P4UIKXER:DMSpostConfPopulateAttributes",
                "ApproximateFirstReceiveTimestamp": "1726671638299"
            },
            "messageAttributes": {},
            "md5OfBody": "40f05b80632799721fd90f45df19b56e",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:ap-southeast-2:518239905283:DMSOrgCreationQueue",
            "awsRegion": "ap-southeast-2"
        }
    ]
};

describe('orgService handler', () => {
    const mockDoesOrgExist = orgService.doesOrgExist as jest.Mock;
    const mockCreateOrg = orgService.createOrg as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should log and return true if the org already exists', async () => {
        mockDoesOrgExist.mockResolvedValue(true);

        const context = {};

        const result = await orgService.handler(event, context);

        expect(mockDoesOrgExist).toHaveBeenCalledWith('gmail.com');
        expect(mockCreateOrg).not.toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should create the org if it does not exist', async () => {
        mockDoesOrgExist.mockResolvedValue(false);
        mockCreateOrg.mockResolvedValue(undefined);

        const context = {};

        const result = await orgService.handler(event, context);

        expect(mockDoesOrgExist).toHaveBeenCalledWith('gmail.com');
        expect(mockCreateOrg).toHaveBeenCalledWith('gmail.com', 'f22826de-41e5-4337-96fd-e308c9487228');
        expect(result).toBe('Success');
    });

    it('should return an error message if creating the org fails', async () => {
        mockDoesOrgExist.mockResolvedValue(false);
        mockCreateOrg.mockRejectedValue(new Error('Creation failed'));

        const context = {};

        const result = await orgService.handler(event, context);

        expect(mockDoesOrgExist).toHaveBeenCalledWith('gmail.com');
        expect(mockCreateOrg).toHaveBeenCalledWith('gmail.com', 'f22826de-41e5-4337-96fd-e308c9487228');
        expect(result).toBe('Error creating org');
    });
});