import {Context, util} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Book, ListBooksQueryVariables} from '../API'

export function request(ctx: Context<ListBooksQueryVariables>){
    const {limit = 20, nextToken} = ctx.arguments
    return ddb.scan<Book>({
        limit, 
        nextToken
    })
}

export function response(ctx:Context) {
    const {items: posts = [], nextToken} = ctx.result
    return {posts, nextToken}
}