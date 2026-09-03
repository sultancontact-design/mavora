'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth';
import MavoraLogo from '@/components/common/MavoraLogo';
import ImageUploader from '@/components/media/ImageUploader';
import DynamicFieldsForm from '@/components/listing/DynamicFieldsForm';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Upload,
  CheckCircle2,
  Package,
  MapPin,
  DollarSign,
  FileText,
  Eye
} from 'lucide-react';

type Step = 'category' | 'details' | 'media' | 'location' | 'price' | 'preview' | 'submit';

export default function CreateListingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    price: '',
    currency: 'MAD',
    location: '',
    city_id: '',
    condition: 'new',
    dynamic_fields: {} as Record<string, any>,
  });

  const [images, setImages] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const steps: { id: Step; title: string; icon: React.ReactNode; description: string }[] = [
    { id: 'category', title: t('create_listing.category'), icon: <Package className="size-5" />, description: t('create_listing.choose_category') },
    { id: 'details', title: t('create_listing.details'), icon: <FileText className="size-5" />, description: t('create_listing.enter_details') },
    { id: 'media', title: t('create_listing.photos'), icon: <Upload className="size-5" />, description: t('create_listing.upload_photos') },
    { id: 'location', title: t('create_listing.location'), icon: <MapPin className="size-5" />, description: t('create_listing.specify_location') },
    { id: 'price', title: t('create_listing.price'), icon: <DollarSign className="size-5" />, description: t('create_listing.set_price') },
    { id: 'preview', title: t('create_listing.preview'), icon: <Eye className="size-5" />, description: t('create_listing.review_listing') },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'category': return !!formData.category_id;
      case 'details': return !!formData.title && !!formData.description;
      case 'media': return true; // Images are optional
      case 'location': return !!formData.location;
      case 'price': return formData.price !== '' && parseFloat(formData.price) >= 0;
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images,
          user_id: user?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      // Redirect to the listing or listings page
      router.push(`/listings/${data.id || ''}`);
      router.refresh();
    } catch (err) {
      setError(t('auth.error_occurred'));
      console.error('Create listing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <MavoraLogo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('create_listing.post_ad')}</h1>
            <p className="text-muted-foreground">{t('create_listing.follow_steps')}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                    className={`flex flex-col items-center min-w-16 transition-all ${
                      index === currentStepIndex ? 'scale-110' : ''
                    } ${index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    disabled={index > currentStepIndex}
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      index === currentStepIndex
                        ? 'border-emerald bg-emerald text-white'
                        : index < currentStepIndex
                        ? 'border-emerald bg-emerald/10 text-emerald'
                        : 'border-border bg-background text-muted-foreground'
                    }`}>
                      {index < currentStepIndex ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden sm:block ${
                      index === currentStepIndex ? 'text-emerald' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-emerald' : 'bg-border'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStepIndex].icon}
              {steps[currentStepIndex].title}
            </CardTitle>
            <CardDescription>{steps[currentStepIndex].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Category Step */}
            {currentStep === 'category' && (
              <div className="space-y-4">
                <Label>{t('create_listing.select_category')}</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t('create_listing.choose_category_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Categories will be loaded from API */}
                    <SelectItem value="vehicles">{t('categories.vehicles')}</SelectItem>
                    <SelectItem value="real_estate">{t('categories.real_estate')}</SelectItem>
                    <SelectItem value="electronics">{t('categories.electronics')}</SelectItem>
                    <SelectItem value="fashion">{t('categories.fashion')}</SelectItem>
                    <SelectItem value="home_garden">{t('categories.home_garden')}</SelectItem>
                    <SelectItem value="jobs">{t('categories.jobs')}</SelectItem>
                    <SelectItem value="services">{t('categories.services')}</SelectItem>
                    <SelectItem value="other">{t('categories.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Details Step */}
            {currentStep === 'details' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('create_listing.title')} *</Label>
                  <Input
                    id="title"
                    placeholder={t('create_listing.title_placeholder')}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="h-12"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{formData.title.length}/200</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('create_listing.description')} *</Label>
                  <Textarea
                    id="description"
                    placeholder={t('create_listing.description_placeholder')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length}/5000</p>
                </div>

                <div className="space-y-2">
                  <Label>{t('create_listing.condition')}</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t('condition.new')}</SelectItem>
                      <SelectItem value="like_new">{t('condition.like_new')}</SelectItem>
                      <SelectItem value="excellent">{t('condition.excellent')}</SelectItem>
                      <SelectItem value="good">{t('condition.good')}</SelectItem>
                      <SelectItem value="fair">{t('condition.fair')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Fields based on category */}
                {formData.category_id && (
                  <DynamicFieldsForm
                    categoryId={formData.category_id}
                    values={formData.dynamic_fields}
                    onChange={(fields) => setFormData(prev => ({ ...prev, dynamic_fields: fields }))}
                  />
                )}
              </div>
            )}

            {/* Media Step */}
            {currentStep === 'media' && (
              <div className="space-y-4">
                <Label>{t('create_listing.upload_images')}</Label>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  maxImages={10}
                />
                <p className="text-sm text-muted-foreground">
                  {t('create_listing.image_guidelines')}
                </p>
              </div>
            )}

            {/* Location Step */}
            {currentStep === 'location' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t('create_listing.location')} *</Label>
                  <Input
                    id="location"
                    placeholder={t('create_listing.location_placeholder')}
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('create_listing.city')}</Label>
                  <Select value={formData.city_id} onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('create_listing.select_city')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casablanca">Casablanca</SelectItem>
                      <SelectItem value="rabat">Rabat</SelectItem>
                      <SelectItem value="marrakech">Marrakech</SelectItem>
                      <SelectItem value="fes">Fès</SelectItem>
                      <SelectItem value="tangier">Tanger</SelectItem>
                      <SelectItem value="agadir">Agadir</SelectItem>
                      <SelectItem value="meknes">Meknès</SelectItem>
                      <SelectItem value="oujda">Oujda</SelectItem>
                      <SelectItem value="kenitra">Kénitra</SelectItem>
                      <SelectItem value="tetouan">Tétouan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Price Step */}
            {currentStep === 'price' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('create_listing.price')} ({formData.currency}) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="h-12"
                      min="0"
                      step="0.01"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('create_listing.currency')}</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAD">MAD (DH)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-emerald/10 hover:border-emerald hover:text-emerald"
                    onClick={() => setFormData(prev => ({ ...prev, price: '0' }))}
                  >
                    {t('create_listing.free')}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-emerald/10 hover:border-emerald hover:text-emerald"
                    onClick={() => setFormData(prev => ({ ...prev, price: '100' }))}
                  >
                    100 MAD
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-emerald/10 hover:border-emerald hover:text-emerald"
                    onClick={() => setFormData(prev => ({ ...prev, price: '500' }))}
                  >
                    500 MAD
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-emerald/10 hover:border-emerald hover:text-emerald"
                    onClick={() => setFormData(prev => ({ ...prev, price: '1000' }))}
                  >
                    1,000 MAD
                  </Badge>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {currentStep === 'preview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">{t('create_listing.listing_preview')}</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                      <p className="font-bold text-lg">{formData.title || t('create_listing.no_title')}</p>
                      <p className="text-sm text-muted-foreground line-clamp-4">{formData.description || t('create_listing.no_description')}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge>{formData.condition}</Badge>
                        <Badge variant="outline">{formData.currency} {formData.price || '0'}</Badge>
                      </div>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="size-4" />
                        {formData.location || t('create_listing.no_location')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{t('create_listing.images_preview')}</h4>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {images.slice(0, 6).map((img, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-200">
                            <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                        {t('create_listing.no_images')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('create_listing.review_note')}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('common.previous')}
              </Button>

              {currentStepIndex === steps.length - 2 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2 bg-emerald hover:bg-emerald/90"
                >
                  {t('create_listing.review')}
                  <ArrowRight className="size-4" />
                </Button>
              ) : currentStepIndex === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed()}
                  className="gap-2 bg-emerald hover:bg-emerald/90 shadow-lg shadow-emerald/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t('common.submitting')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      {t('create_listing.publish_ad')}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2 bg-emerald hover:bg-emerald/90"
                >
                  {t('common.next')}
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
