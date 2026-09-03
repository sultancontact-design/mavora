'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewsResponse {
  reviews: Review[];
  avg_rating: number;
  total: number;
}

function StarRating({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={cn(
            'transition-transform',
            interactive && 'cursor-pointer hover:scale-110 focus:outline-none'
          )}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);

  if (locale === 'ar') {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 30) return `منذ ${days} يوماً`;
    return `منذ ${months} شهراً`;
  }
  if (locale === 'fr') {
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 30) return `il y a ${days}j`;
    return `il y a ${months}m`;
  }
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
}

export default function ReviewsSection({ listingId }: { listingId: string }) {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasReview, setHasReview] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Check if current user already reviewed
        if (user) {
          const alreadyReviewed = json.reviews.some(
            (r: Review) => r.reviewer?.id === user.id
          );
          setHasReview(alreadyReviewed);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [listingId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('reviews.login_required'));
      return;
    }
    if (selectedRating < 1) {
      toast.error(t('reviews.rating_label'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, comment: comment.trim() || undefined }),
      });

      if (res.status === 409) {
        toast.error(t('reviews.already_reviewed'));
        setHasReview(true);
      } else if (res.ok) {
        toast.success(t('reviews.success'));
        setSelectedRating(0);
        setComment('');
        setHasReview(true);
        fetchReviews();
      } else {
        const json = await res.json();
        toast.error(json.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t('reviews.title')}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Average Rating */}
          {data && data.total > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <span className="text-3xl font-bold text-foreground">{data.avg_rating}</span>
              <div className="flex flex-col">
                <StarRating rating={Math.round(data.avg_rating)} size="md" />
                <span className="mt-1 text-xs text-muted-foreground">
                  {data.total} {data.total === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          )}

          {/* Write Review Form */}
          {!hasReview && (
            <div className="mb-6 rounded-xl border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {t('reviews.write_review')}
              </h3>

              {!user ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <LogIn className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {t('reviews.login_required')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t('reviews.rating_label')}
                    </label>
                    <StarRating
                      rating={selectedRating}
                      size="lg"
                      interactive
                      onChange={setSelectedRating}
                    />
                  </div>
                  <Textarea
                    placeholder={t('reviews.write_review')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                    dir="auto"
                  />
                  <Button
                    className="bg-emerald text-emerald-foreground shadow-sm hover:bg-emerald/90"
                    onClick={handleSubmit}
                    disabled={submitting || selectedRating < 1}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="me-2 size-4 animate-spin" />
                        {t('reviews.submitting')}
                      </>
                    ) : (
                      t('reviews.submit_review')
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {data && data.reviews.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('reviews.no_reviews')}
              </p>
            )}

            {data?.reviews.map((review) => {
              const reviewerName = review.reviewer?.display_name ?? 'Anonymous';
              const initials = reviewerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={review.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={review.reviewer?.avatar_url ?? undefined} alt={reviewerName} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{reviewerName}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(review.created_at, locale)}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground" dir="auto">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
