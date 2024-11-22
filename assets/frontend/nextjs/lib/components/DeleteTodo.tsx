"use client"
import React from 'react'
import { Button } from '@nextui-org/react'
import { FaTrash } from 'react-icons/fa6'
import { deleteTodo } from '@/_serverActions/serverUtils'
import { logger } from '@/lib/utils'
import { useTasksDispatch, useTodos } from '@/lib/context/todoCtx'
import { Todo } from '@/src/API'
import { useToastAlert } from '@/lib/components/ToastAlert'

const handleDeleteTodo = async (todoId: string, dispatch: React.Dispatch<any>, todos: Todo[]) => {
    const previousTodos = [...todos]
    const showAlert = useToastAlert()

    dispatch({ type: 'DELETE_TODO', payload: todoId })

    try {
        const res = await deleteTodo(todoId)

        if (res.message == 'Todo Deleted') {
            showAlert(`Todo Deleted ${res.todo?.title}`, 'success')
        }

        if (res.message !== 'Todo Deleted') {
            showAlert(`Whoops something went wrong: ${res.todo?.title}`, 'error')
            throw new Error(res.message)
        }
    } catch (error) {
        dispatch({ type: 'FETCH_TODOS', payload: previousTodos })
    }
}

/**
 * @description Render a trash can to handle the deletion of a todo.
 * @returns string
 */
export function DeleteTodo({id}: {id:string}) {
    const dispatch = useTasksDispatch()
    const todos = useTodos()
    
    return (
        <>
            <Button
                isIconOnly
                size="lg"
                variant="light"
                onPress={() => handleDeleteTodo(id, dispatch, todos.todos)}
            >
                <FaTrash className="text-red-500" />
            </Button>
        </>
    )
}