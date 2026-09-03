'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Eye,
  Check,
  X,
  Archive,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

// Types
interface AdminListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  status: string;
  is_featured: boolean;
  is_urgent: boolean;
  view_count: number;
  created_at: string;
  published_at: string | null;
  seller_id: string;
  seller?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  category?: {
    id: string;
    name_en: string;
    name_ar: string;
    name_fr: string;
  };
  currency?: {
    code: string;
  };
}

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
  { value: 'sold', label: 'Sold' },
];

export default function ListingManagement() {
  const { t, locale } = useTranslation();
  
  // State
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected listing
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/listings?${params}`);
      
      if (!res.ok) throw new Error('Failed to fetch listings');

      const data = await res.json();
      setListings(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Fetch listings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleModerate = async (listingId: string, action: 'approve' | 'reject' | 'archive') => {
    try {
      setActionLoading(listingId);
      
      const res = await fetch('/api/admin/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          action,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      // Refresh list
      fetchListings();
      if (showPreview) setShowPreview(false);
    } catch (err) {
      console.error('Moderate error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending_review: 'secondary',
      rejected: 'destructive',
      archived: 'outline',
      draft: 'outline',
      sold: 'secondary',
      reserved: 'outline',
    };
    
    const labels: Record<string, string> = {
      active: t('common.active'),
      pending_review: 'Pending Review',
      rejected: 'Rejected',
      archived: 'Archived',
      draft: t('common.draft'),
      sold: t('common.sold'),
      reserved: t('common.reserved'),
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getCategoryName = (category?: { name_en: string; name_ar: string; name_fr: string }) => {
    if (!category) return '-';
    return locale === 'ar' ? category.name_ar : locale === 'fr' ? category.name_fr : category.name_en;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Listing Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input
                placeholder="Search listings..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing {listings.length} of {total} listings
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchListings}>
                Retry
              </Button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.no_listings_all')}</p>
            </div>
          ) : (
            <>
              {/* Listings Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="max-w-[250px]">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{listing.title}</p>
                            <div className="flex gap-1 mt-1">
                              {listing.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
                              {listing.is_urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
                              {listing.seller?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{listing.seller?.display_name}</p>
                              {listing.seller?.is_verified && <span className="text-xs text-green-600">✓ Verified</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getCategoryName(listing.category)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {listing.price 
                              ? `${listing.currency?.code || ''} ${listing.price.toLocaleString()}`
                              : t('common.free')
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(listing.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600 dark:text-gray-400">{listing.view_count}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(listing.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedListing(listing); setShowPreview(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {listing.status === 'pending_review' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleModerate(listing.id, 'approve')}
                                  disabled={actionLoading === listing.id}
                                >
                                  {actionLoading === listing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleModerate(listing.id, 'reject')}
                                  disabled={actionLoading === listing.id}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Listing Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedListing.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-lg">
                    {selectedListing.price 
                      ? `${selectedListing.currency?.code || ''} ${selectedListing.price.toLocaleString()}`
                      : t('common.free')
                    }
                  </span>
                  {getStatusBadge(selectedListing.status)}
                  {selectedListing.is_featured && <Badge variant="default">Featured</Badge>}
                  {selectedListing.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                </div>
              </div>

              {/* Seller Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                  {selectedListing.seller?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">{selectedListing.seller?.display_name}</p>
                  <p className="text-sm text-gray-500">Seller ID: {selectedListing.seller_id}</p>
                  {selectedListing.seller?.is_verified && <span className="text-xs text-green-600">✓ Verified Seller</span>}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <p className="font-medium">{getCategoryName(selectedListing.category)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Views:</span>
                  <p className="font-medium">{selectedListing.view_count}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <p className="font-medium">{formatDate(selectedListing.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Published:</span>
                  <p className="font-medium">
                    {selectedListing.published_at ? formatDate(selectedListing.published_at) : 'Not published'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedListing.description}
                </p>
              </div>

              {/* Actions for pending listings */}
              {selectedListing.status === 'pending_review' && (
                <div className="border-t pt-4 flex gap-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleModerate(selectedListing.id, 'approve')}
                    disabled={actionLoading === selectedListing.id}
                  >
                    {actionLoading === selectedListing.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleModerate(selectedListing.id, 'reject')}
                    disabled={actionLoading === selectedListing.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleModerate(selectedListing.id, 'archive')}
                    disabled={actionLoading === selectedListing.id}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>
              )}

              {/* Actions for active listings */}
              {selectedListing.status === 'active' && (
                <div className="border-t pt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleModerate(selectedListing.id, 'archive')}
                    disabled={actionLoading === selectedListing.id}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
