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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Ban,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';

// Types
interface AdminUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  last_login_at: string | null;
  created_at: string;
  listing_count: number;
}

interface UserDetail extends AdminUser {
  reports_made: Array<{ id: string; status: string; created_at: string }>;
  reports_against: Array<{ id: string; reason: string; status: string; reporter?: { display_name: string } }>;
  recent_listings: Array<{ id: string; title: string; status: string; view_count: number; created_at: string }>;
}

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'verified_user', label: 'Verified User' },
  { value: 'professional_seller', label: 'Professional Seller' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'admin', label: 'Admin' },
];

export default function UserManagement() {
  const { t, locale } = useTranslation();
  
  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selected user for detail
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = async (userId: string) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      
      const data = await res.json();
      setSelectedUser(data.data);
    } catch (err) {
      console.error('Fetch user detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, value?: unknown) => {
    try {
      setActionLoading(userId);
      
      const updateData: Record<string, unknown> = {};
      
      switch (action) {
        case 'suspend':
          updateData.is_suspended = value as boolean;
          break;
        case 'ban':
          updateData.is_banned = true;
          updateData.ban_reason = value as string;
          break;
        case 'unban':
          updateData.is_banned = false;
          updateData.ban_reason = null;
          break;
        case 'verify':
          updateData.is_verified = true;
          break;
        case 'change_role':
          updateData.role = value as string;
          break;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      // Refresh lists
      fetchUsers();
      if (selectedUser?.id === userId) {
        handleViewUser(userId);
      }
    } catch (err) {
      console.error('User action error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('export', 'csv');

      window.open(`/api/admin/users?${params}`, '_blank');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      content_manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      finance_manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      professional_seller: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      verified_user: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-medium">User Management</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing {users.length} of {total} users
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
              <Button variant="outline" className="mt-4" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.no_users')}</p>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Listings</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                              {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.display_name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                            {user.is_suspended && !user.is_banned && <Badge variant="secondary">Suspended</Badge>}
                            {!user.is_suspended && !user.is_banned && <Badge variant="default">Active</Badge>}
                            {user.is_verified && <Badge variant="outline" className="border-green-300 text-green-600">Verified</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900 dark:text-white">{user.listing_count}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
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

      {/* User Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role.replace(/_/g, ' ')}
                    </span>
                    {selectedUser.is_verified && <Badge variant="outline" className="border-green-300 text-green-600"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
                    {selectedUser.is_suspended && <Badge variant="secondary"><UserX className="h-3 w-3 mr-1" />Suspended</Badge>}
                    {selectedUser.is_banned && <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Banned</Badge>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.listing_count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Listings</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.reports_made?.length || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reports Made</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.reports_against?.length || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reports Against</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {!selectedUser.is_verified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUserAction(selectedUser.id, 'verify')}
                      disabled={actionLoading === selectedUser.id}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  
                  {selectedUser.is_suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUserAction(selectedUser.id, 'suspend', false)}
                      disabled={actionLoading === selectedUser.id}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUserAction(selectedUser.id, 'suspend', true)}
                      disabled={actionLoading === selectedUser.id}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  )}

                  {selectedUser.is_banned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUserAction(selectedUser.id, 'unban')}
                      disabled={actionLoading === selectedUser.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Ban className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will ban the user &quot;{selectedUser.display_name}&quot;. They will not be able to access their account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUserAction(selectedUser.id, 'ban', 'Violated platform rules')}
                          >
                            Ban User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Role Change */}
                  <Select onValueChange={(v) => handleUserAction(selectedUser.id, 'change_role', v)}>
                    <SelectTrigger className="w-[160px]">
                      <Shield className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Change Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter(r => r.value !== 'super_admin').map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recent Listings */}
              {selectedUser.recent_listings && selectedUser.recent_listings.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Listings</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.recent_listings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-sm">
                        <span className="truncate flex-1">{listing.title}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">{listing.status}</Badge>
                          <span className="text-xs text-gray-500">{listing.view_count} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
