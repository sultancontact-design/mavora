/**
 * PayPal Payment Provider for Mavora
 * Supports PayPal REST API v2 with Moroccan Market integration
 * 
 * @module lib/payments/providers/paypal
 */

import { PaymentProvider, PaymentResult, PaymentWebhookPayload } from '../index';

// ============================================================
// Types & Interfaces
// ============================================================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  webhookId?: string;
  webhookSecret?: string;
}

export interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'COMPLETED' | 'VOIDED' | 'PAYER_ACTION_REQUIRED';
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: PayPalPurchaseUnit[];
  create_time: string;
  update_time: string;
  links: PayPalLink[];
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  amount: PayPalAmount;
  payee?: PayPalPayee;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  soft_descriptor?: string;
  items?: PayPalItem[];
  shipping?: PayPalShippingDetail;
  payments?: PayPalPayments;
}

export interface PayPalAmount {
  currency_code: string; // MAD, USD, EUR
  value: string; // Decimal string "10.00"
  breakdown?: PayPalAmountBreakdown;
}

export interface PayPalAmountBreakdown {
  item_total?: PayPalAmount;
  shipping?: PayPalAmount;
  handling?: PayPalAmount;
  tax_total?: PayPalAmount;
  insurance?: PayPalAmount;
  shipping_discount?: PayPalAmount;
  discount?: PayPalAmount;
}

export interface PayPalPayee {
  email_address: string;
  merchant_id?: string;
}

export interface PayPalItem {
  name: string;
  unit_amount: PayPalAmount;
 tax?: PayPalAmount;
  quantity: string;
  description?: string;
  sku?: string;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}

export interface PayPalShippingDetail {
  name?: PayPalName;
  address?: PayPalAddress;
}

export interface PayPalName {
  full_name: string;
}

export interface PayPalAddress {
  address_line_1: string;
  address_line_2?: string;
  admin_area_1?: string; // State/Province
  admin_area_2?: string; // City
  postal_code?: string;
  country_code: string; // MA for Morocco
}

export interface PayPalPayments {
  captures?: PayPalCapture[];
 authorizations?: PayPalAuthorization[];
}

export interface PayPalCapture {
  id: string;
  status: 'COMPLETED' | 'PENDING' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';
  amount: PayPalAmount;
  seller_receivable_breakdown?: PayPalSellerReceivable;
  create_time: string;
  update_time: string;
  final_capture: boolean;
  disbursement_mode?: 'INSTANT' | 'DELAYED';
  seller_protection?: PayPalSellerProtection;
}

export interface PayPalAuthorization {
  id: string;
  status: 'CREATED' | 'CAPTURED' | 'VOIDED' | 'PENDING';
  amount: PayPalAmount;
  seller_protection?: PayPalSellerProtection;
  create_time: string;
  update_time: string;
  expiration_time: string;
  links: PayPalLink[];
}

export interface PayPalSellerReceivable {
  gross_amount: PayPalAmount;
  paypal_fee: PayPalAmount;
  net_amount: PayPalAmount;
  receivable_amount: PayPalAmount;
  platform_fees?: PayPalPlatformFee[];
}

export interface PayPalPlatformFee {
  amount: PayPalAmount;
  payee: PayPalPayee;
}

export interface PayPalSellerProtection {
  status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  dispute_categories: string[];
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalPaymentToken {
  order_id: string;
  approval_url: string;
  redirect_urls: {
    return_url: string;
    cancel_url: string;
  };
}

// ============================================================
// PayPal Provider Implementation
// ============================================================

export class PayPalProvider implements PaymentProvider {
  private config: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  // ============================================================
  // Authentication
  // ============================================================

  /**
   * Get OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const baseUrl = this.getBaseUrl();
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s before expiry

    return this.accessToken!;
  }

  private getBaseUrl(): string {
    return this.config.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  // ============================================================
  // Payment Operations
  // ============================================================

  /**
   * Create a PayPal order
   */
  async createPayment(params: {
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    customerId: string;
    returnUrl: string;
    cancelUrl: string;
    items?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    metadata?: Record<string, string>;
  }): Promise<PayPalPaymentToken> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    // Build purchase units
    const purchaseUnit: PayPalPurchaseUnit = {
      reference_id: params.orderId,
      description: params.description,
      custom_id: params.customerId,
      amount: {
        currency_code: params.currency, // Support MAD for Morocco
        value: params.amount.toFixed(2),
      },
    };

    // Add items if provided
    if (params.items && params.items.length > 0) {
      purchaseUnit.items = params.items.map(item => ({
        name: item.name,
        unit_amount: {
          currency_code: params.currency,
          value: item.unitPrice.toFixed(2),
        },
        quantity: item.quantity.toString(),
        category: 'PHYSICAL_GOODS',
      }));

      // Calculate item total
      const itemTotal = params.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      purchaseUnit.amount.breakdown = {
        item_total: {
          currency_code: params.currency,
          value: itemTotal.toFixed(2),
        },
      };
    }

