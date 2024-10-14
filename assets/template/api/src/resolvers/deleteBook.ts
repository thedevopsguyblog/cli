import { Context, util } from "@aws-appsync/utils";
import * as ddb from '@aws-appsync/utils/dynamodb'
import {Book, DeleteBookMutationVariables} from '../API'

export function request(ctx:Context<DeleteBookMutationVariables>){
    return ddb.remove<Book>({
        key:{
            __typename: 'Book', 
            title: ctx.args.input.title,
            authorId: ctx.args.input.authorId
        },
    })
}

export function response(ctx:Context){
    const {error, result} = ctx;
    if (error){
        return util.appendError(`Deleting the Item from the DB failed with this error:\n${error.message}`, error.type, result)    
    }
    return ctx.result
}