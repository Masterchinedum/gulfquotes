// emails/test.tsx
import { render } from '@react-email/render';
import NewQuoteEmail from './NewQuoteEmail';

// Render the email to HTML
const html = render(
  <NewQuoteEmail 
    recipientName="Test User"
    quoteContent="The greatest glory in living lies not in never falling, but in rising every time we fall."
    authorName="Nelson Mandela"
    quoteUrl="https://quoticon.vercel.app/quotes/greatest-glory"
    authorProfileUrl="https://quoticon.vercel.app/authors/nelson-mandela"
    unsubscribeUrl="https://quoticon.vercel.app/unsubscribe?token=123"
    preferencesUrl="https://quoticon.vercel.app/settings/notifications"
  />
);

console.log(html);