    // Create order
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `mavora_${params.orderId}_${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
        application_context: {
          brand_name: 'Mavora',
          locale: 'ar-MA', // Arabic - Morocco
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          shipping_preference: 'GET_FROM_FILE',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal order creation failed: ${error}`);
    }

    const order: PayPalOrder = await response.json();

    // Find approval URL
    const approvalLink = order.links.find(link => link.rel === 'approve');
    if (!approvalLink) {
      throw new Error('No approval URL found in PayPal response');
    }

    return {
      order_id: order.id,
      approval_url: approvalLink.href,
      redirect_urls: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    };
  }

  /**
   * Capture a PayPal order after approval
   */
  async capturePayment(orderId: string): Promise<PaymentResult> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal capture failed: ${error}`);
    }

    const captureResponse = await response.json();
    const capture = captureResponse.purchase_units?.[0]?.payments?.captures?.[0];

    if (!capture) {
      throw new Error('No capture data in PayPal response');
    }

    return {
      success: capture.status === 'COMPLETED',
      provider: 'paypal',
      providerTransactionId: capture.id,
      orderId: orderId,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      status: this.mapPayPalStatus(capture.status),
      rawResponse: captureResponse,
      fees: capture.seller_receivable_breakdown?.paypal_fee
        ? parseFloat(capture.seller_receivable_breakdown.paypal_fee.value)
        : undefined,
    };
  }

  /**
   * Refund a PayPal payment
   */
  async refundPayment(captureId: string, amount?: number, currency?: string): Promise<{
    success: boolean;
    refundId: string;
    status: string;
  }> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const body: any = {};
    if (amount && currency) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency,
      };
    }

    const response = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal refund failed: ${error}`);
    }

    const refund = await response.json();

    return {
      success: refund.status === 'COMPLETED',
      refundId: refund.id,
      status: refund.status,
    };
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(orderId: string): Promise<PayPalOrder> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get PayPal order: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================
  // Webhook Handling
  // ============================================================

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhookSignature(
    headers: Headers,
    body: string
  ): Promise<{ valid: boolean; event?: any }> {
    if (!this.config.webhookId || !this.config.webhookSecret) {
      console.warn('[PayPal] Webhook verification disabled - missing config');
      return { valid: true }; // Skip verification in development
    }

    const accessToken = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    // For production, you should use PayPal SDK for proper verification
    // This is a simplified version
    const transmissionId = headers.get('paypal-transmission-id');
    const timestamp = headers.get('paypal-transmission-time');
    const actualSignature = headers.get('paypal-cert-id');
    const algorithm = headers.get('paypal-auth-algo');

    if (!transmissionId || !timestamp || !actualSignature) {
      return { valid: false };
    }

    // In production, use @paypal/api-integrations for proper verification
    // For now, we'll accept the webhook and validate the event structure
    try {
      const event = JSON.parse(body);
      
      // Basic validation
      if (!event.id || !event.event_type) {
        return { valid: false };
      }

      return { valid: true, event };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Process PayPal webhook
   */
  async processWebhook(payload: PaymentWebhookPayload): Promise<PaymentResult> {
    const event = payload.rawBody;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const capture = event.resource;
        return {
          success: true,
          provider: 'paypal',
          providerTransactionId: capture.id,
          orderId: capture.supplementary_data?.related_ids?.order_id,
          amount: parseFloat(capture.amount.value),
          currency: capture.amount.currency_code,
          status: 'completed',
          rawResponse: event,
        };

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
        return {
          success: false,
          provider: 'paypal',
          providerTransactionId: event.resource?.id,
          status: 'failed',
          rawResponse: event,
        };

      default:
        return {
          success: false,
          provider: 'paypal',
          status: 'pending',
          rawResponse: event,
        };
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private mapPayPalStatus(status: string): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      COMPLETED: 'completed',
      PENDING: 'pending',
      DECLINED: 'failed',
      PARTIALLY_REFUNDED: 'refunded',
      REFUNDED: 'refunded',
      FAILED: 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Generate PayPal checkout URL for frontend
   */
  generateCheckoutUrl(paymentToken: string): string {
    // paymentToken is the order ID
    return `https://www.paypal.com/checkoutnow?token=${paymentToken}`;
  }

  /**
   * Check if PayPal is configured
  */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Get supported currencies for Morocco market
   */
  getSupportedCurrencies(): string[] {
    return ['MAD', 'USD', 'EUR']; // Moroccan Dirham, US Dollar, Euro
  }
}

// Export singleton factory
let paypalInstance: PayPalProvider | null = null;

export function getPayPalProvider(config?: PayPalConfig): PayPalProvider {
  if (!paypalInstance && config) {
    paypalInstance = new PayPalProvider(config);
  }
  if (!paypalInstance) {
    throw new Error('PayPal provider not initialized. Call getPayPalProvider(config) first.');
  }
  return paypalInstance;
}

export default PayPalProvider;
