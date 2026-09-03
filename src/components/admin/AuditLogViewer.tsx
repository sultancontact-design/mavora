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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ClipboardList,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Activity,
  Eye,
} from 'lucide-react';

// Types
interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: {
    display_name: string;
  } | null;
}

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'ban', label: 'Ban' },
  { value: 'unban', label: 'Unban' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'unsuspend', label: 'Unsuspend' },
];

const RESOURCE_TYPES = [
  { value: '', label: 'All Resources' },
  { value: 'user', label: 'User' },
  { value: 'listing', label: 'Listing' },
  { value: 'category', label: 'Category' },
  { value: 'report', label: 'Report' },
  { value: 'payment', label: 'Payment' },
  { value: 'settings', label: 'Settings' },
  { value: 'plan', label: 'Plan' },
];

export default function AuditLogViewer() {
  const { t, locale } = useTranslation();
  
  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');

  // Selected log entry
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (actionFilter) params.set('action', actionFilter);
      if (resourceTypeFilter) params.set('resource_type', resourceTypeFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!res.ok) throw new Error('Failed to fetch audit logs');

      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, actionFilter, resourceTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      login: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      logout: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      reject: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      ban: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      unban: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      suspend: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      unsuspend: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={`capitalize ${colors[action] || ''}`}
      >
        {action}
      </Badge>
    );
  };

  const getResourceBadge = (type: string) => {
    const icons: Record<string, string> = {
      user: '👤',
      listing: '📝',
      category: '📁',
      report: '🚩',
      payment: '💳',
      settings: '⚙️',
      plan: '📋',
    };

    return (
      <span className="inline-flex items-center gap-1">
        <span>{icons[type] || '📄'}</span>
        <span className="capitalize">{type}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            <CardTitle className="text-lg font-medium">Audit Logs</CardTitle>
            <Badge variant="outline">{total} entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="flex-1 md:w-[180px]">
                <Activity className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={resourceTypeFilter} onValueChange={(v) => { setResourceTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="flex-1 md:w-[180px]">
                <Filter className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" /> {/* Spacer */}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing {logs.length} of {total} log entries
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchLogs}>
                Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.no_audit_logs')}</p>
            </div>
          ) : (
            <>
              {/* Logs Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatDate(log.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium">
                              {log.actor?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-medium">
                              {log.actor?.display_name || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getResourceBadge(log.resource_type)}
                          </span>
                          {log.resource_id && (
                            <code className="block text-xs text-gray-400 mt-0.5">
                              ID: {log.resource_id.slice(0, 8)}...
                            </code>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono text-gray-500">
                            {log.ip_address || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedLog(log); setShowDetail(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Log Detail Dialog */}
      {selectedLog && (
        <dialog 
          open={showDetail} 
          onClose={() => setShowDetail(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDetail(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Audit Log Entry Details
                </h2>
                <button 
                  onClick={() => setShowDetail(false)}
                  className="p-2 hover:bg-gray-100 dark:hover-gray-800 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ID:</span>
                  <p className="font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                  <p>{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Actor:</span>
                  <p>{selectedLog.actor?.display_name || 'System'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Actor ID:</span>
                  <p className="font-mono">{selectedLog.actor_id || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Action:</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resource Type:</span>
                  <p className="capitalize mt-1">{selectedLog.resource_type}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resource ID:</span>
                  <p className="font-mono">{selectedLog.resource_id || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                  <p className="font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">User Agent:</span>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1 break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {/* Details JSON */}
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Additional Details:</span>
                <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1 overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
