import { AppSyncIdentityCognito, Context } from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import { GetTodoQuery, GetTodoQueryVariables, Todo } from '../API'

export function request(ctx: Context<GetTodoQueryVariables>) {
	// get a todo by its id if it's the todoOwner
	return ddb.get({ key: { id: ctx.args.id } })
}

export function response(ctx: Context) {
	//if the todoOwner field isn't the same as the identity, the throw
	const identity = ctx.identity as AppSyncIdentityCognito
	if (ctx.result.todoOwner !== identity.username) {
		util.unauthorized()
	}

	return ctx.result as Todo
}