// emails/NewQuoteEmail.tsx
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
} from '@react-email/components';
import * as React from 'react';
import { CSSProperties } from 'react';

interface NewQuoteEmailProps {
  // Basic email info
  recipientName: string;
  
  // Quote details
  quoteContent: string;
  quoteUrl: string;
  authorName: string;
  authorProfileUrl: string;
  
  // Compliance and settings links
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export default function NewQuoteEmail({
  recipientName = 'Reader',
  quoteContent = 'Wisdom begins in wonder.',
  quoteUrl = 'https://gulfquotes.vercel.app/quotes/wisdom-begins-in-wonder',
  authorName = 'Socrates',
  authorProfileUrl = 'https://gulfquotes.vercel.app/authors/socrates',
  unsubscribeUrl = 'https://gulfquotes.vercel.app/users/settings/notifications',
  preferencesUrl = 'https://gulfquotes.vercel.app/users/settings/notifications',
}: NewQuoteEmailProps) {
  // Use a preview text that will display in email clients inbox
  const previewText = `New quote from ${authorName}: "${quoteContent.substring(0, 50)}${quoteContent.length > 50 ? '...' : ''}"`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading as="h1" style={logo}>gulfquotes</Heading>
          </Section>
          
          {/* Greeting */}
          <Section style={section}>
            <Text style={paragraph}>
              Hello {recipientName},
            </Text>
            <Text style={paragraph}>
              {authorName} just shared a new quote on gulfquotes.
            </Text>
          </Section>
          
          {/* Quote Content */}
          <Section style={quoteContainer}>
            <Text style={quoteText}>&quot;{quoteContent}&quot;</Text>
            <Text style={quoteAuthor}>— {authorName}</Text>
          </Section>
          
          {/* CTA Buttons */}
          <Section style={buttonContainer}>
            <Button
              style={primaryButton}
              href={quoteUrl}
            >
              View Quote
            </Button>
            <Button
              style={secondaryButton}
              href={authorProfileUrl}
            >
              Visit Author Profile
            </Button>
          </Section>
          
          {/* Footer with compliance links */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} gulfquotes. All rights reserved.
            </Text>
            <Text style={footerText}>
              You received this email because you&apos;re subscribed to notifications from authors you follow.
            </Text>
            <Text style={footerText}>
              <Link href={preferencesUrl} style={footerLink}>Notification Preferences</Link> • <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  padding: '20px',
  borderBottom: '1px solid #f0f0f0',
};

const logo = {
  color: '#6366f1', // Primary color matching your site
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const section = {
  padding: '0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
};

const quoteContainer = {
  padding: '20px',
  margin: '20px 0',
  backgroundColor: '#f8f8ff',
  borderLeft: '4px solid #6366f1',
};

const quoteText = {
  fontSize: '18px',
  fontStyle: 'italic',
  color: '#111827',
  lineHeight: '28px',
};

const quoteAuthor = {
  fontSize: '16px',
  color: '#4b5563',
  textAlign: 'right' as const,
  marginTop: '10px',
};

const buttonContainer = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const primaryButton: CSSProperties = {
  backgroundColor: '#6366f1',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textTransform: 'none' as React.CSSProperties['textTransform'],
  margin: '0 10px',
  padding: '12px 20px', // Added padding here instead of using pX and pY
};

const secondaryButton: CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid #6366f1',
  borderRadius: '4px',
  color: '#6366f1',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textTransform: 'none' as React.CSSProperties['textTransform'],
  margin: '0 10px',
  padding: '12px 20px', // Added padding here instead of using pX and pY
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footer = {
  padding: '0 20px',
  marginBottom: '20px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const footerLink = {
  color: '#6366f1',
  textDecoration: 'underline',
};