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

interface SignupSuccessEmailProps {
    name: string
    email: string
    link: string
}

export default function SignupSuccessEmail({ name, email, link }: SignupSuccessEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Welcome to our service! Your account is ready.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome aboard, {name}!</Heading>
                    <Text style={text}>
                        Your account has been successfully created. We're excited to have you as a member of our community.
                    </Text>
                    <Section style={buttonContainer}>
                        <Button px={20} py={12} style={button} href={link}>
                            Go to Dashboard
                        </Button>
                    </Section>
                    <Text style={text}>
                        If the button above doesn't work, you can also click on this link:
                    </Text>
                    <Link href={link} style={link}>
                        {link}
                    </Link>
                    <Hr style={hr} />
                    <Text style={footer}>
                        This email was sent to {email}. If you have any questions, please don't hesitate to contact our support team.
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

const link = {
    color: '#5469d4',
    textDecoration: 'underline',
    textAlign: 'center' as const,
    display: 'block',
    margin: '16px 0',
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