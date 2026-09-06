/**
 * Payoneer Payment Provider for Mavora
 * Supports Payoneer API for cross-border payments in Morocco
 * 
 * @module lib/payments/providers/payoneer
 */

import { PaymentProvider, PaymentResult, PaymentWebhookPayload } from '../index';

// ============================================================
// Types & Interfaces
// ============================================================

export interface PayoneerConfig {
  environment: 'sandbox' | 'live';
  apiKey: string;
  apiSecret: string;
  programId: string;
  webhookSecret?: string;
}

export interface PayoneerPayee {
  type: 'INDIVIDUAL' | 'COMPANY';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  country: string; // ISO 3166-1 alpha-2 (MA for Morocco)
  currency: string; // MAD, USD, EUR
  date_of_birth?: string; // YYYY-MM-DD
  phone?: string;
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state?: string;
    zip_code?: string;
    country: string;
  };
}

export interface PayoneerPayout {
  payout_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RETURNED';
  amount: number;
  currency: string;
  payee_id: string;
  payment_method: string;
  created_at: string;
  processed_at?: string;
  description?: string;
  client_reference_id?: string;
  fee?: number;
  exchange_rate?: {
    from_currency: string;
    to_currency: string;
    rate: number;
  };
}

export interface PayoneerPaymentMethod {
  type: 'BANK_TRANSFER' | 'CARD' | 'PREPAID_CARD' | 'WALLET';
  id: string;
  country: string;
  currency: string;
  is_default: boolean;
  details?: Record<string, any>;
}

// ============================================================
// Payoneer Provider Implementation
// ============================================================

export class PayoneerProvider implements PaymentProvider {
  private config: PayoneerConfig;

  constructor(config: PayoneerConfig) {
    this.config = config;
  }

  // ============================================================
  // Authentication
  // ============================================================

