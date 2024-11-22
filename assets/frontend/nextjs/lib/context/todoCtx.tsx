"use client"
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { type Todo } from '@/src/API';
import * as queries from '@/src/graphql/queries';
import { logger } from '@/lib/utils';
import { generateClient } from "aws-amplify/api"

const client = generateClient()

// Define action types
type Action = 
    | { type: 'FETCH_TODOS'; payload: Todo[] }
    | { type: 'ADD_TODO'; payload: Todo }
    | { type: 'UPDATE_TODO'; payload: { newTodo: Todo, tempId: string } }
    | { type: 'DELETE_TODO'; payload: string }
    | { type: 'SHOW_ALERT'; payload: string };

// Define the initial state
const initialState: Todo[] = [];

// Create the reducer function
export function todosReducer(state: Todo[], action: Action): Todo[] {
    switch (action.type) {
        case 'FETCH_TODOS':
            return action.payload;
        case 'ADD_TODO':
            return [action.payload, ...state];
        case 'UPDATE_TODO':
            return state.map(todo => {return todo.id === action.payload.tempId ? action.payload.newTodo : todo});
        case 'DELETE_TODO':
            return state.filter(todo => todo.id !== action.payload);
        case 'SHOW_ALERT': 
            return state;
        default:
            return state;
    }
}

// Update the context type to include showAlert function
type TodoContextType = {
    todos: Todo[];
    showAlert: (message: string) => void;
};

/**
 * @description Create the todo context
 */
const TodoContext = createContext<TodoContextType | undefined>(undefined);
/**
 * @description Create the dispatch context
 */
const TasksDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

// Create the provider component
export const TodosProvider = ({ children }: { children: React.ReactNode }) => {
    const [todos, dispatch] = useReducer(todosReducer, initialState);

    const fetchTodos = async () => {
        try {
            const { data, errors } = await client.graphql({
                query: queries.listTodos,
                authMode: "userPool",
                variables: {
                    limit: 20,
                    nextToken: null
                },
            });
            if (data) {
                logger('TodosContext', 'fetchTodos', JSON.stringify(data, null, 2), "debug");
                dispatch({ type: 'FETCH_TODOS', payload: data.listTodos.todos });
            }
            if (errors) {
                logger('TodosContext', 'fetchTodos', JSON.stringify(errors, null, 2), 'error');
            }
        } catch (error) {
            logger('TodosContext', 'fetchTodos', JSON.stringify(error), "error");
            throw new Error(`${JSON.stringify(error, null, 2)}`);
        }
    };

    const showAlert = (message: string) => {
        dispatch({ type: 'SHOW_ALERT', payload: message });
    }

    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <TodoContext.Provider value={{ todos, showAlert }} >
            <TasksDispatchContext.Provider value={dispatch}>
                {children}
            </TasksDispatchContext.Provider>
        </TodoContext.Provider>
    );
};

/**
 * @description Custom hook to use the TodoContext context
 * @returns { todos: Todo[], showAlert: (message: string) => void }
 */
export const useTodos = () => {
    const context = useContext(TodoContext);
    if (context === undefined) {
        throw new Error('useTodos must be used within a TodosProvider');
    }
    return context;
};

/**
 * @description Custom hook to use the TasksDispatchContext context
 * @returns React.Dispatch<Action>
 */
export const useTasksDispatch = () => {
    const context = useContext(TasksDispatchContext);
    if (context === undefined) {
        throw new Error('useTasksDispatch must be used within a TodosProvider');
    }
    return context;
};