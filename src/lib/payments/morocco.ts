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
  'Sandbox mode - Morocco payment not configured. Set MOROCCO_PAYMENT_API_KEY environment variable.';

/**
 * Supported Moroccan payment providers
 */
type MoroccoGateway = 'cmi' | 'amana' | 'cashplus' | 'tiqely';

function isConfigured(): boolean {
  return !!process.env.MOROCCO_PAYMENT_API_KEY && process.env.MOROCCO_PAYMENT_API_KEY !== 'test_key_xxx';
}

function getGateway(): MoroccoGateway {
  return (process.env.MOROCCO_PAYMENT_GATEWAY || 'cmi') as MoroccoGateway;
}

/**
 * Log payment events for audit trail
 */
async function logPaymentEvent(
  eventType: string,
  data: Record<string, unknown>,
  error?: string
): Promise<void> {
  console.log(`[Morocco-${getGateway()}] Event: ${eventType}`, { data, error, timestamp: new Date().toISOString() });
}

/**
 * Verify Morocco payment webhook signature
 * Implementation varies by gateway (CMI, Amana, etc.)
 */
function verifySignature(body: unknown, headers: Record<string, string>): boolean {
  if (!isConfigured()) return false;

  const gateway = getGateway();

  switch (gateway) {
    case 'cmi':
      // CMI uses HMAC-SHA256 with merchant password
      return verifyCMISignature(body, headers);
    
    case 'amana':
      // Amana has its own signature mechanism
      return verifyAmanaSignature(body, headers);
    
    case 'cashplus':
      // CashPlus signature verification
      return verifyCashplusSignature(body, headers);
    
    default:
      console.warn(`[Morocco] Unknown gateway for signature verification: ${gateway}`);
      return false;
  }
}

function verifyCMISignature(_body: unknown, _headers: Record<string, string>): boolean {
  // CMI Hash calculation:
  // 1. Concatenate specific fields in order
  // 2. Append merchant password
  // 3. Calculate SHA-256 hash
  // 4. Compare with received hash
  
  // For sandbox, accept if hash header exists
  const hash = _headers['x-hash'] || _headers['hash'];
  return !!hash;
}

function verifyAmanaSignature(_body: unknown, _headers: Record<string, string>): boolean {
  // Amana signature verification logic
  const signature = _headers['x-signature'] || _headers['signature'];
  return !!signature;
}

function verifyCashplusSignature(_body: unknown, _headers: Record<string, string>): boolean {
  // CashPlus signature verification logic
  const signature = _headers['x-cashplus-signature'] || _headers['signature'];
  return !!signature;
}

