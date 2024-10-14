import {Context, util} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Book, GetBookQueryVariables} from '../API'

export function request(ctx: Context<GetBookQueryVariables>){
    return ddb.get<Book>({
        key: {id: ctx.args.id},
        projection:['description','image','title']
    })
}

export function response(ctx:Context) {
    return ctx.result.items as [Book]
}