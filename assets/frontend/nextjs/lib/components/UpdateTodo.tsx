"use client";

import React from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, Checkbox } from '@nextui-org/react'
import { FaPen } from 'react-icons/fa6'
import { updateTodo } from '@/_serverActions/serverUtils'
import { Todo } from '@/src/API';
import { useTasksDispatch } from '@/lib/context/todoCtx'
import { useFormState, useFormStatus } from 'react-dom'
import { useToastAlert } from '@/lib/components/ToastAlert'
import { logger } from '@/lib/utils'

const initialState = {
    message: "",
    isSubmitting: false
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className='w-full'
            disabled={pending}
            variant='flat'
            color={pending ? 'warning' : 'default'}
            isLoading={pending}
        >
            {pending ? 'Updating...' : 'Update Todo'}
        </Button>
    )
}

export function UpdateTodo({ todo }: { todo: Todo }) {
    const dispatch = useTasksDispatch()
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
    const [tempTodo, setTempTodo] = React.useState<Todo | null>(null)
    const [isCompleted, setIsCompleted] = React.useState(todo.isCompleted)
    const showAlert = useToastAlert()

    const handleUpdateTodo = React.useCallback(async (prevState: typeof initialState, formData: FormData) => {
        let newState = { ...prevState, isSubmitting: true }

        try {
            const result = await updateTodo(formData);

            if (result?.todo) {
                dispatch({ type: 'UPDATE_TODO', payload: { newTodo: result.todo, tempId: todo.id } })
                newState = { ...newState, message: result.message, isSubmitting: false }
                showAlert(`Todo "${todo.title}" updated successfully`, 'success')
                
            } else {
                showAlert(`Failed to update todo "${todo.title}"`, 'warning')
                throw new Error(`Message:${result.message}\nError${result.error}`)
            }
        } catch (error) {
            newState = { ...newState, message: 'Failed to update todo', isSubmitting: false }
            // Revert optimistic update
            if (tempTodo) {
                dispatch({ type: 'UPDATE_TODO', payload: { newTodo: tempTodo, tempId: todo.id } })
            }
        }

        setTempTodo(null)
        return newState;
    }, [dispatch, todo]);

    const [state, formAction] = useFormState(handleUpdateTodo, initialState)

    const handleSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.append('id', todo.id)
        formData.set('isCompleted', isCompleted.toString())

        const updatedTodo: Todo = {
            ...todo,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            isCompleted: isCompleted
        }

        setTempTodo(todo)
        dispatch({ type: 'UPDATE_TODO', payload: { newTodo: updatedTodo, tempId: todo.id } })
        onClose()

        // Use setTimeout to defer the formAction call
        setTimeout(() => { formAction(formData) }, 0)

    }, [dispatch, onClose, formAction, todo, isCompleted])

    return (
        <>
            <Button
                isIconOnly
                size="lg"
                variant="light"
                onPress={onOpen}
            >
                <FaPen className='text-green-500' />
            </Button>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    <form onSubmit={handleSubmit}>
                        <ModalHeader className="flex flex-col gap-1">Edit Todo</ModalHeader>
                        <ModalBody>
                            <Input
                                autoFocus
                                label="Title"
                                placeholder="Enter todo title"
                                type='text'
                                variant="bordered"
                                name="title"
                                defaultValue={todo.title}
                            />
                            <Input
                                label="Description"
                                placeholder="Enter todo description"
                                type='text'
                                variant="bordered"
                                name="description"
                                defaultValue={todo.description}
                            />
                            <Input
                                label="assignedTo"
                                placeholder="assignedTo@domain.com"
                                type='email'
                                variant="bordered"
                                name="assignedTo"
                                isInvalid={true}
                                errorMessage="Invalid email address"
                                defaultValue={todo.assignedTo || undefined}
                            />
                            <Checkbox
                                isSelected={isCompleted}
                                onValueChange={setIsCompleted}
                            >
                                Mark as completed
                            </Checkbox>
                        </ModalBody>
                        <ModalFooter>
                            <SubmitButton />
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    )
}