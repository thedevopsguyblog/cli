import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface SignupCodeEmailProps {
    name: string
    email: string
    code: number
}

export default function SignupCodeEmail({ name, email, code }: SignupCodeEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Your signup code for our service</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome, {name}!</Heading>
                    <Text style={text}>
                        Thank you for signing up. To complete your registration, please use the following code:
                    </Text>
                    <Section style={codeContainer}>
                        <Text style={codeText}>{code}</Text>
                    </Section>
                    <Text style={text}>
                        If you didn't request this code, please ignore this email.
                    </Text>
                    <Hr style={hr} />
                    <Text style={footer}>
                        This email was sent to {email}. If you have any questions, please contact our support team.
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
    padding: '20px 0 48px',
    marginBottom: '64px',
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
    textAlign: 'center' as const,
}

const codeContainer = {
    background: '#f4f4f4',
    borderRadius: '4px',
    margin: '16px auto',
    padding: '20px 0',
    width: '280px',
}

const codeText = {
    color: '#000',
    display: 'block',
    fontFamily: 'monospace',
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '6px',
    lineHeight: '40px',
    paddingBottom: '8px',
    textAlign: 'center' as const,
}

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
}

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
}