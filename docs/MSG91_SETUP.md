# MSG91 SMS Integration for Supabase Auth

This guide explains how to set up MSG91 as the SMS provider for Supabase phone authentication.

## Prerequisites

1. MSG91 account with API access
2. Supabase project with Edge Functions enabled
3. Supabase CLI installed (`npm install -g supabase`)

## Step 1: Create MSG91 Template

1. Log in to [MSG91 Dashboard](https://control.msg91.com)
2. Go to **OTP** → **Templates**
3. Create a new template:
   - **Template Name**: Hapien OTP
   - **Template Content**: `Your Hapien verification code is ##VAR1##. Valid for 10 minutes.`
   - **Variable**: VAR1 (this will contain the OTP)
4. Submit for DLT approval (required for India)
5. Copy the **Template ID** after approval

## Step 2: Get MSG91 Auth Key

1. In MSG91 Dashboard, go to **Settings** → **API Keys**
2. Copy your **Auth Key**

## Step 3: Deploy the Edge Function

### Login to Supabase CLI

```bash
supabase login
```

### Link to your project

```bash
cd hapien
supabase link --project-ref smzwrpwgaobumsdrkdza
```

### Set the secrets

```bash
supabase secrets set MSG91_AUTH_KEY=your_msg91_auth_key
supabase secrets set MSG91_TEMPLATE_ID=your_msg91_template_id
```

### Deploy the function

```bash
supabase functions deploy send-sms --no-verify-jwt
```

Note: `--no-verify-jwt` allows Supabase Auth to call this function without a user JWT.

## Step 4: Configure Supabase Auth Hook

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **Hooks**
3. Find **Send SMS** hook
4. Enable the hook and set:
   - **Hook Type**: HTTP Request
   - **URL**: `https://smzwrpwgaobumsdrkdza.supabase.co/functions/v1/send-sms`
   - **HTTP Headers**: (leave empty, function handles auth)

## Step 5: Disable Twilio (if enabled)

1. Go to **Authentication** → **Providers** → **Phone**
2. Remove Twilio credentials or disable phone provider's built-in SMS
3. Keep Phone Auth enabled

## Testing

### Test the Edge Function directly

```bash
curl -X POST https://smzwrpwgaobumsdrkdza.supabase.co/functions/v1/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"phone": "+919876543210"},
    "sms": {"otp": "123456"}
  }'
```

### Test via the app

1. Go to hapien.com/auth/login
2. Enter phone number: 9876543210
3. Check your phone for the OTP SMS

## Troubleshooting

### Check Edge Function logs

```bash
supabase functions logs send-sms
```

### Common Issues

| Error | Solution |
|-------|----------|
| `MSG91_AUTH_KEY not set` | Run `supabase secrets set MSG91_AUTH_KEY=...` |
| `Invalid template` | Verify template ID and DLT approval status |
| `Invalid mobile number` | Ensure 10-digit number with 91 prefix |
| `Insufficient credits` | Add credits to MSG91 account |

## MSG91 Template Variables

The function sends:
- `VAR1`: The OTP code (e.g., "123456")

If you need additional variables in your template, modify the `msg91Body.recipients` object in the Edge Function.

## Cost Optimization

MSG91 pricing for India:
- Transactional SMS: ~₹0.14-0.18 per SMS
- Consider buying in bulk for lower rates

## Security Notes

1. The Edge Function URL should only be called by Supabase Auth hooks
2. Never expose MSG91_AUTH_KEY in client-side code
3. Rate limiting is handled by Supabase Auth automatically
