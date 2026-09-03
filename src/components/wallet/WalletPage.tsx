'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Crown,
  Check,
  Loader2,
  CalendarDays,
  ImageIcon,
  Star,
  Package,
  FileText,
} from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  currency_code: string;
  transaction_count: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency_code: string;
  listing_limit: number;
  featured_limit: number;
  max_images_per_listing: number;
}

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  currency_code: string;
}

interface Subscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  plan: {
    id: string;
    name: string;
    name_ar: string | null;
    name_fr: string | null;
    name_en: string | null;
    listing_limit: number;
    featured_limit: number;
    max_images_per_listing: number;
  } | null;
}

function getPlanName(plan: Plan, locale: string) {
  if (locale === 'ar' && plan.name_ar) return plan.name_ar;
  if (locale === 'fr' && plan.name_fr) return plan.name_fr;
  if (plan.name_en) return plan.name_en;
  return plan.name;
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WalletPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { navigateHome, navigateInvoices } = useNavigationStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) setWallet(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/transactions?per_page=10');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) setPlans(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchTokenPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/token-packages');
      if (res.ok) setTokenPackages(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchWallet(), fetchTransactions(), fetchPlans(), fetchTokenPackages(), fetchSubscription()]).finally(() =>
      setLoading(false)
    );
  }, [user, fetchWallet, fetchTransactions, fetchPlans, fetchTokenPackages, fetchSubscription]);

  const handleBuyTokens = useCallback(() => {
    toast.info(t('tokens.coming_soon'));
  }, [t]);

  const handleSubscribe = useCallback(
    async (planId: string) => {
      setSubscribingPlanId(planId);
      try {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: planId }),
        });
        if (res.ok) {
          toast.success(t('plans.subscribe_success'));
          fetchSubscription();
        } else {
          toast.error(t('common.error'));
        }
      } catch {
        toast.error(t('common.error'));
      } finally {
        setSubscribingPlanId(null);
      }
    },
    [t, fetchSubscription]
  );

  // Not logged in
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Card className="p-8 text-center">
          <WalletIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{t('wallet.login_required')}</p>
          <Button className="mt-4 bg-emerald text-emerald-foreground hover:bg-emerald/90" onClick={navigateHome}>
            {t('common.login')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Header + Balance */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <WalletIcon className="size-6 text-emerald" />
          <h1 className="text-2xl font-bold">{t('wallet.title')}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-emerald text-emerald hover:bg-emerald/10"
          onClick={navigateInvoices}
        >
          <FileText className="size-4" />
          {t('invoices.view_invoices')}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <Card className="overflow-hidden border-emerald/20 bg-gradient-to-br from-emerald/5 to-emerald/10">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{t('wallet.balance')}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {wallet ? wallet.balance.toLocaleString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </span>
                <span className="text-lg font-semibold text-emerald">{wallet?.currency_code ?? 'MAD'}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Subscription */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="size-5 text-amber-500" />
                  {t('wallet.current_plan')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription?.plan ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {(() => {
                          const p = subscription.plan;
                          if (locale === 'ar' && p.name_ar) return p.name_ar;
                          if (locale === 'fr' && p.name_fr) return p.name_fr;
                          return p.name_en ?? p.name;
                        })()}
                      </span>
                      <Badge className="bg-emerald text-emerald-foreground">
                        <Check className="me-1 size-3" />
                        {t('common.active')}
                      </Badge>
                    </div>
                    {subscription.expires_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="size-4" />
                        {formatDate(subscription.expires_at, locale)}
                      </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <Package className="mx-auto mb-1 size-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">{subscription.plan.listing_limit}</p>
                        <p className="text-xs text-muted-foreground">{t('plans.listings_limit')}</p>
                      </div>
                      <div>
                        <Star className="mx-auto mb-1 size-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">{subscription.plan.featured_limit}</p>
                        <p className="text-xs text-muted-foreground">{t('plans.featured_limit')}</p>
                      </div>
                      <div>
                        <ImageIcon className="mx-auto mb-1 size-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">{subscription.plan.max_images_per_listing}</p>
                        <p className="text-xs text-muted-foreground">{t('plans.max_images')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Crown className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t('wallet.no_subscription')}</p>
                    <Button
                      variant="outline"
                      className="mt-3 border-emerald text-emerald hover:bg-emerald/10"
                      onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      {t('plans.select_plan')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowDownLeft className="size-5 text-emerald" />
                  {t('wallet.transactions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ArrowDownLeft className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t('wallet.no_transactions')}</p>
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                            tx.type === 'credit' ? 'bg-emerald/10 text-emerald' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{tx.description ?? tx.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at, locale)}</p>
                        </div>
                        <div className="text-end">
                          <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald' : 'text-destructive'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('wallet.balance')}: {tx.balance_after.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Token Packages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="size-5 text-amber-500" />
                {t('tokens.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tokenPackages.map((pkg) => (
                  <Card key={pkg.id} className="border-dashed transition-colors hover:border-emerald/50">
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <Coins className="mb-2 size-8 text-amber-500" />
                      <p className="text-2xl font-bold">{pkg.tokens}</p>
                      <p className="text-sm text-muted-foreground">{t('tokens.tokens_count')}</p>
                      <p className="mt-2 text-lg font-semibold">{pkg.price.toFixed(2)} {pkg.currency_code}</p>
                      <Button
                        variant="outline"
                        className="mt-3 w-full border-emerald text-emerald hover:bg-emerald/10"
                        onClick={handleBuyTokens}
                      >
                    {t('wallet.buy_tokens')}
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </CardContent>
        </Card>

          {/* Plans Comparison */}
          <div id="plans-section">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Crown className="size-5 text-emerald" />
              {t('plans.title')}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const isSubscribed = subscription?.plan?.id === plan.id;
                const planName = getPlanName(plan, locale);
                const isPopular = plan.name === 'Pro';
                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden ${
                      isPopular ? 'border-emerald shadow-lg shadow-emerald/10' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="bg-emerald px-3 py-1 text-center text-xs font-semibold text-emerald-foreground">
                        ⭐ Popular
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{planName}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      {/* Price */}
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">{plan.price_monthly.toFixed(0)}</span>
                          <span className="text-sm text-muted-foreground">{plan.currency_code}</span>
                          <span className="text-sm text-muted-foreground">/ {t('plans.per_month')}</span>
                        </div>
                        {plan.price_yearly > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {plan.price_yearly.toFixed(0)} {plan.currency_code} / {t('plans.per_year')}
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Features */}
                      <ul className="flex-1 space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Package className="size-4 shrink-0 text-emerald" />
                          {plan.listing_limit} {t('plans.listings_limit')} {t('plans.per_month').toLowerCase()}
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Star className="size-4 shrink-0 text-amber-500" />
                          {plan.featured_limit} {t('plans.featured_limit')} {t('plans.per_month').toLowerCase()}
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                          {t('plans.max_images')}: {plan.max_images_per_listing}
                        </li>
                      </ul>

                      {/* Subscribe Button */}
                      <Button
                        className={`w-full ${
                          isSubscribed
                            ? 'bg-muted text-muted-foreground hover:bg-muted'
                            : 'bg-emerald text-emerald-foreground hover:bg-emerald/90'
                        }`}
                        disabled={isSubscribed || subscribingPlanId === plan.id}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {subscribingPlanId === plan.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : isSubscribed ? (
                          <Check className="size-4" />
                        ) : null}
                        {isSubscribed ? t('common.active') : t('wallet.subscribe')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
