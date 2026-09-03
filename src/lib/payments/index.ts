import type { PaymentProvider } from '@/lib/types';

const providers = new Map<string, PaymentProvider>();

export function registerProvider(name: string, provider: PaymentProvider) {
  providers.set(name, provider);
}

export function getProvider(name: string): PaymentProvider | undefined {
  return providers.get(name);
}

export function getActiveProviderName(): string {
  return process.env.PAYMENT_PROVIDER || 'stripe';
}

export function getActiveProvider(): PaymentProvider {
  const name = getActiveProviderName();
  const provider = getProvider(name);
  if (!provider) throw new Error(`Payment provider '${name}' not registered`);
  return provider;
}
