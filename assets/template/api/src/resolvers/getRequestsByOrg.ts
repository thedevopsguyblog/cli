import {Context, util} from '@aws-appsync/utils'
import type { AppSyncIdentityCognito } from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {GetRequestsByOrgQueryVariables, RequestsConnection, Request, RequestStatus} from '../API'


export function request(ctx: Context<GetRequestsByOrgQueryVariables>){
    return ddb.query<Request>({
        index:"org-requests",
        query:{orgid:{eq:ctx.args.orgid}, status:{eq:ctx.args.status}},
        limit: ctx.args.limit,
        nextToken: ctx.args.nextToken
    })
}

export function response(ctx:Context) {
    const {items: requests = [], nextToken} = ctx.result
    return {requests, nextToken} as RequestsConnection
}