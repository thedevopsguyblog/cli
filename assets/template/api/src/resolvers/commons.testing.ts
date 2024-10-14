/**
 * @description common functions for all tests to share 
 */

// import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { AppSyncClient, EvaluateCodeCommandInput, ListApiKeysCommand, } from "@aws-sdk/client-appsync";
import * as fs from "fs";
import { Context } from "@aws-appsync/utils";

/**
 * @param fileNameToTest Pass the filename to test, `./api/build/x.js`
 * @param context The 'context' is a JSON payload that emulates what unit resolvers will recieve so configure a context to test against. You can select one from the `context.test.js` file. Read [test-resolvers](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-reference-overview-js.html#test-resolvers) for more info.
 * @param functionType Will default to response
 * @returns EvaluateCodeCommandInput
 */
export function input(fileNameToTest:string, context:Partial<Context>, runtimeVersion:string = '1.0.0',functionType:string = 'request'){

    var input:EvaluateCodeCommandInput = {
        code: fs.readFileSync(`./api/build/${fileNameToTest}.js`, 'utf-8'),
        context: JSON.stringify(context),
        runtime: { 
            name:'APPSYNC_JS', 
            runtimeVersion,
        },
        function:functionType
    }

    return input
}

/**
 * 
 * @returns AppSync Api ID used to by getApiKey()
export async function getApiId() {
    var apiId = (await new SSMClient().send(new GetParameterCommand({Name: '/ARMA/api/id'}))).Parameter?.Value
    return apiId
}

/**
 * 
 * @returns AppSync API Key used to auth with AppSync to debug tests.

export async function getApiKey() {
    var apiKey = (await (await new AppSyncClient().send(new ListApiKeysCommand({apiId: `${await getApiId()}`})))).apiKeys![0].id
    return apiKey
}

*/
