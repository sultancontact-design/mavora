import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  VerifyPaymentParams,
  VerifyResult,
  WebhookResult,
  RefundParams,
  RefundResult,
  PaymentStatusResult,
} from '@/lib/types';

const SANDBOX_ERROR = 'Sandbox mode - Stripe not configured. Set STRIPE_SECRET_KEY environment variable.';

function isConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createCheckout(_params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }
    // Real Stripe integration would go here
    // const session = await stripe.checkout.sessions.create({...});
    return {
      success: false,
      error: 'Stripe checkout not yet implemented for production use.',
    };
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyResult> {
    if (!isConfigured()) {
      return { success: false, status: 'pending', error: SANDBOX_ERROR };
    }
    void params;
    return {
      success: false,
      status: 'pending',
      error: 'Stripe payment verification not yet implemented.',
    };
  },

  async handleWebhook(_body: unknown, _headers: Record<string, string>): Promise<WebhookResult> {
    if (!isConfigured()) {
      return { success: false, eventType: '', error: SANDBOX_ERROR };
    }
    // Real Stripe webhook handling with signature verification would go here
    return {
      success: false,
      eventType: '',
      error: 'Stripe webhook handling not yet implemented.',
    };
  },

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }
    void params;
    return {
      success: false,
      error: 'Stripe refund not yet implemented.',
    };
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    if (!isConfigured()) {
      return { success: false, status: 'unknown', error: SANDBOX_ERROR };
    }
    void paymentId;
    return {
      success: false,
      status: 'unknown',
      error: 'Stripe payment status check not yet implemented.',
    };
  },
};
