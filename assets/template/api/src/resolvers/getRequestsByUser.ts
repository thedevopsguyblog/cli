import {Context, util, AppSyncIdentityCognito} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Request, GetRequestsByUserQueryVariables, RequestsConnection} from '../API'

export function request(ctx: Context<GetRequestsByUserQueryVariables>){
    return ddb.query<Request>({
        index:"user-requests",
        query: {requestor: {eq: ctx.args.requestorEmail}},
        limit: ctx.args.limit,
        nextToken: ctx.args.nextToken
    })
}

export function response(ctx:Context) {
    const {items: requests = [], nextToken} = ctx.result
    return {requests, nextToken} as RequestsConnection
}