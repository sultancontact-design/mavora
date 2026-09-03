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

const SANDBOX_ERROR =
  'Sandbox mode - Morocco payment not configured. Future: CMI, Amana, CashPlus integration.';

function isConfigured(): boolean {
  return !!process.env.MOROCCO_PAYMENT_API_KEY;
}

export const moroccoProvider: PaymentProvider = {
  name: 'morocco',

  async createCheckout(_params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }
    // Future: CMI / Amana / CashPlus integration
    return {
      success: false,
      error: 'Morocco payment checkout not yet implemented.',
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
      error: 'Morocco payment verification not yet implemented.',
    };
  },

  async handleWebhook(
    _body: unknown,
    _headers: Record<string, string>
  ): Promise<WebhookResult> {
    if (!isConfigured()) {
      return { success: false, eventType: '', error: SANDBOX_ERROR };
    }
    // Future: Morocco payment provider webhook handling
    return {
      success: false,
      eventType: '',
      error: 'Morocco payment webhook handling not yet implemented.',
    };
  },

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }
    void params;
    return {
      success: false,
      error: 'Morocco payment refund not yet implemented.',
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
      error: 'Morocco payment status check not yet implemented.',
    };
  },
};