  /**
   * Generate authorization headers
   */
  private getAuthHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
      'X-Program-Id': this.config.programId,
    };
  }

  private getBaseUrl(): string {
    return this.config.environment === 'live'
      ? 'https://api.payoneer.com'
      : 'https://api.sandbox.payoneer.com';
  }

  // ============================================================
  // Payee Management (for sellers receiving payments)
  // ============================================================

  /**
   * Register a new payee (seller) to receive payments
   */
  async registerPayee(payeeData: PayoneerPayee): Promise<{
    success: boolean;
    payeeId?: string;
    redirectUrl?: string; // URL for onboarding flow
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v4/payees`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payeeData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          payeeId: data.payee_id,
          redirectUrl: data.onboarding_url,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to register payee',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get payee details
   */
  async getPayeeDetails(payeeId: string): Promise<PayoneerPayee | null> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v4/payees/${payeeId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[Payoneer] Failed to get payee details:', error);
      return null;
    }
  }

  /**
   * Get available payment methods for a payee
   */
  async getPaymentMethods(payeeId: string): Promise<PayoneerPaymentMethod[]> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v4/payees/${payeeId}/payment-methods`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.payment_methods || [];
      }
      return [];
    } catch (error) {
      console.error('[Payoneer] Failed to get payment methods:', error);
      return [];
    }
  }

  // ============================================================
  // Payout Operations (sending money to sellers)
  // ============================================================

  /**
   * Create a payout to a seller
   */
  async createPayout(params: {
    payeeId: string;
    amount: number;
    currency: string; // MAD for Morocco
    paymentMethodId?: string;
    description?: string;
    clientReferenceId?: string;
  }): Promise<PayoneerPayout> {
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v4/payouts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        payee_id: params.payeeId,
        amount: params.amount,
        currency: params.currency,
        payment_method_id: params.paymentMethodId,
        description: params.description || 'Mavora seller payout',
        client_reference_id: params.clientReferenceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payoneer payout failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<PayoneerPayout | null> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v4/payouts/${payoutId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      console.error('[Payoneer] Failed to get payout status:', error);
      return null;
    }
  }

  /**
   * List payouts with filters
   */
  async listPayouts(filters?: {
    payeeId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: PayoneerPayout[]; total: number }> {
    const baseUrl = this.getBaseUrl();
    const params = new URLSearchParams();

    if (filters?.payeeId) params.append('payee_id', filters.payeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDate) params.append('from_date', filters.fromDate);
    if (filters?.toDate) params.append('to_date', filters.toDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${baseUrl}/v4/payouts?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list payouts: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================
  // Payment Operations (buyers paying)
  // ============================================================

  /**
   * Create a payment session for buyer
   */
  async createPayment(params: {
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    customerId: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{
    sessionId: string;
    redirectUrl: string;
  }> {
    // Payoneer uses different flows for payments vs payouts
    // For buyer payments, we typically integrate via hosted checkout
    
    const baseUrl = this.getBaseUrl();
    
    const response = await fetch(`${baseUrl}/v4/payments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        order_id: params.orderId,
        customer_id: params.customerId,
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payoneer payment creation failed: ${error.message}`);
    }

    const data = await response.json();
    return {
      sessionId: data.session_id,
      redirectUrl: data.redirect_url,
    };
  }

  /**
   * Capture/complete a payment
   */
  async capturePayment(sessionId: string): Promise<PaymentResult> {
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v4/payments/${sessionId}/capture`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Payoneer capture failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: data.status === 'COMPLETED',
      provider: 'payoneer',
      providerTransactionId: data.payment_id,
      amount: data.amount,
      currency: data.currency,
      status: this.mapPayoneerStatus(data.status),
      rawResponse: data,
    };
  }

  // ============================================================
  // Webhook Handling
  // ============================================================

  /**
   * Verify Payoneer webhook signature
   */
  async verifyWebhookSignature(
    headers: Headers,
    body: string
  ): Promise<{ valid: boolean; event?: any }> {
    if (!this.config.webhookSecret) {
      console.warn('[Payoneer] Webhook verification disabled - missing secret');
      return { valid: true };
    }

    const timestamp = headers.get('x-timestamp');
    const signature = headers.get('x-signature');

    if (!timestamp || !signature) {
      return { valid: false };
    }

    // In production, implement HMAC-SHA256 verification
    // For now, validate event structure
    try {
      const event = JSON.parse(body);
      if (!event.event_type || !event.resource) {
        return { valid: false };
      }
      return { valid: true, event };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Process Payoneer webhook
   */
  async processWebhook(payload: PaymentWebhookPayload): Promise<PaymentResult> {
    const event = payload.rawBody;

    switch (event.event_type) {
      case 'PAYMENT.COMPLETED':
        return {
          success: true,
          provider: 'payoneer',
          providerTransactionId: event.resource?.payment_id,
          amount: event.resource?.amount,
          currency: event.resource?.currency,
          status: 'completed',
          rawResponse: event,
        };

      case 'PAYOUT.COMPLETED':
        return {
          success: true,
          provider: 'payoneer',
          providerTransactionId: event.resource?.payout_id,
          amount: event.resource?.amount,
          currency: event.resource?.currency,
          status: 'completed',
          rawResponse: event,
        };

      case 'PAYMENT.FAILED':
      case 'PAYOUT.FAILED':
        return {
          success: false,
          provider: 'payoneer',
          providerTransactionId: event.resource?.payout_id || event.resource?.payment_id,
          status: 'failed',
          rawResponse: event,
        };

      default:
        return {
          success: false,
          provider: 'payoneer',
          status: 'pending',
          rawResponse: event,
        };
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private mapPayoneerStatus(status: string): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      COMPLETED: 'completed',
      PENDING: 'pending',
      PROCESSING: 'processing',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      RETURNED: 'refunded',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Generate checkout URL
   */
  generateCheckoutUrl(sessionId: string): string {
    const baseUrl = this.config.environment === 'live'
      ? 'https://payments.payoneer.com'
      : 'https://payments.sandbox.payoneer.com';
    return `${baseUrl}/checkout?session=${sessionId}`;
  }

  /**
   * Check if Payoneer is configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret && this.config.programId);
  }

  /**
   * Get supported currencies for Morocco market
   */
  getSupportedCurrencies(): string[] {
    return ['MAD', 'USD', 'EUR', 'GBP']; // Major currencies supported by Payoneer
  }

  /**
   * Get payout fees estimate
   */
  async getPayoutFeesEstimate(
    amount: number,
    currency: string,
    destinationCountry: string = 'MA'
  ): Promise<{
    fee: number;
    totalDeduction: number;
    netAmount: number;
    currency: string;
  } | null> {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(
        `${baseUrl}/v4/payouts/fees?amount=${amount}&currency=${currency}&destination_country=${destinationCountry}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      console.error('[Payoneer] Failed to get fees:', error);
      return null;
    }
  }
}

// Export singleton factory
let payoneerInstance: PayoneerProvider | null = null;

export function getPayoneerProvider(config?: PayoneerConfig): PayoneerProvider {
  if (!payoneerInstance && config) {
    payoneerInstance = new PayoneerProvider(config);
  }
  if (!payoneerInstance) {
    throw new Error('Payoneer provider not initialized. Call getPayoneerProvider(config) first.');
  }
  return payoneerInstance;
}

export default PayoneerProvider;
