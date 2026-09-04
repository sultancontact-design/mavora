'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Archive,
  Star,
  Eye,
  Users,
  FileText,
  AlertTriangle,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface QuickActionsProps {
  onActionComplete?: () => void;
  selectedListings?: string[];
}

interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

export default function QuickActions({ onActionComplete, selectedListings = [] }: QuickActionsProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BulkActionResult | null>(null);

  const actions = [
    {
      id: 'approve',
      label: t('admin.approve_selected') || 'Approve Selected',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      requiresSelection: true,
    },
    {
      id: 'reject',
      label: t('admin.reject_selected') || 'Reject Selected',
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      requiresSelection: true,
    },
    {
      id: 'archive',
      label: t('admin.archive_selected') || 'Archive Selected',
      icon: <Archive className="h-4 w-4 text-yellow-600" />,
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      requiresSelection: true,
    },
    {
      id: 'feature',
      label: t('admin.feature_selected') || 'Feature Selected',
      icon: <Star className="h-4 w-4 text-purple-600" />,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      requiresSelection: true,
    },
  ];

  const handleActionClick = (actionId: string) => {
    if (selectedListings.length === 0 && actions.find(a => a.id === actionId)?.requiresSelection) {
      return; // Don't open dialog if no selections
    }
    setSelectedAction(actionId);
    setReason('');
    setResult(null);
    setIsDialogOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_ids: selectedListings,
          action: selectedAction,
          reason: reason || undefined,
        }),
      });

      const data: BulkActionResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      setResult(data);
      
      if (data.success > 0 && onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      setResult({
        success: 0,
        failed: selectedListings.length,
        errors: [(error as Error).message],
        message: 'Operation failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsDialogOpen(false);
      setSelectedAction('');
      setReason('');
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          {t('admin.quick_actions') || 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selection Info */}
        {selectedListings.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              <Eye className="h-4 w-4 inline mr-1" />
              {selectedListings.length} {t('admin.selected') || 'selected'}
            </span>
            <Badge variant="secondary" className="text-xs">
              {selectedListings.length}
            </Badge>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`justify-start h-auto py-3 px-3 ${action.color} ${
                action.requiresSelection && selectedListings.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={() => handleActionClick(action.id)}
              disabled={action.requiresSelection && selectedListings.length === 0}
            >
              {action.icon}
              <span className="ml-2 text-sm">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs text-muted-foreground">{t('admin.users_tab') || 'Users'}</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs text-muted-foreground">{t('admin.listings_tab') || 'Listings'}</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
              <p className="text-xs text-muted-foreground">{t('admin.reports_tab') || 'Reports'}</p>
            </div>
          </div>
        </div>

        {/* Action Execution Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actions.find(a => a.id === selectedAction)?.icon}
                Confirm {selectedAction?.charAt(0).toUpperCase() + selectedAction?.slice(1)}
              </DialogTitle>
            </DialogHeader>

            {!result ? (
              <>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You are about to <strong>{selectedAction}</strong> {selectedListings.length} listing(s).
                    {(selectedAction === 'reject' || selectedAction === 'archive') && 
                      ' This action can be reversed later.'}
                    {selectedAction === 'delete' && 
                      ' ⚠️ This action cannot be undone!'}
                  </p>

                  {(selectedAction === 'reject') && (
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason (optional)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter rejection reason..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteAction}
                    disabled={isLoading}
                    className={
                      selectedAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      selectedAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      selectedAction === 'feature' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm {selectedAction?.charAt(0).toUpperCase() + selectedAction?.slice(1)}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              /* Result Display */
              <div className="py-4 space-y-4">
                <div className={`p-4 rounded-lg ${
                  result.failed === 0 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : result.success > 0 
                      ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.failed === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : result.success > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.message}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">Success:</span>{' '}
                      {result.success}
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">Failed:</span>{' '}
                      {result.failed}
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        View errors ({result.errors.length})
                      </summary>
                      <ul className="mt-2 text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                <DialogFooter>
                  <Button onClick={handleClose}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
