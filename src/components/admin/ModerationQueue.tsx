'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield,
  CheckCircle,
  XCircle,
  Archive,
  Eye,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  Star,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  Zap,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number | null;
  currencyCode: string;
  status: string;
  condition?: string;
  locationAddress?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  category?: {
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
  };
  seller?: {
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export default function ModerationQueue() {
  const { t, locale } = useTranslation();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    new_today: 0,
  });

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch('/api/admin/listings?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch listings');
      
      const data = await res.json();
      setListings(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalItems(data.pagination?.total || 0);
      setStats(data.stats || stats);
    } catch (err) {
      console.error('Moderation queue error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchListings();
    
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  const handleAction = async (listingId: string, action: string, data?: Record<string, unknown>) => {
    try {
      setActionLoading(listingId);
      
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          listingId,
          ...data,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Action failed');
      }

      await fetchListings();
      console.log('Action ' + action + ' completed for listing ' + listingId);
    } catch (err) {
      console.error('Action error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return locale === 'ar' ? 'مجاني' : 'Free';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'en-US', {
      style: 'currency',
      currency: currency || 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending_review: 'secondary',
      rejected: 'destructive',
      archived: 'outline',
      draft: 'outline',
      sold: 'outline',
    };
    
    const labels: Record<string, string> = {
      active: 'نشط',
      pending_review: 'قيد المراجعة',
      rejected: 'مرفوض',
      archived: 'مؤرشف',
      draft: 'مسودة',
      sold: 'مباع',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي الإعلانات</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">نشط</p>
                <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">قيد المراجعة</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">جديد اليوم</p>
                <p className="text-xl font-bold text-purple-600">{stats.new_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في الإعلانات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الإعلانات</SelectItem>
                <SelectItem value="pending_review">قيد المراجعة</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => fetchListings()} disabled={loading}>
              <RefreshCw className={'h-4 w-4 ml-2 ' + (loading ? 'animate-spin' : '')} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            قائمة المراجعة
          </CardTitle>
          <CardDescription>إدارة ومراجعة الإعلانات المرسلة من المستخدمين</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchListings}>إعادة المحاولة</Button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-gray-500">لا توجد إعلانات للمراجعة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{listing.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                            {listing.category && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {locale === 'ar' ? listing.category.nameAr : listing.category.name}
                              </span>
                            )}
                            {listing.seller && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {listing.seller.display_name}
                                {listing.seller.is_verified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                              </span>
                            )}
                            {listing.locationAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {listing.locationAddress}
                              </span>
                            )}
                            <span>{formatDate(listing.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 lg:mt-0">
                      <div className="text-right">
                        <p className="font-bold text-lg text-emerald-600">{formatPrice(listing.price, listing.currencyCode)}</p>
                        {getStatusBadge(listing.status)}
                      </div>

                      <div className="flex items-center gap-2">
                        {listing.status === 'pending_review' && (
                          <>
                            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(listing.id, 'approve')} disabled={actionLoading === listing.id}>
                              {actionLoading === listing.id ? <RefreshCw className="h-4 w-4 animate-spin ml-1" /> : <CheckCircle className="h-4 w-4 ml-1" />}
                              قبول
                            </Button>
                            
                            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" onClick={() => setSelectedListing(listing)}>
                                  <XCircle className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>رفض الإعلان</DialogTitle>
                                  <DialogDescription>يرجى إدخال سبب رفض هذا الإعلان</DialogDescription>
                                </DialogHeader>
                                <Textarea placeholder="سبب الرفض..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>إلغاء</Button>
                                  <Button variant="destructive" onClick={() => handleAction(selectedListing?.id || '', 'reject', { reason: rejectReason })} disabled={!rejectReason.trim()}>تأكيد الرفض</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {listing.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleAction(listing.id, 'feature', { days: 7 })} disabled={actionLoading === listing.id}>
                              <Zap className="h-4 w-4 ml-1" />
                              تمييز
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(listing.id, 'archive')} disabled={actionLoading === listing.id}>
                              <Archive className="h-4 w-4 ml-1" />
                              أرشفة
                            </Button>
                          </>
                        )}

                        <Button size="sm" variant="ghost" onClick={() => window.open('/listings/' + listing.id, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                عرض {(page - 1) * 20 + 1} - {Math.min(page * 20, totalItems)} من {totalItems} إعلان
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm">صفحة {page} من {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
