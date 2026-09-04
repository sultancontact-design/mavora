'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Check,
  X,
  Eye,
  Loader2,
  Filter,
  ExternalLink,
  MessageSquare,
  User,
  FileText,
  Clock,
} from 'lucide-react';

// Types
interface AdminReport {
  id: string;
  reporter_id: string;
  target_type: 'listing' | 'user' | 'message';
  target_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reporter?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  listing?: {
    title: string;
    seller_id: string;
  } | null;
}

interface ReportManagementProps {
  onActionComplete?: () => void;
}

const REASON_LABELS: Record<string, string> = {
  scam: 'Scam/Fraud',
  prohibited: 'Prohibited Content',
  duplicate: 'Duplicate Listing',
  wrong_category: 'Wrong Category',
  spam: 'Spam',
  offensive: 'Offensive Content',
  fake: 'Fake Listing',
  other: 'Other',
};

export default function ReportManagement({ onActionComplete }: ReportManagementProps) {
  const { t, locale } = useTranslation();
  
  // State
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Selected report
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/admin/reports?${params}`);
      
      if (!res.ok) throw new Error('Failed to fetch reports');

      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      setActionLoading(reportId);
      
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          action,
          note: resolutionNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      // Refresh list
      fetchReports();
      setShowDetail(false);
      setSelectedReport(null);
      setResolutionNote('');
      
      // Notify parent
      onActionComplete?.();
    } catch (err) {
      console.error('Report action error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      reviewed: 'secondary',
      resolved: 'default',
      dismissed: 'outline',
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'listing': return <FileText className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    return REASON_LABELS[reason] || reason.replace(/_/g, ' ');
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-medium">Report Management</CardTitle>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
              <Button variant="outline" className="mt-4" onClick={fetchReports}>
                Retry
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.no_reports')}</p>
            </div>
          ) : (
            <>
              {/* Reports Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow 
                        key={report.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          report.status === 'pending' ? 'bg-red-50 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              {getTargetIcon(report.target_type)}
                              <span className="font-medium capitalize text-sm">{report.target_type}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {getReasonLabel(report.reason)}
                            </p>
                            {report.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.target_type === 'listing' && report.listing ? (
                            <span className="text-sm truncate max-w-[150px] block">
                              {report.listing.title}
                            </span>
                          ) : (
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                              {report.target_id.slice(0, 8)}...
                            </code>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-medium">
                              {report.reporter?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm">{report.reporter?.display_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(report.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedReport(report); setShowDetail(true); setResolutionNote(''); }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Showing {reports.length} reports
                {statusFilter === 'pending' && pendingCount > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    ({pendingCount} need attention)
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTargetIcon(selectedReport.target_type)}
                    <span className="font-medium capitalize">{selectedReport.target_type} Report</span>
                  </div>
                  {getStatusBadge(selectedReport.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reason:</span>
                    <p className="font-medium">{getReasonLabel(selectedReport.reason)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Date:</span>
                    <p className="font-medium">{formatDate(selectedReport.created_at)}</p>
                  </div>
                </div>

                {selectedReport.description && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Description:</span>
                    <p className="text-sm mt-1">{selectedReport.description}</p>
                  </div>
                )}
              </div>

              {/* Reporter Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-medium">
                  {selectedReport.reporter?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-sm">Reported by</p>
                  <p className="text-sm text-gray-500">{selectedReport.reporter?.display_name || 'Unknown user'}</p>
                </div>
              </div>

              {/* Target Info */}
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Reported Content</p>
                
                {selectedReport.target_type === 'listing' && selectedReport.listing ? (
                  <div>
                    <p className="font-medium">{selectedReport.listing.title}</p>
                    <a 
                      href={`/listing/${selectedReport.target_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View listing <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm">Target ID:</p>
                    <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {selectedReport.target_id}
                    </code>
                  </div>
                )}
              </div>

              {/* Resolution Note */}
              {selectedReport.status === 'pending' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Resolution Note (optional)
                  </label>
                  <Textarea
                    placeholder="Add a note about your decision..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Actions for pending reports */}
              {selectedReport.status === 'pending' && (
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                    disabled={actionLoading === selectedReport.id}
                  >
                    {actionLoading === selectedReport.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Dismiss
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleReportAction(selectedReport.id, 'resolve')}
                    disabled={actionLoading === selectedReport.id}
                  >
                    {actionLoading === selectedReport.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Resolve & Take Action
                  </Button>
                </DialogFooter>
              )}

              {/* Info for resolved/dismissed reports */}
              {(selectedReport.status === 'resolved' || selectedReport.status === 'dismissed') && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selectedReport.reviewed_at 
                        ? `Reviewed on ${formatDate(selectedReport.reviewed_at)}`
                        : 'Review date not recorded'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
