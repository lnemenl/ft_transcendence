import { google } from 'googleapis';

// 1. CLIENT_ID - Your app's unique ID (public, registered with Google)
// 2. CLIENT_SECRET - Your app's password
// 3. REDIRECT_URI - Where Google sends the user after they approve
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);
