# Razorpay Payment Integration Setup

This guide explains how to set up Razorpay payments for Hapien.

## 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in
3. Complete KYC verification (required for live mode)

## 2. Get API Keys

1. Go to **Settings** → **API Keys**
2. Generate a new key pair
3. Copy the **Key ID** and **Key Secret**

> **Important:** Use Test mode keys for development, Live mode keys for production.

## 3. Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

For Vercel deployment, add these in:
- Vercel Dashboard → Project → Settings → Environment Variables

## 4. Database Setup

Run this SQL in your Supabase SQL Editor to create the payments table:

```sql
-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL, -- in paisa
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('hangout', 'subscription', 'feature')),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);
```

## 5. Usage

### Basic Example

```tsx
import { PaymentModal } from '@/components/payments'

function MyComponent() {
  const [showPayment, setShowPayment] = useState(false)

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result)
    // Handle success - create hangout, etc.
  }

  return (
    <>
      <button onClick={() => setShowPayment(true)}>
        Create Paid Hangout
      </button>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        amount={9900}  // ₹99.00 in paisa
        itemName="Premium Hangout"
        itemDescription="Create a featured hangout"
        paymentType="hangout"
        referenceId="optional-hangout-id"
      />
    </>
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | () => void | Yes | Called when modal is closed |
| `onSuccess` | (result) => void | Yes | Called after successful payment |
| `amount` | number | Yes | Amount in paisa (₹1 = 100 paisa) |
| `itemName` | string | Yes | Name shown in checkout |
| `itemDescription` | string | No | Description shown in checkout |
| `paymentType` | 'hangout' \| 'subscription' \| 'feature' | Yes | Type of payment |
| `referenceId` | string | No | ID to link payment to (e.g., hangout ID) |
| `metadata` | object | No | Additional data to store |

### Payment Result

```ts
interface PaymentResult {
  paymentId: string    // Razorpay payment ID
  orderId: string      // Razorpay order ID
  referenceId?: string // Your reference ID
}
```

## 6. Testing

### Test Card Numbers

| Card | Number |
|------|--------|
| Success | 4111 1111 1111 1111 |
| Failure | 4111 1111 1111 1234 |

- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **OTP:** 1234 (for test mode)

### Test UPI

- **Success:** success@razorpay
- **Failure:** failure@razorpay

## 7. Webhooks (Optional)

For production, configure webhooks in Razorpay Dashboard:

1. Go to **Settings** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy the webhook secret

Add to environment:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## 8. Going Live

1. Complete Razorpay KYC verification
2. Switch to Live mode in Razorpay Dashboard
3. Generate Live API keys
4. Update environment variables with Live keys
5. Test with small real payment
