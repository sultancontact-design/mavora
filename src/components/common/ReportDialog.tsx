'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ReportDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASON_OPTIONS = [
  { value: 'scam', key: 'report.reason_scam' },
  { value: 'prohibited', key: 'report.reason_prohibited' },
  { value: 'duplicate', key: 'report.reason_duplicate' },
  { value: 'wrong_category', key: 'report.reason_wrong_category' },
  { value: 'other', key: 'report.reason_other' },
] as const;

export default function ReportDialog({ listingId, open, onOpenChange }: ReportDialogProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('report.login_required'));
      return;
    }

    if (!reason) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        toast.info(t('report.already_reported'));
        onOpenChange(false);
        return;
      }

      if (!res.ok) {
        toast.error(t('common.error'));
        return;
      }

      toast.success(t('report.success'));
      onOpenChange(false);
      setReason('');
      setDescription('');
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('report.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Reason Select */}
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t('report.title_label')}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder={t('report.title_label')} />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="report-description">{t('report.description_label')}</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.description_placeholder')}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('report.submitting')}
              </>
            ) : (
              t('report.submit')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
