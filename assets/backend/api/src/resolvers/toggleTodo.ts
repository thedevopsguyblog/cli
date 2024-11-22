import { AppSyncIdentityCognito, Context, util } from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import { Todo, ToggleTodoMutationVariables } from '../API'

export function request(ctx: Context<ToggleTodoMutationVariables>) {
	const id = ctx.args.input.id
	const todoOwner = (ctx.identity as AppSyncIdentityCognito).username
	const now = util.time.nowISO8601()

	// update it if todoOwner.
	const updateObj: ddb.DynamoDBUpdateObject<Todo> = {
		isCompleted: ddb.operations.replace(ctx.args.input.isCompleted),
		updatedAt: ddb.operations.replace(now),
	}

	return ddb.update({
		key: { id },
		update: updateObj,
		condition: { todoOwner: { eq: todoOwner } },
	})
}

export function response(ctx: Context) {
	return ctx.result as Todo
}