import {Context, util} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Book, UpdateBookMutationVariables} from '../API'

export function request(ctx: Context<UpdateBookMutationVariables>) {
    return ddb.update<Book>({
        key:{__typename:'Book',
        authorId:ctx.args.input.authorId, }
    })
}

export function response (ctx: Context) {
    return ctx.result as Book 
}