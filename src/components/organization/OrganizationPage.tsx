'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  MapPin,
  Shield,
  Users,
  ExternalLink,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigationStore } from '@/stores/navigation';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Organization {
  id: string;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  description: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count: { count: number }[];
}

function getLocalizedField(
  org: Organization,
  field: 'name' | 'description',
  locale: string
): string | null {
  const localeField = `${field}_${locale}` as 'name_ar' | 'name_fr' | 'name_en' | 'description_ar' | 'description_fr' | 'description_en';
  return org[localeField] ?? org[field] ?? null;
}

export default function OrganizationPage() {
  const { t, locale } = useTranslation();
  const { selectedCategoryId: selectedOrgId, navigateHome } = useNavigationStore();
  const user = useAuthStore((s) => s.user);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    name_ar: '',
    name_fr: '',
    name_en: '',
    description: '',
    description_ar: '',
    description_fr: '',
    description_en: '',
    website: '',
    phone: '',
    address: '',
  });

  const fetchOrg = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setOrg(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  const fetchMembers = useCallback(async () => {
    if (!selectedOrgId) return;
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // silent
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchOrg();
    fetchMembers();
  }, [fetchOrg, fetchMembers]);

  const handleCreateOrg = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        toast.success(t('org.create_success'));
        setCreateOpen(false);
        setCreateForm({ name: '', name_ar: '', name_fr: '', name_en: '', description: '', description_ar: '', description_fr: '', description_en: '', website: '', phone: '', address: '' });
      } else {
        const err = await res.json().catch(() => ({ error: t('common.error') }));
        toast.error(err.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const memberCount = org?.member_count?.[0]?.count ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" dir={direction}>
      {/* Back & Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={navigateHome} className="gap-2">
          <ArrowLeft className={locale === 'ar' ? 'rotate-180' : ''} />
          {t('common.back')}
        </Button>

        {user && !org && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald text-white hover:bg-emerald/90">
                <Plus className="size-4" />
                {t('org.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir={direction}>
              <DialogHeader>
                <DialogTitle>{t('org.create')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="org-name">{t('org.name')}</Label>
                  <Input
                    id="org-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t('org.name')}
                  />
                </div>
                <div>
                  <Label htmlFor="org-name-en">Name (English)</Label>
                  <Input
                    id="org-name-en"
                    value={createForm.name_en}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name_en: e.target.value }))}
                    placeholder="Organization Name"
                  />
                </div>
                <div>
                  <Label htmlFor="org-name-fr">Nom (Français)</Label>
                  <Input
                    id="org-name-fr"
                    value={createForm.name_fr}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name_fr: e.target.value }))}
                    placeholder="Nom"
                  />
                </div>
                <div>
                  <Label htmlFor="org-name-ar">اسم المؤسسة (العربية)</Label>
                  <Input
                    id="org-name-ar"
                    value={createForm.name_ar}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name_ar: e.target.value }))}
                    placeholder="اسم المؤسسة"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label htmlFor="org-desc">{t('org.description')}</Label>
                  <Textarea
                    id="org-desc"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={t('org.description')}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="org-website">{t('org.website')}</Label>
                    <Input
                      id="org-website"
                      value={createForm.website}
                      onChange={(e) => setCreateForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-phone">{t('org.phone')}</Label>
                    <Input
                      id="org-phone"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+212..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-address">Address</Label>
                    <Input
                      id="org-address"
                      value={createForm.address}
                      onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Address"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateOrg}
                  disabled={!createForm.name.trim() || creating}
                  className="w-full bg-emerald text-white hover:bg-emerald/90"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : t('common.submit')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* No Organization State */}
      {!org && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Building2 className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('org.no_orgs')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {user ? t('org.create_hint') : t('auth.login_to_continue')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Details */}
      {org && (
        <div className="space-y-6">
          {/* Cover & Header */}
          <Card className="overflow-hidden">
            {org.cover_url && (
              <div
                className="h-40 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${org.cover_url})` }}
              />
            )}
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="size-16 shrink-0 border-2 border-background shadow-md">
                <AvatarImage src={org.logo_url ?? undefined} alt={getLocalizedField(org, 'name', locale) ?? org.name} />
                <AvatarFallback className="bg-emerald/10 text-emerald text-xl font-bold">
                  {(getLocalizedField(org, 'name', locale) ?? org.name)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl">
                    {getLocalizedField(org, 'name', locale) ?? org.name}
                  </CardTitle>
                  {org.is_verified && (
                    <Badge variant="secondary" className="gap-1 border-emerald/30 bg-emerald/10 text-emerald">
                      <Shield className="size-3" />
                      {t('org.verified')}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {memberCount} {t('org.members')}
                  </span>
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald hover:underline"
                    >
                      <Globe className="size-3.5" />
                      {org.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {org.description && (
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{t('org.description')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {getLocalizedField(org, 'description', locale) ?? org.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {(org.phone || org.address) && (
              <Card>
                <CardContent className="space-y-3 pt-6">
                  {org.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span dir="ltr">{org.phone}</span>
                    </div>
                  )}
                  {org.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span>{org.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  {t('profile.join_date')}: {new Date(org.created_at).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long' })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                {t('org.members')} ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('org.no_members')}</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={member.profile?.avatar_url ?? undefined} alt={member.profile?.display_name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {member.profile?.display_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) ?? '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">
                            {member.profile?.display_name ?? 'Unknown'}
                          </span>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
