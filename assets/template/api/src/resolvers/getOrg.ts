import {Context, util} from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Organisation, GetOrganisationDetailsQueryVariables} from '../API'

export function request(ctx: Context<GetOrganisationDetailsQueryVariables>){

    return ddb.get<Organisation>({
        key:{ orgId: ctx.args.orgId },
        projection: ["admins", "orgId", "orgName", "orgAddress", "orgMembers", "orgSubPlan"],
    })
}

export function response(ctx:Context) {
    return ctx.result as [Organisation]
}