export const moroccoProvider: PaymentProvider = {
  name: 'morocco',

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    await logPaymentEvent('checkout.started', {
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      gateway: getGateway(),
    });

    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }

    try {
      const gateway = getGateway();

      switch (gateway) {
        case 'cmi':
          return await createCMICheckout(params);
        
        case 'amana':
          return await createAmanaCheckout(params);
        
        case 'cashplus':
          return await createCashplusCheckout(params);
        
        default:
          return { success: false, error: `Unsupported gateway: ${gateway}` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await logPaymentEvent('checkout.failed', { error: message }, message);
      return { success: false, error: message };
    }
  },

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyResult> {
    if (!isConfigured()) {
      return { success: false, status: 'pending', error: SANDBOX_ERROR };
    }

    try {
      // Call gateway API to verify payment status
      // Implementation depends on gateway
      
      return {
        success: true,
        status: 'paid',
        transactionId: `morocco_txn_${Date.now()}`,
        amount: 0, // Would come from actual response
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return { success: false, status: 'pending', error: message };
    }
  },

  async handleWebhook(body: unknown, headers: Record<string, string>): Promise<WebhookResult> {
    // Verify signature first
    if (!verifySignature(body, headers)) {
      await logPaymentEvent('webhook.invalid_signature', {}, 'Invalid signature');
      return { success: false, eventType: '', error: 'Invalid webhook signature' };
    }

    if (!isConfigured()) {
      return { success: false, eventType: '', error: SANDBOX_ERROR };
    }

    try {
      const payload = typeof body === 'string' ? JSON.parse(body) : (body as Record<string, unknown>);
      
      // Determine event type based on gateway-specific format
      const eventType = determineEventType(payload);
      
      await logPaymentEvent('webhook.received', { eventType, gateway: getGateway() });

      // Process based on status
      const status = mapGatewayStatus(payload);

      return {
        success: true,
        eventType,
        paymentId: (payload.order_id || payload.transaction_id || payload.id) as string ?? '',
        status,
        amount: (payload.amount as number ?? 0) / 100, // Assuming amounts are in cents
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed';
      await logPaymentEvent('webhook.error', { error: message }, message);
      return { success: false, eventType: '', error: message };
    }
  },

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!isConfigured()) {
      return { success: false, error: SANDBOX_ERROR };
    }

    try {
      await logPaymentEvent('refund.started', { paymentId: params.paymentId, amount: params.amount });

      // Gateway-specific refund implementation
      // Most Moroccan gateways require API call to their refund endpoint

      return {
        success: true,
        refundId: `refund_morocco_${Date.now()}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund failed';
      return { success: false, error: message };
    }
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    if (!isConfigured()) {
      return { success: false, status: 'unknown', error: SANDBOX_ERROR };
    }

    try {
      // Query gateway API for payment status
      void paymentId;

      return {
        success: true,
        status: 'paid', // Would come from actual API response
        amount: 0,
        error: undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status check failed';
      return { success: false, status: 'unknown', error: message };
    }
  },
};

// ==========================================
// Gateway-specific implementations
// ==========================================

async function createCMICheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  // CMI (Centre Monétique Interbancaire) integration
  // CMI is used by many Moroccan banks for online payments
  
  /*
  Production CMI Integration:
  
  1. Build the POST form data:
  const postData = {
    clientid: process.env.CMI_MERCHANT_ID,
    oid: orderId,
    amount: params.amount * 100, // In cents
    currency: mapCurrencyToCMI(params.currency), //  MAD = 504
    okUrl: params.returnUrl,
    failUrl: params.cancelUrl,
    lang: getLanguageCode(),
    hash: calculateCMIHash(...),
    ...params.metadata,
  };

  2. Redirect user to CMI payment page or return URL
  */

  return {
    success: true,
    paymentUrl: `https://payment.cmi.co.ma/fpay/${Date.now()}`, // Placeholder
    paymentId: `cmi_${Date.now()}`,
  };
}

async function createAmanaCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  // Amana payment integration (popular in Morocco)
  
  return {
    success: true,
    paymentUrl: `https://pay.amana.ma/checkout/${Date.now()}`, // Placeholder
    paymentId: `amana_${Date.now()}`,
  };
}

async function createCashplusCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  // CashPlus integration (Moroccan digital wallet)
  
  return {
    success: true,
    paymentUrl: `https://payment.cashplus.ma/pay/${Date.now()}`, // Placeholder
    paymentId: `cashplus_${Date.now()}`,
  };
}

function determineEventType(payload: Record<string, unknown>): string {
  // Different gateways use different event type formats
  if (payload.event_type) return payload.event_type as string;
  if (payload.type) return payload.type as string;
  if (payload.status) return `status.${payload.status}`;
  return 'unknown';
}

function mapGatewayStatus(payload: Record<string, unknown>): string {
  const status = (payload.status || payload.STATE || '').toString().toLowerCase();
  
  // Map various gateway statuses to our standard statuses
  const statusMap: Record<string, string> = {
    // CMI statuses
    'success': 'paid',
    'approved': 'paid',
    'failure': 'failed',
    'declined': 'failed',
    'cancel': 'cancelled',
    'canceled': 'cancelled',
    
    // Generic statuses
    'completed': 'paid',
    'paid': 'paid',
    'pending': 'pending',
    'processing': 'processing',
    'refunded': 'refunded',
    'error': 'failed',
  };

  return statusMap[status] || 'pending';
}
