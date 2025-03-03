import { Resend } from 'resend'
import { render } from '@react-email/render'
import NewQuoteEmail from '../emails/NewQuoteEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const domain = process.env.NEXT_PUBLIC_APP_URL

export async function sendVerificationEmail(
  email: string,
  token: string,
) {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`

  await resend.emails.send({
    from: 'Quoticon <onboarding@resend.dev>',
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
) {
  const resetLink = `${domain}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: 'Quoticon <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  })
}

export async function sendTwoFactorTokenEmail(
  email: string,
  token: string,
) {
  await resend.emails.send({
    from: 'Quoticon <onboarding@resend.dev>',
    to: email,
    subject: '2FA Code',
    html: `<p>Your 2FA Code: ${token}</p>`
  })
}

/**
 * Send an email notification when an author a user follows posts a new quote
 */
export async function sendNewQuoteEmail(
  email: string,
  recipientName: string,
  quoteContent: string,
  quoteId: string,
  authorName: string,
  authorSlug: string,
) {
  // Generate URLs
  const quoteUrl = `${domain}/quotes/${quoteId}`;
  const authorProfileUrl = `${domain}/authors/${authorSlug}`;
  const unsubscribeUrl = `${domain}/users/settings/notifications`;
  const preferencesUrl = `${domain}/users/settings/notifications`;

  // Render the React Email template to HTML and await the result
  const html = await render(
    <NewQuoteEmail 
      recipientName={recipientName}
      quoteContent={quoteContent}
      quoteUrl={quoteUrl}
      authorName={authorName}
      authorProfileUrl={authorProfileUrl}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    />
  );

  // Send the email
  await resend.emails.send({
    from: 'Quoticon <onboarding@resend.dev>', // Using display name with Resend domain
    to: email,
    subject: `New Quote from ${authorName} on Quoticon`,
    html, // Now this is a string, not a Promise<string>
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`
    },
    tags: [
      { name: 'notification_type', value: 'new_quote' },
      { name: 'author', value: 'new_quote' }
    ]
  });
}