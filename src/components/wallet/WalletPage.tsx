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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Snowflake,
  TrendingUp,
  CreditCard,
  History,
  Download,
  AlertCircle,
} from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  frozen_balance: number;
  available_balance: number;
  currency_code: string;
  transaction_count: number;
  created_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
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
  sort_order: number;
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
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
}

function formatDateTime(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'credit':
      return <ArrowDownLeft className="size-4" />;
    case 'debit':
      return <ArrowUpRight className="size-4" />;
    case 'freeze':
      return <Snowflake className="size-4" />;
    case 'unfreeze':
      return <TrendingUp className="size-4" />;
    default:
      return <CreditCard className="size-4" />;
  }
}

function getTransactionColor(type: string): string {
  switch (type) {
    case 'credit':
      return 'bg-emerald/10 text-emerald';
    case 'debit':
      return 'bg-destructive/10 text-destructive';
    case 'freeze':
      return 'bg-blue/10 text-blue';
    case 'unfreeze':
      return 'bg-amber/10 text-amber';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getTypeLabel(type: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    credit: t('wallet.credit'),
    debit: t('wallet.debit'),
    freeze: t('wallet.frozen'),
    unfreeze: t('wallet.unfrozen'),
  };
  return labels[type] || type;
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
  
  // Transaction filters
  const [txFilter, setTxFilter] = useState<string>('all');
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loadingTx, setLoadingTx] = useState(false);
  
  // Withdraw dialog
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Token purchase dialog
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) setWallet(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchTransactions = useCallback(async (filter?: string, page?: number) => {
    setLoadingTx(true);
    try {
      const params = new URLSearchParams({
        per_page: '10',
        page: String(page || txPage),
      });
      if (filter && filter !== 'all') params.set('type', filter);
      
      const res = await fetch(`/api/wallet/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data ?? []);
        setTxTotalPages(data.total_pages ?? 1);
        if (page) setTxPage(page);
      }
    } catch {
      // silent
    } finally {
      setLoadingTx(false);
    }
  }, [txPage]);

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
    Promise.all([
      fetchWallet(),
      fetchTransactions(),
      fetchPlans(),
      fetchTokenPackages(),
      fetchSubscription()
    ]).finally(() => setLoading(false));
  }, [user, fetchWallet, fetchTransactions, fetchPlans, fetchTokenPackages, fetchSubscription]);

  useEffect(() => {
    if (user) {
      fetchTransactions(txFilter, 1);
    }
  }, [txFilter, user]); // fetchTransactions is stable (useCallback), user changes trigger refetch

  const handleBuyTokens = useCallback((pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setPurchaseDialogOpen(true);
  }, []);

  const handlePurchaseTokens = useCallback(async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    try {
      // Create order for token purchase
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            item_type: 'token_purchase',
            description: `${t('tokens.tokens_count')}: ${selectedPackage.tokens}`,
            quantity: 1,
            unit_price: selectedPackage.price,
            reference_id: selectedPackage.id,
          }],
          metadata: {
            package_id: selectedPackage.id,
            tokens: selectedPackage.tokens,
          },
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderRes.json();

      // Initiate checkout
      const checkoutRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPackage.price,
          currency: selectedPackage.currency_code,
          description: `${t('tokens.title')}: ${selectedPackage.tokens} ${t('tokens.tokens_count')}`,
          metadata: {
            order_id: order.id,
            type: 'token_purchase',
            package_id: selectedPackage.id,
          },
          returnUrl: `${window.location.origin}/wallet?payment=success`,
          cancelUrl: `${window.location.origin}/wallet?payment=cancelled`,
        }),
      });

      if (checkoutRes.ok) {
        const checkoutData = await checkoutRes.json();
        // Redirect to payment page
        window.location.href = checkoutData.paymentUrl;
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setPurchasing(false);
      setPurchaseDialogOpen(false);
    }
  }, [selectedPackage, t]);

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error(t('wallet.invalid_amount'));
      return;
    }

    if (amount < 10) {
      toast.error(t('wallet.min_withdrawal'));
      return;
    }

    if (wallet && amount > wallet.available_balance) {
      toast.error(t('wallet.insufficient_funds'));
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          amount,
          description: `Withdrawal request: ${amount} MAD`,
        }),
      });

      if (res.ok) {
        toast.success(t('wallet.withdrawal_requested'));
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        fetchWallet();
        fetchTransactions();
      } else {
        const err = await res.json();
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setWithdrawing(false);
    }
  }, [withdrawAmount, wallet, t, fetchWallet, fetchTransactions]);

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
          <Button
            className="mt-4 bg-emerald text-emerald-foreground hover:bg-emerald/90"
            onClick={navigateHome}
          >
            {t('common.login')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <WalletIcon className="size-6 text-emerald" />
          <h1 className="text-2xl font-bold">{t('wallet.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald text-emerald hover:bg-emerald/10"
            onClick={() => setWithdrawDialogOpen(true)}
          >
            <ArrowUpRight className="size-4" />
            {t('wallet.withdraw')}
          </Button>
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
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Available Balance */}
            <Card className="overflow-hidden border-emerald/20 bg-gradient-to-br from-emerald/5 to-emerald/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.available')}</p>
                  <WalletIcon className="size-5 text-emerald" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {wallet?.available_balance.toLocaleString(
                      locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    ) || '0.00'}
                  </span>
                  <span className="text-base font-semibold text-emerald">
                    {wallet?.currency_code ?? 'MAD'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Frozen Balance */}
            <Card className="overflow-hidden border-blue/20 bg-gradient-to-br from-blue/5 to-blue/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.frozen')}</p>
                  <Snowflake className="size-5 text-blue" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {wallet?.frozen_balance.toLocaleString(
                      locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    ) || '0.00'}
                  </span>
                  <span className="text-base font-semibold text-blue">
                    {wallet?.currency_code ?? 'MAD'}
                  </span>
                </div>
                {wallet?.frozen_balance > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('wallet.frozen_note')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total Balance */}
            <Card className="overflow-hidden border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t('wallet.total_balance')}</p>
                  <TrendingUp className="size-5 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {wallet?.balance.toLocaleString(
                      locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    ) || '0.00'}
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">
                    {wallet?.currency_code ?? 'MAD'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {wallet?.transaction_count || 0} {t('wallet.transactions').toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </div>

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
                        <Star className="mx-auto mb-1 size-4 text-amber-500" />
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="size-5 text-emerald" />
                    {t('wallet.transactions')}
                  </CardTitle>
                  <Select value={txFilter} onValueChange={(v) => { setTxFilter(v); setTxPage(1); }}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('wallet.all_types')}</SelectItem>
                      <SelectItem value="credit">{t('wallet.credit')}</SelectItem>
                      <SelectItem value="debit">{t('wallet.debit')}</SelectItem>
                      <SelectItem value="freeze">{t('wallet.frozen')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTx ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <History className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t('wallet.no_transactions')}</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${getTransactionColor(tx.type)}`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {tx.description || getTypeLabel(tx.type, t)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDateTime(tx.created_at, locale)}</span>
                              {tx.reference_type && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  {tx.reference_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <p className={`text-sm font-semibold ${
                              tx.type === 'credit' || tx.type === 'unfreeze'
                                ? 'text-emerald'
                                : tx.type === 'freeze'
                                  ? 'text-blue'
                                  : 'text-destructive'
                            }`}>
                              {tx.type === 'credit' || tx.type === 'unfreeze' ? '+' : '-'}{tx.amount.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {t('wallet.balance')}: {tx.balance_after.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {txTotalPages > 1 && (
                      <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txPage <= 1}
                          onClick={() => fetchTransactions(txFilter, txPage - 1)}
                        >
                          {locale === 'ar' ? '»' : '«'}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {txPage} / {txTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={txPage >= txTotalPages}
                          onClick={() => fetchTransactions(txFilter, txPage + 1)}
                        >
                          {locale === 'ar' ? '«' : '»'}
                        </Button>
                      </div>
                    )}
                  </>
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
              <CardDescription>{t('tokens.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tokenPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`border-dashed transition-all hover:border-emerald/50 hover:shadow-md ${
                      pkg.sort_order === 1 ? 'border-emerald bg-emerald/5' : ''
                    }`}
                  >
                    <CardContent className="flex flex-col items-center p-4 text-center">
                      <Coins className={`mb-2 size-8 ${pkg.sort_order === 1 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <p className="text-2xl font-bold">{pkg.tokens}</p>
                      <p className="text-sm text-muted-foreground">{t('tokens.tokens_count')}</p>
                      <p className="mt-2 text-lg font-semibold">{pkg.price.toFixed(2)} {pkg.currency_code}</p>
                      {pkg.sort_order === 1 && (
                        <Badge className="mt-1 bg-amber-500 text-white text-[10px]">
                          ⭐ {t('tokens.best_value')}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        className={`mt-3 w-full ${
                          pkg.sort_order === 1
                            ? 'border-amber-500 text-amber-600 hover:bg-amber-50'
                            : 'border-emerald text-emerald hover:bg-emerald/10'
                        }`}
                        onClick={() => handleBuyTokens(pkg)}
                      >
                        <CreditCard className="me-2 size-4" />
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

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wallet.withdraw_title')}</DialogTitle>
            <DialogDescription>{t('wallet.withdraw_description')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">{t('wallet.amount')} ({wallet?.currency_code ?? 'MAD'})</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="10.00"
                min="10"
                max={wallet?.available_balance}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                {t('wallet.available')}: {wallet?.available_balance.toFixed(2)} {wallet?.currency_code}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('wallet.min_withdrawal')}: 10 {wallet?.currency_code}
              </p>
            </div>
            
            <div className="rounded-lg bg-amber/10 p-3">
              <div className="flex gap-2">
                <AlertCircle className="size-4 text-amber mt-0.5" />
                <p className="text-xs text-amber">{t('wallet.withdraw_notice')}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) < 10 || withdrawing}
              className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
            >
              {withdrawing ? <Loader2 className="me-2 size-4 animate-spin" /> : <ArrowUpRight className="me-2 size-4" />}
              {t('wallet.confirm_withdraw')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tokens.purchase_title')}</DialogTitle>
            <DialogDescription>
              {t('tokens.purchase_description')}: {selectedPackage?.tokens} {t('tokens.tokens_count')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Coins className="size-8 text-amber-500" />
                <div>
                  <p className="font-semibold">{selectedPackage?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackage?.tokens} {t('tokens.tokens_count')}
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold">
                {selectedPackage?.price.toFixed(2)} {selectedPackage?.currency_code}
              </p>
            </div>
            
            <div className="rounded-lg bg-emerald/10 p-3">
              <div className="flex gap-2">
                <Check className="size-4 text-emerald mt-0.5" />
                <p className="text-xs text-emerald">{t('tokens.will_be_added')}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handlePurchaseTokens}
              disabled={purchasing}
              className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
            >
              {purchasing ? <Loader2 className="me-2 size-4 animate-spin" /> : <CreditCard className="me-2 size-4" />}
              {t('tokens.proceed_to_pay')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
