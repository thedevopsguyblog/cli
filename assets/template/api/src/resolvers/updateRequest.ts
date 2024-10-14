import {Context, util} from '@aws-appsync/utils'
import {Request, UpdateRequestMutationVariables} from '../API'

export function request(ctx: Context<UpdateRequestMutationVariables>) {
  return  {
    operation: 'Invoke',
    payload: { 
        assignee: ctx.args.input.assignment, 
        status: ctx.args.input.status,
        key:{
            id: ctx.args.input.id,
            orgid: ctx.args.input.orgid
        }
    },
  };
}

export function response(ctx:Context) {
  if (ctx.error) {
    util.error(`Error in Lambda: ${ctx.error}`);
  }
  return ctx.result as Request;
}