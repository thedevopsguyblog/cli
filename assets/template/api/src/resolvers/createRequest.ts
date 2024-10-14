import {Context, util, AppSyncIdentityCognito} from '@aws-appsync/utils'
import {Request, CreateRequestMutationVariables} from '../API'

export function request(ctx: Context<CreateRequestMutationVariables>) {
  return  {
    operation: 'Invoke',
    payload: {
      ctx: ctx,
    },
  };
}

export function response(ctx:Context) {
  if (ctx.error) {
    util.error(`Error in Lambda: ${ctx.error}`);
  }
  return ctx.result as Request;
}