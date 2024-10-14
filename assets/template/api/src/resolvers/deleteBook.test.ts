import * as commons from './commons.testing'
import { AppSyncClient, EvaluateCodeCommand } from "@aws-sdk/client-appsync";
import * as ctx from "./contexts"

const client = new AppSyncClient({region:'ap-southeast-2'})


test('Book is deleted', async () => {

    const command = new EvaluateCodeCommand(commons.input('deleteBook', ctx.deleteBookEvent ))
    const response = await client.send(command)
    const result = JSON.parse(response.evaluationResult!)
    
    console.log(result)
    expect(result.key.title).toBeDefined()
    

})