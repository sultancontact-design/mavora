'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit2,
  Save,
  X,
  Package,
  Heart,
  Star,
  Settings
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading, setUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    display_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        display_name: user.display_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      // Update local state
      if (data.user) {
        setUser(data.user);
      }
      
      setSuccess(t('profile.updated_successfully'));
      setIsEditing(false);
    } catch (err) {
      setError(t('auth.error_occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        display_name: user.display_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <MavoraLogo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('common.profile')}</h1>
            <p className="text-muted-foreground">{t('profile.manage_account')}</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-20 ring-4 ring-emerald/20">
                  <AvatarImage src={user.avatar_url} alt={user.display_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {user.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.display_name}</CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    <Mail className="size-4" />
                    {user.email}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="bg-emerald/10 text-emerald border-emerald/20">
                      {user.role || 'user'}
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="size-3 me-1" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit2 className="size-4" />
                  {t('common.edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="gap-2 bg-emerald hover:bg-emerald/90"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {t('common.save')}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="size-4" />
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Status Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald/10 border border-emerald/20 text-emerald text-sm">
                {success}
              </div>
            )}

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="size-4" />
                  {t('profile.personal_info')}
                </TabsTrigger>
                <TabsTrigger value="listings" className="gap-2">
                  <Package className="size-4" />
                  {t('common.my_listings')}
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Star className="size-4" />
                  {t('profile.activity')}
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="profile" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">{t('auth.display_name')}</Label>
                    <Input
                      id="displayName"
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      disabled={!isEditing}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="h-11"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="size-3 inline me-1" />
                      {t('profile.phone')}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+212 6XX XXX XXX"
                      className="h-11"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="size-3 inline me-1" />
                      {t('profile.location')}
                    </Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      placeholder={t('profile.location_placeholder')}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder={t('bio_placeholder')}
                  />
                </div>
              </TabsContent>

              {/* My Listings Tab */}
              <TabsContent value="listings" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="size-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">{t('profile.no_listings_yet')}</p>
                  <p className="text-sm mt-2">{t('profile.start_posting')}</p>
                  <Button 
                    className="mt-4 bg-emerald hover:bg-emerald/90"
                    onClick={() => router.push('/listings/create')}
                  >
                    {t('common.post_ad')}
                  </Button>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-card border">
                    <Heart className="size-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{t('profile.favorites_count', { count: 0 })}</p>
                      <p className="text-sm text-muted-foreground">{t('profile.saved_items')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/favorites')}>
                      {t('common.view')}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-card border">
                    <Star className="size-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">{t('profile.reviews_count', { count: 0 })}</p>
                      <p className="text-sm text-muted-foreground">{t('profile.received_reviews')}</p>
                    </div>
                    <Badge variant="secondary">0</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-card border">
                    <Settings className="size-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{t('profile.member_since')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
