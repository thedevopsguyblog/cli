"use server";
import * as gqlMutations from "@/src/graphql/mutations";
import { cookieBasedClient } from "@/amplifyServerUtils";
import { z } from "zod";
import { Todo } from "@/src/API";
import { logger } from "@/lib/utils";

export async function createTodo(formData: FormData): Promise<{ message: string, todo?: Todo, error?: string } | undefined> {
    // Convert FormData to a plain object
    const submittedFormData = Object.fromEntries(formData.entries());
    submittedFormData.isCompleted == "false"

    const formSchema = z.object({
        description: z.string().min(1).max(100),
        title: z.string(),
        isCompleted: z.boolean(),
    });

    // Validate the form data
    const validatedData = formSchema.safeParse({
        description: submittedFormData.description,
        title: submittedFormData.title,
        isCompleted: formData.get('isCompleted') === 'true',
    });

    if (validatedData.error) {
        if (Error instanceof z.ZodError) {
            return { 
                message: 'Form Error', 
                error:`${validatedData.error.flatten().fieldErrors}\n${validatedData.error.flatten().formErrors}`
            }
        } else {
            console.error("Form Payload Error:",JSON.stringify(submittedFormData, null, 2));
            return {
                message: `Whoops, \n There was an issues with the ${validatedData.error.issues[0].path
                    } field. ${validatedData.error.issues[0].message}`,
            };
        }
    }

    try {
        const { data, errors, extensions } = await cookieBasedClient.graphql({
            query: gqlMutations.createTodo,
            authMode: "userPool",
            variables: {
                input: {
                    ...validatedData.data,
                },
            }
        })

        if (errors) {
            console.error(`Error Server Util: ${JSON.stringify(errors, null, 2)}`);
            return {
                message: errors[0].message,
                error: JSON.stringify(errors[0], null, 2)
            }
        }

        if (data.createTodo) {
            return { message: "Request Submitted", todo: data.createTodo };
        } else {
            throw new Error("Failed to create request");
        }
    } catch (error) {
        if (error instanceof Error) {
            switch (error.cause) {
                case "ValidationError":
                    return { message: `Validation failed: ${error.message}`, error: error.name};
                default:
                    return {
                        message:"Failed to Submit Request - Please contact support",
                        error: JSON.stringify(error, null, 2)
                    };
            }
        }
        if (error instanceof z.ZodError) {
            return {
                message: `Validation failed: ${error.errors.map((e) => e.message).join(", ")
                    }`,
            };
        }
    }
}

export async function deleteTodo(id: string): Promise<{ error?: string, message: string, todo?: Todo }> {
    console.info(`Deleting ${id}`)
    try {
        const { data, errors } = await cookieBasedClient.graphql({
            query: gqlMutations.deleteTodo,
            authMode: "userPool",
            variables: {
                id,
            },
        });

        if (data.deleteTodo) {
            return { message: "Todo Deleted", todo: data.deleteTodo };
        } else {
            return {
                message: "Failed to delete Todo - Please contact support",
                error: JSON.stringify(errors, null, 2)
            }
        }

    } catch (error) {
        return {
            message: "Failed to delete Todo - Please contact support",
            error: error as string
        };
    }
}

export async function updateTodo(formData: FormData): Promise<{ error?: string, message: string, todo?: Todo }> {

    const submittedFormData = Object.fromEntries(formData.entries());
    logger('SU', 'updateTodo', JSON.stringify(submittedFormData, null, 2), 'debug');

    const formSchema = z.object({
        description: z.string().min(1).max(100),
        id: z.string(),
        isCompleted: z.boolean(),
        title: z.string(),
        assignedTo: z.string().email().optional(),
    });

    const strToBool = async () => {
        return submittedFormData.isCompleted === 'true' ? true : false;
    };

    const validatedData = formSchema.safeParse({
        description: submittedFormData.description,
        id: submittedFormData.id,
        isCompleted: await strToBool(),
        title: submittedFormData.title,
        assignedTo: submittedFormData.assignedTo,
    })

    if (validatedData.error) {
        console.error(`error: ${JSON.stringify(validatedData.error.flatten().fieldErrors, null, 2)}, message: Error updating Todo`)
        return {
            error: validatedData.error.flatten().fieldErrors as string,
            message: `Error updating Todo`//TODO: Add more details
        }
    }


    try {
        const { data, errors } = await cookieBasedClient.graphql({
            query: gqlMutations.updateTodo,
            authMode: "userPool",
            variables: {
                input: {
                    description: validatedData.data.description,
                    id: validatedData.data.id,
                    isCompleted: validatedData.data.isCompleted,
                    title: validatedData.data.title,
                    assignedTo: validatedData.data.assignedTo,
                }
            },
        });

        if (data.updateTodo) {
            return { message: "Todo Updated", todo: data.updateTodo };
        } else {
            return { message: `Error Updating Todo:\n${errors}`, todo: undefined };
        }

    } catch (error) {
        return {
            error: JSON.stringify(error, null, 2),
            message: `Failed to update Todo`,
        };
    }
}

export async function toggleTodo(id:string, isCompleted:boolean):Promise<{ error?: string, message: string, todo?: Todo }> {
    
    const formSchema = z.object({
        id: z.string(),
        isCompleted: z.boolean(),
    });

    const validatedData = formSchema.safeParse({
        id,
        isCompleted,
    })

    if (validatedData.error){
        return {
            message: validatedData.error.message,
            error: validatedData.error.flatten().fieldErrors as string,
        }
    }

    try {
        const { data, errors } = await cookieBasedClient.graphql({
            query: gqlMutations.toggleTodo,
            authMode: "userPool",
            variables: {
                input:{
                    id: validatedData.data.id,
                    isCompleted: validatedData.data.isCompleted as boolean
                }
            },
        });

        if (data.toggleTodo) {
            return { message: "Todo Updated", todo: data.toggleTodo };
        } else {
            return { message: `Error Updating Todo:${errors}`, todo: data.toggleTodo };
        }

    } catch (error) {
        console.error(`error: ${JSON.stringify(error, null, 2)}\n, message: Failed to update Todo`)
        return {error: JSON.stringify(error, null, 2), message: `Failed to update Todo`};
    }

}