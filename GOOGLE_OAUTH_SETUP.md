# Google OAuth Setup Guide

## Overview
The login page now has Google OAuth as the primary authentication method. This solves the iOS PWA magic link issue where clicking email links opened Safari instead of staying in the PWA.

## What You Need To Do

### Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **Hapien** project
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab
5. Find **Google** in the list
6. Toggle it **ON**

### Step 2: Configure Google OAuth Credentials

You need to create a Google OAuth app:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the consent screen if prompted:
   - User Type: **External**
   - App name: **Hapien**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**

6. Create OAuth Client:
   - Application type: **Web application**
   - Name: **Hapien**

7. Add Authorized redirect URIs:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```

   **How to find your project ref:**
   - Go to Supabase Dashboard → Settings → API
   - Look for "Project URL": `https://xxxxx.supabase.co`
   - The `xxxxx` part is your project ref

   **Example:**
   - If your project URL is `https://abc123.supabase.co`
   - Your redirect URI should be: `https://abc123.supabase.co/auth/v1/callback`

8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### Step 3: Add Credentials to Supabase

1. Go back to Supabase Dashboard → Authentication → Providers → Google
2. Paste your **Client ID** into the "Client ID" field
3. Paste your **Client Secret** into the "Client Secret" field
4. Click **Save**

### Step 4: Test It!

1. Go to your deployed site: https://hapien.vercel.app/auth/login
2. Click **"Continue with Google"**
3. It should redirect you to Google
4. After authorizing, you should be redirected back to Hapien and logged in!

## What Changed?

### Before (Magic Link):
- User clicks login → enters email → checks email → clicks link
- **Problem:** Link opens in Safari, not PWA
- **Result:** Two separate instances, session doesn't work in PWA

### After (Google OAuth):
- User clicks "Continue with Google" → authorizes → logged in!
- **OAuth redirect stays within PWA context**
- **Result:** Works perfectly on iOS PWA!

## Troubleshooting

### "OAuth error: Invalid redirect URI"
- Make sure you added the correct redirect URI in Google Console
- Format: `https://[project-ref].supabase.co/auth/v1/callback`
- Check for typos

### "OAuth error: Access blocked"
- Your Google OAuth app might be in testing mode
- Go to Google Console → OAuth consent screen
- Click **Publish App** to make it available to everyone
- OR add your test users' emails in the "Test users" section

### Google button does nothing
- Check browser console for errors
- Make sure you saved the credentials in Supabase
- Try clearing cache and reloading

## Fallback Option

Magic link authentication is still available as a fallback! If Google OAuth has any issues, users can still use the email magic link option below the divider.

## Next Steps

Once Google OAuth is working:
- Consider adding "Sign in with Apple" (Apple requires it if you have Google)
- Monitor which auth method users prefer
- Can remove magic link entirely if everyone uses Google

## Questions?

If you run into issues, check:
1. Supabase logs: Dashboard → Logs → Auth
2. Browser console: F12 → Console
3. Network tab: F12 → Network (look for failed requests)
