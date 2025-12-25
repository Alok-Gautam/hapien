'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, Check, AlertCircle } from 'lucide-react'
import { formatPriceINR } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any
  }
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentData: PaymentResult) => void
  amount: number  // in paisa
  itemName: string
  itemDescription?: string
  paymentType: 'hangout' | 'subscription' | 'feature'
  referenceId?: string
  metadata?: Record<string, any>
}

interface PaymentResult {
  paymentId: string
  orderId: string
  referenceId?: string
}

// Load Razorpay script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  itemName,
  itemDescription,
  paymentType,
  referenceId,
  metadata = {}
}: PaymentModalProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      loadRazorpayScript().then(setScriptLoaded)
    }
  }, [isOpen, scriptLoaded])

  const handlePayment = async () => {
    if (!user) {
      setError('Please sign in to continue')
      return
    }

    if (!scriptLoaded) {
      setError('Payment system is loading. Please try again.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          payment_type: paymentType,
          reference_id: referenceId,
          metadata,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Hapien',
        description: itemName,
        order_id: orderData.order.id,
        prefill: {
          email: user.email || '',
        },
        theme: {
          color: '#ec4899', // pink-500
        },
        handler: async function (response: any) {
          // Step 3: Verify payment
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            // Payment successful
            setPaymentComplete(true)
            setIsProcessing(false)

            // Call success callback after showing confirmation
            setTimeout(() => {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                referenceId,
              })
              setPaymentComplete(false)
            }, 1500)

          } catch (verifyError: any) {
            setError(verifyError.message || 'Payment verification failed')
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response: any) {
        setError(response.error.description || 'Payment failed')
        setIsProcessing(false)
      })
      razorpay.open()

    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Something went wrong')
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6">
              {/* Close button */}
              {!isProcessing && !paymentComplete && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {paymentComplete ? (
                // Success state
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-stone-50 mb-2">Payment Successful!</h3>
                  <p className="text-stone-300">Processing your request...</p>
                </motion.div>
              ) : (
                // Payment form
                <div>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-stone-50 mb-1">Complete Payment</h2>
                    <p className="text-sm text-stone-400">Secure payment powered by Razorpay</p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}

                  {/* Item details */}
                  <div className="bg-stone-700/50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-stone-50">{itemName}</p>
                        {itemDescription && (
                          <p className="text-sm text-stone-400">{itemDescription}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-pink-500">{formatPriceINR(amount)}</p>
                    </div>
                  </div>

                  {/* Security notice */}
                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-6 justify-center">
                    <Lock className="w-3 h-3" />
                    <span>Your payment is secure and encrypted</span>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !scriptLoaded}
                    className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : !scriptLoaded ? (
                      <>Loading...</>
                    ) : (
                      <>Pay {formatPriceINR(amount)}</>
                    )}
                  </button>

                  {/* Cancel link */}
                  {!isProcessing && (
                    <button
                      onClick={onClose}
                      className="w-full mt-3 py-2 text-stone-400 hover:text-stone-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
