import type { PaymentProvider } from '@/lib/types';

const providers = new Map<string, PaymentProvider>();

/**
 * Register a payment provider
 */
export function registerProvider(name: string, provider: PaymentProvider) {
  if (providers.has(name)) {
    console.warn(`Payment provider '${name}' is being overwritten`);
  }
  providers.set(name, provider);
}

/**
 * Get a specific provider by name
 */
export function getProvider(name: string): PaymentProvider | undefined {
  return providers.get(name);
}

/**
 * Get the active provider name from environment
 */
export function getActiveProviderName(): string {
  return process.env.PAYMENT_PROVIDER || 'stripe';
}

/**
 * Get the active payment provider
 * @throws Error if provider not found or not configured
 */
export function getActiveProvider(): PaymentProvider {
  const name = getActiveProviderName();
  const provider = getProvider(name);
  if (!provider) {
    throw new Error(`Payment provider '${name}' not registered. Available providers: ${Array.from(providers.keys()).join(', ')}`);
  }
  return provider;
}

/**
 * Get all registered provider names
 */
export function getAvailableProviders(): string[] {
  return Array.from(providers.keys());
}

/**
 * Validate webhook signature based on provider
 */
export async function validateWebhookSignature(
  providerName: string,
  body: string | unknown,
  headers: Record<string, string>
): Promise<boolean> {
  const provider = getProvider(providerName);
  if (!provider) {
    console.error(`Unknown provider for webhook validation: ${providerName}`);
    return false;
  }

  // Each provider should handle its own signature verification
  // This is a convenience wrapper that can be extended
  try {
    const result = await provider.handleWebhook(body, headers);
    return result.success;
  } catch (error) {
    console.error('Webhook validation error:', error);
    return false;
  }
}

/**
 * Generate idempotency key for payment operations
 */
export function generateIdempotencyKey(prefix: string = 'pay'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Sanitize payment amount - ensure positive number with correct precision
 */
export function sanitizeAmount(amount: number): number {
  const sanitized = Math.abs(amount);
  return Math.round(sanitized * 100) / 100; // 2 decimal places
}

/**
 * Validate currency code (ISO 4217)
 */
export function isValidCurrency(code: string): boolean {
  // Common currencies we support
  const supportedCurrencies = ['MAD', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'XAF', 'XOF'];
  return supportedCurrencies.includes(code.toUpperCase());
}
