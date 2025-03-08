// emails/test.tsx
import { render } from '@react-email/render';
import NewQuoteEmail from './NewQuoteEmail';

// Render the email to HTML
const html = render(
  <NewQuoteEmail 
    recipientName="Test User"
    quoteContent="The greatest glory in living lies not in never falling, but in rising every time we fall."
    authorName="Nelson Mandela"
    quoteUrl="https://gulfquotes.vercel.app/quotes/greatest-glory"
    authorProfileUrl="https://gulfquotes.vercel.app/authors/nelson-mandela"
    unsubscribeUrl="https://gulfquotes.vercel.app/unsubscribe?token=123"
    preferencesUrl="https://gulfquotes.vercel.app/settings/notifications"
  />
);

console.log(html);