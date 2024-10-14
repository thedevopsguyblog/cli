import * as commons from './commons.testing'
import { AppSyncClient, EvaluateCodeCommand } from "@aws-sdk/client-appsync";
import * as ctx from "./contexts"

const client = new AppSyncClient({region:'ap-southeast-2'})


test('Book uuid is auto generated', async () => {

    const command = new EvaluateCodeCommand(commons.input('createBook', ctx.createRequestEvent))
    const response = await client.send(command)
    const result = JSON.parse(response.evaluationResult!)
    
    expect(result.key.id.S).toBeDefined()

})

test('Book Title is a string', async () => {

    const command = new EvaluateCodeCommand(commons.input('createBook', ctx.createRequestEvent))
    const response = await client.send(command)
    const result = JSON.parse(response.evaluationResult!)

    // console.log(result.attributeValues.title.S)
    expect(result.attributeValues.title.S).toEqual<String>

})
