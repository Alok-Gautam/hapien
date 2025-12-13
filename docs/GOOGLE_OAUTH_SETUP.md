# Google OAuth Setup Guide for Hapien

This guide explains how to set up Google OAuth authentication for Hapien using Supabase.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name for reference

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace org)
3. Fill in the required fields:
   - **App name**: Hapien
   - **User support email**: Your email
   - **App logo**: (optional) Upload your app logo
   - **App domain**: Your domain (e.g., hapien.com)
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**
7. Add test users if in testing mode (your email)
8. Click **Save and Continue** → **Back to Dashboard**

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Name it (e.g., "Hapien Web Client")
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (Supabase callback)
7. Click **Create**
8. **Save the Client ID and Client Secret** - you'll need these!

## Step 4: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Google provider** ON
6. Enter your credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Add **Redirect URLs** (these should already be configured):
   - Copy the callback URL shown (looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`)
   - Make sure this URL is added to your Google OAuth Authorized redirect URIs
8. Click **Save**

## Step 5: Update Site URL in Supabase

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your domain:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
4. Click **Save**

## Step 6: Update Environment Variables

In your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update `NEXT_PUBLIC_APP_URL` to your domain.

## Step 7: Update Database Schema

Run the updated schema that supports email instead of required phone:

```sql
-- If you already have the users table, run this migration:
ALTER TABLE public.users 
  ALTER COLUMN phone DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
```

Or run the full `schema.sql` file if setting up fresh.

## Testing

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Get Started" → "Continue with Google"
4. Sign in with your Google account
5. You should be redirected to onboarding (if new) or feed (if returning)

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure the callback URL in Google Cloud matches exactly what Supabase uses
- Check that `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` is in your authorized redirect URIs

### "Access blocked" error
- Your OAuth consent screen may be in testing mode
- Add your email as a test user, or publish the app

### User not redirecting properly
- Check the Site URL in Supabase Authentication settings
- Verify NEXT_PUBLIC_APP_URL matches your actual domain

### Profile not created
- Check the RLS policies on the users table
- Ensure the callback route can insert new users

## Security Notes

1. Never commit your `.env.local` file
2. Use environment variables in production deployments
3. In production, publish your OAuth consent screen or verify your app with Google
4. Consider setting up Google Workspace if you want to restrict to your organization
