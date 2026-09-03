'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import type { Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Coins,
  Crown,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Receipt,
  FileX2,
} from 'lucide-react';

interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

type FilterTab = 'all' | 'pending' | 'paid' | 'failed';

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'token_purchase':
      return <Coins className="size-4" />;
    case 'subscription':
      return <Crown className="size-4" />;
    case 'promotion':
      return <Zap className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
}

function getTypeTranslationKey(type: string): string {
  switch (type) {
    case 'token_purchase':
      return 'invoice.type_token_purchase';
    case 'subscription':
      return 'invoice.type_subscription';
    case 'promotion':
      return 'invoice.type_promotion';
    default:
      return type;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'refunded':
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getStatusTranslationKey(status: string): string {
  switch (status) {
    case 'pending':
      return 'invoice.status_pending';
    case 'paid':
      return 'invoice.status_paid';
    case 'failed':
      return 'invoice.status_failed';
    case 'refunded':
      return 'invoice.status_refunded';
    case 'cancelled':
      return 'invoice.status_cancelled';
    default:
      return status;
  }
}

export default function InvoicesPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const { navigateHome } = useNavigationStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchInvoices = useCallback(async (p: number, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const data: InvoicesResponse = await res.json();
        setInvoices(data.data ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotal(data.total ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchInvoices(page, activeTab);
  }, [user, page, activeTab, fetchInvoices]);

  // Stats derived from current invoices
  const paidAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('invoices.all') },
    { key: 'pending', label: t('invoice.status_pending') },
    { key: 'paid', label: t('invoice.status_paid') },
    { key: 'failed', label: t('invoice.status_failed') },
  ];

  // Not logged in
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
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
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Receipt className="size-6 text-emerald" />
        <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
      </div>

      {loading && page === 1 && activeTab === 'all' ? (
        <>
          {/* Stats skeletons */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <FileText className="mb-1 size-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">{t('invoices.total_invoices')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <Coins className="mb-1 size-5 text-emerald" />
                <p className="text-2xl font-bold">{paidAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{t('invoices.total_amount')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <FileText className="mb-1 size-5 text-yellow-500" />
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">{t('invoice.status_pending')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <FileText className="mb-1 size-5 text-emerald" />
                <p className="text-2xl font-bold">{paidCount}</p>
                <p className="text-xs text-muted-foreground">{t('invoice.status_paid')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'outline'}
                size="sm"
                className={
                  activeTab === tab.key
                    ? 'bg-emerald text-emerald-foreground hover:bg-emerald/90'
                    : ''
                }
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Invoices List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileX2 className="mb-3 size-12 text-muted-foreground/40" />
                  <p className="text-lg font-medium text-muted-foreground">{t('invoices.no_invoices')}</p>
                  <p className="mt-1 text-sm text-muted-foreground/70">{t('invoices.no_invoices_desc')}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('invoice.number')}</TableHead>
                          <TableHead>{t('invoice.type')}</TableHead>
                          <TableHead>{t('invoice.status')}</TableHead>
                          <TableHead className="text-end">{t('invoice.amount')}</TableHead>
                          <TableHead>{t('invoice.date')}</TableHead>
                          <TableHead className="text-end">&nbsp;</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {inv.invoice_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1">
                                {getTypeIcon(inv.type)}
                                {t(getTypeTranslationKey(inv.type))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(inv.status)} variant="secondary">
                                {t(getStatusTranslationKey(inv.status))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end font-semibold">
                              {inv.amount.toFixed(2)} {inv.currency_code}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(inv.created_at, locale)}
                            </TableCell>
                            <TableCell className="text-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-emerald hover:text-emerald/80"
                                onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, '_blank')}
                              >
                                <ExternalLink className="size-3.5" />
                                {t('invoices.view_pdf')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-3 p-4 md:hidden">
                    {invoices.map((inv) => (
                      <Card key={inv.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-sm font-medium">{inv.invoice_number}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  {getTypeIcon(inv.type)}
                                  {t(getTypeTranslationKey(inv.type))}
                                </Badge>
                                <Badge className={`text-xs ${getStatusColor(inv.status)}`} variant="secondary">
                                  {t(getStatusTranslationKey(inv.status))}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className="text-lg font-bold">{inv.amount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{inv.currency_code}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t pt-3">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(inv.created_at, locale)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-emerald hover:text-emerald/80"
                              onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, '_blank')}
                            >
                              <ExternalLink className="size-3" />
                              {t('invoices.view_pdf')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className={locale === 'ar' ? 'rotate-180 size-4' : 'size-4'} />
                        <span className="ms-1">{t('common.previous')}</span>
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <span className="me-1">{t('common.next')}</span>
                        <ChevronRight className={locale === 'ar' ? 'rotate-180 size-4' : 'size-4'} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
