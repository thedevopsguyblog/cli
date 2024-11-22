import { AppSyncIdentityCognito, Context, util } from '@aws-appsync/utils'
import { Todo, UpdateTodoInput, UpdateTodoMutationVariables } from '../API'

export function request(ctx: Context<UpdateTodoMutationVariables>) {

	const now = util.time.nowISO8601()

	const updateObj:UpdateTodoInput = {
		title: ctx.args.input.title,
		description: ctx.args.input.description,
		isCompleted: ctx.args.input.isCompleted,
		assignedTo: ctx.args.input.assignedTo,
		id: ctx.args.input.id,
	}

	return {
		operation: 'Invoke',
		payload: {
			todoOwner: (ctx.identity as AppSyncIdentityCognito).username,
			updatedAt: now,
			updateObj: updateObj,
		}
	}
}

export function response(ctx: Context) {
	return ctx.result
}