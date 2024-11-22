import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { FaPaperclip } from 'react-icons/fa'

interface TodoAssignmentEmailProps {
  todo: {
    id: string
    title: string
    description: string
    isCompleted: boolean
    owner: string
    createdAt: string
    updatedAt: string
    assignedTo: string
    hasAttachmentsOrLinks: boolean
  }
}

export default function TodoAssignmentEmail({
  todo = {
    id: '123',
    title: 'Example Todo',
    description: 'This is an example todo description.',
    isCompleted: false,
    owner: 'john@example.com',
    createdAt: '2023-05-20T10:00:00Z',
    updatedAt: '2023-05-20T10:00:00Z',
    assignedTo: 'jane@example.com',
    hasAttachmentsOrLinks: true,
  },
}: TodoAssignmentEmailProps) {
  const formattedDate = new Date(todo.createdAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Html>
      <Head />
      <Preview>You got a new Todo - {todo.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New ToDo!</Heading>
          <Text style={text}>
            Hello {todo.assignedTo},
          </Text>
          <Text style={text}>
            You have been assigned a new todo. Here are the details:
          </Text>
          <Section style={todoContainer}>
            <Text style={todoTitle}>
              {todo.title}
              {todo.hasAttachmentsOrLinks && (
                <span style={attachmentIconContainer} title="This todo has attachments or links">
                  <FaPaperclip style={attachmentIcon} />
                  <span style={attachmentBadge}>1+</span>
                </span>
              )}
            </Text>
            <Text style={todoDescription}>{todo.description}</Text>
            <Text style={todoInfo}>
              <strong>Created by:</strong> {todo.owner}<br />
              <strong>Created at:</strong> {formattedDate}<br />
              <strong>Status:</strong> {todo.isCompleted ? 'Completed' : 'Not Completed'}
            </Text>
            {todo.hasAttachmentsOrLinks && (
              <Text style={attachmentNote}>
                This todo has attachments or links. Click "View Todo" for more information.
              </Text>
            )}
          </Section>
          <Section style={buttonContainer}>
            <Button px={20} py={12} style={button} href={`https://yourtodoapp.com/todos/${todo.id}`}>
              View Todo
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This email was sent to {todo.assignedTo}. If you have any questions, please contact the todo owner at {todo.owner}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 48px 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
}

const todoContainer = {
  background: '#f4f4f4',
  borderRadius: '4px',
  padding: '24px',
  marginBottom: '24px',
}

const todoTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
}

const attachmentIconContainer = {
  position: 'relative' as const,
  display: 'inline-flex',
  marginLeft: '8px',
  verticalAlign: 'middle',
  width: '20px',
  height: '20px',
}

const attachmentIcon = {
  width: '20px',
  height: '20px',
  color: '#666',
}

const attachmentBadge = {
  position: 'absolute' as const,
  top: '-6px',
  right: '-6px',
  background: '#5469d4',
  color: 'white',
  borderRadius: '50%',
  padding: '2px',
  fontSize: '8px',
  fontWeight: 'bold',
  minWidth: '12px',
  height: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const todoDescription = {
  fontSize: '16px',
  color: '#555',
  marginBottom: '16px',
}

const todoInfo = {
  fontSize: '14px',
  color: '#666',
}

const attachmentNote = {
  fontSize: '14px',
  color: '#666',
  fontStyle: 'italic',
  marginTop: '16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
}