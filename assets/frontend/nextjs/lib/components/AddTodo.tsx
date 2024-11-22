'use client'

import React from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { FaPlus } from "react-icons/fa6"
import { type Todo } from "@/src/API"
import { createTodo } from '@/_serverActions/serverUtils'
import { useFormState, useFormStatus } from 'react-dom'
import { useTasksDispatch, useTodos } from '@/lib/context/todoCtx'
import { useToastAlert } from '@/lib/components/ToastAlert'

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
      {pending ? 'Creating...' : 'Create Todo'}

    </Button>
  )
}

export function AddTodo() {
  const dispatch = useTasksDispatch()
  const todos = useTodos()
  const [isPending, startTransition] = React.useTransition()
  const [tempTodo, setTempTodo] = React.useState<Todo | null>(null)
  const showAlert = useToastAlert()

  const formRef = React.useRef<HTMLFormElement>(null)
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()

  const handleCreateTodo = React.useCallback(async (prevState: typeof initialState, formData: FormData) => {
    let newState = { ...prevState, isSubmitting: true }

    try {
      const result = await createTodo(formData);

      if (result?.todo && tempTodo) {
        startTransition(() => {
          dispatch({ type: 'UPDATE_TODO', payload: { newTodo: result.todo!, tempId: tempTodo.id } })
        })
        showAlert(`Todo "${tempTodo.title}" created successfully`, 'success')
      } else {
        showAlert('Failed to create todo', 'error')
        startTransition(() => {
          dispatch({ type: 'DELETE_TODO', payload: tempTodo!.id })
        })
      }

      newState = { ...newState, message: result!.message, isSubmitting: false }
    } catch (error) {
      newState = { ...newState, message: 'Failed to submit request', isSubmitting: false }
      if (tempTodo) {
        showAlert('Failed to create todo', 'error')
        startTransition(() => {
          dispatch({ type: 'DELETE_TODO', payload: tempTodo.id })
        })
      }
    }

    setTempTodo(null)
    return newState;
  }, [dispatch, tempTodo]);

  const [state, formAction] = useFormState(handleCreateTodo, initialState)

  const handleSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newTempTodo: Todo = {
      id: new Date().toISOString(),
      __typename: 'Todo',
      createdAt: new Date().toISOString(),
      owner: 'temp',
      updatedAt: new Date().toISOString(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      isCompleted: false
    }

    setTempTodo(newTempTodo)
    startTransition(() => {
      dispatch({ type: 'ADD_TODO', payload: newTempTodo })
    })
    onClose()
    
    // Use setTimeout to defer the formAction call
    setTimeout(() => {
      formAction(formData)
    }, 0)
  }, [dispatch, onClose, formAction])

  return (
    <>
      <Button onPress={onOpen} color="primary" endContent={<FaPlus />}>
        Add Todo
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
              <form ref={formRef} onSubmit={handleSubmit}>
                <ModalHeader className="flex flex-col gap-1">Add a new todo</ModalHeader>
                <ModalBody>
                  <Input
                    autoFocus
                    label="Title"
                    placeholder="Enter todo title"
                    type='text'
                    variant="bordered"
                    name="title"
                    required
                    min={1}
                  />
                  <Input
                    label="Description"
                    placeholder="Enter todo description"
                    type='text'
                    variant="bordered"
                    name="description"
                    required
                    min={1}
                    errorMessage="Please enter a description"
                  />
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