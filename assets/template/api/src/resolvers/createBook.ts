import {Context, util} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Book, CreateBookMutationVariables} from '../API'

export function request(ctx: Context<CreateBookMutationVariables>) {
    return ddb.put<Book>({
        key:{ 
            __typename: 'Book', 
            id: util.autoId(),
        },
        item: ctx.args.input
  })
}

export function response (ctx: Context) {
    return ctx.result as Book 
}