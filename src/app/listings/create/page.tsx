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
  Eye,
  Sparkles,
  Camera,
  Tag,
  Navigation,
  Coins,
  Zap,
  AlertCircle,
  Image as ImageIcon,
  ChevronDown,
  X
} from 'lucide-react';

type Step = 'category' | 'details' | 'media' | 'location' | 'price' | 'preview' | 'submit';

export default function CreateListingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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
  
  // Fetch real categories from API
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    nameAr?: string;
    nameFr?: string;
    slug: string;
    children?: Array<{ id: string; name: string; nameAr?: string; nameFr?: string; slug: string }>;
  }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Check for demo mode or admin session (allow access without real auth)
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  useEffect(() => {
    // Check for demo mode - allow access for testing
    if (typeof window !== 'undefined') {
      const demoUser = localStorage.getItem('mavora_user');
      const demoToken = localStorage.getItem('mavora_auth_token');
      const isDemo = !!(demoUser || demoToken || process.env.NODE_ENV !== 'production');
      setIsDemoMode(isDemo);
      
      // Only redirect if not in demo mode AND no user
      if (!authLoading && !user && !isDemo) {
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent('/listings/create')}`;
        router.push(redirectUrl);
      }
    }
  }, [user, authLoading, router]);

  // Fetch categories on mount (with mock data fallback)
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setCategories(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch categories, using mock data:', err);
      } finally {
        // Always provide mock categories as fallback
        if (categories.length === 0) {
          const mockCategories = [
            { id: 'electronics', name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics' },
            { id: 'realestate', name: 'Real Estate', nameAr: 'عقارات', slug: 'realestate' },
            { id: 'cars', name: 'Cars', nameAr: 'سيارات', slug: 'cars' },
            { id: 'furniture', name: 'Furniture', nameAr: 'أثاث', slug: 'furniture' },
            { id: 'fashion', name: 'Fashion', nameAr: 'أزياء', slug: 'fashion' },
            { id: 'sports', name: 'Sports', nameAr: 'رياضة', slug: 'sports' },
            { id: 'appliances', name: 'Appliances', nameAr: 'أجهزة منزلية', slug: 'appliances' },
            { id: 'jobs', name: 'Jobs', nameAr: 'وظائف', slug: 'jobs' },
          ];
          setCategories(mockCategories);
        }
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const steps: { id: Step; title: string; icon: React.ReactNode; description: string; gradient: string }[] = [
    { id: 'category', title: t('create_listing.category'), icon: <Tag className="size-5" />, description: t('create_listing.choose_category'), gradient: 'from-violet-500 to-purple-600' },
    { id: 'details', title: t('create_listing.details'), icon: <FileText className="size-5" />, description: t('create_listing.enter_details'), gradient: 'from-blue-500 to-cyan-500' },
    { id: 'media', title: t('create_listing.photos'), icon: <Camera className="size-5" />, description: t('create_listing.upload_photos'), gradient: 'from-pink-500 to-rose-500' },
    { id: 'location', title: t('create_listing.location'), icon: <Navigation className="size-5" />, description: t('create_listing.specify_location'), gradient: 'from-amber-500 to-orange-500' },
    { id: 'price', title: t('create_listing.price'), icon: <Coins className="size-5" />, description: t('create_listing.set_price'), gradient: 'from-emerald-500 to-green-500' },
    { id: 'preview', title: t('create_listing.preview'), icon: <Eye className="size-5" />, description: t('create_listing.review_listing'), gradient: 'from-indigo-500 to-purple-600' },
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
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(steps[currentStepIndex + 1].id);
        setError('');
        setIsTransitioning(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(steps[currentStepIndex - 1].id);
        setError('');
        setIsTransitioning(false);
      }, 150);
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

  // Show loading while checking auth, OR a friendly "redirecting" UI if no user.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-emerald-400" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur-xl" />
          </div>
          <p className="text-sm text-zinc-400">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Don't render the form if no user AND not in demo mode
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="text-center max-w-md">
          <div className="relative inline-flex mb-6">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 p-[1px]">
              <div className="w-full h-full rounded-2xl bg-[#12121a] flex items-center justify-center">
                <Loader2 className="size-10 animate-spin text-emerald-400" />
              </div>
            </div>
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-500/30 blur-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {t('auth.login_required') || 'Login required'}
          </h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {t('auth.redirecting_to_login') || 'Redirecting you to the login page...'}
          </p>
          <a
            href={`/auth/login?redirect=${encodeURIComponent('/listings/create')}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            {t('common.login') || 'Login'}
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="size-11 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 hover:border-zinc-600/50 transition-all duration-300"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MavoraLogo size="md" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Sparkles className="size-6 text-emerald-400" />
                {t('create_listing.post_ad')}
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">{t('create_listing.follow_steps')}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps - Premium Design */}
        <div className="mb-8">
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl shadow-black/20">
            {/* Progress Bar */}
            <div className="relative mb-6">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-start justify-between gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center flex-1 max-w-[80px]">
                  <button
                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                    disabled={index > currentStepIndex}
                    className={`group relative flex flex-col items-center w-full transition-all duration-300 ${
                      index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    {/* Icon Container */}
                    <div className={`relative mb-3 transition-all duration-500 ${
                      index === currentStepIndex ? 'scale-110' : ''
                    }`}>
                      {/* Glow Effect for Active */}
                      {index === currentStepIndex && (
                        <>
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-30 blur-lg group-hover:opacity-50 transition-opacity`} />
                          <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-20 animate-pulse`} />
                        </>
                      )}
                      
                      {/* Main Circle */}
                      <div className={`relative size-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                        index === currentStepIndex
                          ? `bg-gradient-to-br ${step.gradient} border-transparent shadow-lg`
                          : index < currentStepIndex
                          ? `bg-gradient-to-br ${step.gradient} border-transparent`
                          : 'bg-zinc-800 border-zinc-700'
                      }`}>
                        {index < currentStepIndex ? (
                          <CheckCircle2 className="size-5 text-white" />
                        ) : (
                          <span className={index === currentStepIndex ? 'text-white' : 'text-zinc-500'}>
                            {step.icon}
                          </span>
                        )}
                      </div>

                      {/* Step Number Badge */}
                      <div className={`absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === currentStepIndex
                          ? 'bg-white text-zinc-900'
                          : index < currentStepIndex
                          ? 'bg-emerald-400 text-zinc-900'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Label */}
                    <span className={`text-xs font-medium text-center leading-tight transition-colors duration-300 ${
                      index === currentStepIndex 
                        ? 'text-white' 
                        : index < currentStepIndex 
                        ? 'text-emerald-400' 
                        : 'text-zinc-500'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}`}>
          <Card className="bg-zinc-900/40 backdrop-blur-xl border-zinc-800/50 shadow-2xl shadow-black/30 overflow-hidden">
            {/* Card Header with Gradient Accent */}
            <div className={`h-1 bg-gradient-to-r ${steps[currentStepIndex].gradient}`} />
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl bg-gradient-to-br ${steps[currentStepIndex].gradient} p-[1px]`}>
                  <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                    {steps[currentStepIndex].icon}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    {steps[currentStepIndex].title}
                    <span className="text-xs font-normal text-zinc-500">Step {currentStepIndex + 1} of {steps.length}</span>
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">
                    {steps[currentStepIndex].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {/* Error Message - Enhanced */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="size-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-300">Something went wrong</p>
                      <p className="text-sm text-red-400/80 mt-1">{error}</p>
                    </div>
                    <button 
                      onClick={() => setError('')}
                      className="text-red-400/60 hover:text-red-300 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Category Step - Enhanced */}
              {currentStep === 'category' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Tag className="size-4 text-violet-400" />
                    <Label className="text-sm font-medium text-zinc-300">{t('create_listing.select_category')}</Label>
                  </div>
                  
                  {categoriesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="relative">
                        <Loader2 className="size-8 animate-spin text-violet-400" />
                        <div className="absolute inset-0 bg-violet-400/20 rounded-full blur-lg" />
                      </div>
                      <p className="text-sm text-zinc-500">{t('common.loading')}...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                        <SelectTrigger className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl text-base transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-600">
                          <SelectValue placeholder={t('create_listing.choose_category_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                              className="text-zinc-300 focus:bg-violet-500/20 focus:text-white rounded-lg py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="size-4 text-violet-400" />
                                {category.nameAr || category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Category Cards Grid Alternative */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                        {categories.slice(0, 6).map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setFormData(prev => ({ ...prev, category_id: category.id }))}
                            className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                              formData.category_id === category.id
                                ? 'bg-violet-500/10 border-violet-500/50 shadow-lg shadow-violet-500/10'
                                : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                            }`}
                          >
                            <div className={`size-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                              formData.category_id === category.id ? 'bg-violet-500/20' : 'bg-zinc-700/50 group-hover:bg-zinc-700'
                            }`}>
                              <Package className={`size-5 transition-colors ${
                                formData.category_id === category.id ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-400'
                              }`} />
                            </div>
                            <p className={`text-sm font-medium truncate transition-colors ${
                              formData.category_id === category.id ? 'text-violet-300' : 'text-zinc-400 group-hover:text-zinc-300'
                            }`}>
                              {category.nameAr || category.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {categories.length === 0 && !categoriesLoading && (
                    <div className="text-center py-8 px-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                      <Package className="size-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">
                        No categories available. Please try refreshing the page.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Details Step - Enhanced */}
              {currentStep === 'details' && (
                <div className="space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <FileText className="size-4 text-blue-400" />
                        {t('create_listing.title')} <span className="text-red-400">*</span>
                      </Label>
                      <span className={`text-xs font-mono transition-colors ${
                        formData.title.length > 180 ? 'text-amber-400' : 'text-zinc-500'
                      }`}>
                        {formData.title.length}/200
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="title"
                        placeholder={t('create_listing.title_placeholder')}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-base pr-12 transition-all duration-300"
                        maxLength={200}
                      />
                      {formData.title && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className={`size-5 ${formData.title.length >= 5 ? 'text-emerald-400' : 'text-zinc-500'}`} />
                        </div>
                      )}
                    </div>
                    {/* Character Progress Bar */}
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          formData.title.length > 180 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(formData.title.length / 200) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <FileText className="size-4 text-cyan-400" />
                        {t('create_listing.description')} <span className="text-red-400">*</span>
                      </Label>
                      <span className="text-xs font-mono text-zinc-500">
                        {formData.description.length}/5000
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder={t('create_listing.description_placeholder')}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      maxLength={5000}
                      className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl text-base resize-none transition-all duration-300"
                    />
                  </div>

                  {/* Condition Selector - Enhanced */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-400" />
                      {t('create_listing.condition')}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {[
                        { value: 'new', label: t('condition.new'), emoji: '✨' },
                        { value: 'like_new', label: t('condition.like_new'), emoji: '🌟' },
                        { value: 'excellent', label: t('condition.excellent'), emoji: '💎' },
                        { value: 'good', label: t('condition.good'), emoji: '👍' },
                        { value: 'fair', label: t('condition.fair'), emoji: '👌' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, condition: item.value }))}
                          className={`p-3 rounded-xl border transition-all duration-300 text-center group ${
                            formData.condition === item.value
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                              : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                          }`}
                        >
                          <span className="text-lg block mb-1">{item.emoji}</span>
                          <span className={`text-xs font-medium transition-colors ${
                            formData.condition === item.value ? 'text-amber-300' : 'text-zinc-400 group-hover:text-zinc-300'
                          }`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields based on category */}
                  {formData.category_id && (
                    <div className="pt-4 border-t border-zinc-800/50">
                      <DynamicFieldsForm
                        categoryId={formData.category_id}
                        values={formData.dynamic_fields}
                        onChange={(fields) => setFormData(prev => ({ ...prev, dynamic_fields: fields }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Media Step - Enhanced */}
              {currentStep === 'media' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <ImageIcon className="size-4 text-pink-400" />
                    <Label className="text-sm font-medium text-zinc-300">{t('create_listing.upload_images')}</Label>
                    <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-pink-500/20 text-xs">
                      Optional
                    </Badge>
                  </div>
                  
                  {/* Custom Drag & Drop Zone Enhancement */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl blur-xl" />
                    <div className="relative bg-zinc-800/30 border-2 border-dashed border-zinc-700/50 rounded-2xl p-8 transition-all duration-300 hover:border-pink-500/50 hover:bg-zinc-800/50">
                      <ImageUploader
                        images={images}
                        onImagesChange={setImages}
                        maxImages={10}
                      />
                    </div>
                  </div>

                  {/* Image Guidelines */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                    <div className="size-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                      <Camera className="size-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300 mb-1">Photo Tips</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {t('create_listing.image_guidelines')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['High Quality', 'Good Lighting', 'Multiple Angles', 'No Watermarks'].map((tip) => (
                          <span key={tip} className="px-2 py-1 rounded-md bg-zinc-700/50 text-xs text-zinc-400">
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Images Preview Grid */}
                  {images.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Uploaded Photos</span>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                          {images.length}/10
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50 group relative">
                            <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">{i + 1}</span>
                            </div>
                            {i === 0 && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold">
                                MAIN
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Step - Enhanced */}
              {currentStep === 'location' && (
                <div className="space-y-6">
                  {/* Location Input */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <MapPin className="size-4 text-amber-400" />
                      {t('create_listing.location')} <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
                      <Input
                        id="location"
                        placeholder={t('create_listing.location_placeholder')}
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base pr-12 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* City Selection - Enhanced Cards */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Navigation className="size-4 text-orange-400" />
                      {t('create_listing.city')}
                    </Label>
                    
                    <Select value={formData.city_id} onValueChange={(value) => setFormData(prev => ({ ...prev, city_id: value }))}>
                      <SelectTrigger className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl text-base transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-600">
                        <SelectValue placeholder={t('create_listing.select_city')} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                        {[
                          { value: 'casablanca', label: 'Casablanca', icon: '🏙️' },
                          { value: 'rabat', label: 'Rabat', icon: '🏛️' },
                          { value: 'marrakech', label: 'Marrakech', icon: '🕌' },
                          { value: 'fes', label: 'Fès', icon: '📿' },
                          { value: 'tangier', label: 'Tanger', icon: '⚓' },
                          { value: 'agadir', label: 'Agadir', icon: '🏖️' },
                          { value: 'meknes', label: 'Meknès', icon: '🏰' },
                          { value: 'oujda', label: 'Oujda', icon: '🌵' },
                          { value: 'kenitra', label: 'Kénitra', icon: '🌊' },
                          { value: 'tetouan', label: 'Tétouan', icon: '🎨' },
                        ].map((city) => (
                          <SelectItem 
                            key={city.value} 
                            value={city.value}
                            className="text-zinc-300 focus:bg-orange-500/20 focus:text-white rounded-lg py-3"
                          >
                            <div className="flex items-center gap-2">
                              <span>{city.icon}</span>
                              {city.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* City Quick Select Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                      {['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger'].map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, city_id: city.toLowerCase() }))}
                          className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                            formData.city_id === city.toLowerCase()
                              ? 'bg-orange-500/10 border-orange-500/50'
                              : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600'
                          }`}
                        >
                          <span className={`text-sm font-medium transition-colors ${
                            formData.city_id === city.toLowerCase() ? 'text-orange-300' : 'text-zinc-400'
                          }`}>
                            {city}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-6 text-center">
                    <MapPin className="size-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">Location will be displayed on map</p>
                  </div>
                </div>
              )}

              {/* Price Step - Enhanced */}
              {currentStep === 'price' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price Input */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Coins className="size-4 text-emerald-400" />
                        {t('create_listing.price')} ({formData.currency}) <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">{formData.currency === 'MAD' ? 'DH' : formData.currency}</span>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-base pl-16 transition-all duration-300"
                          min="0"
                          step="0.01"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <DollarSign className="size-4 text-green-400" />
                        {t('create_listing.currency')}
                      </Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger className="h-14 bg-zinc-800/50 border-zinc-700/50 text-white focus:border-green-500 focus:ring-green-500/20 rounded-xl text-base transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                          <SelectItem value="MAD" className="py-3">
                            <div className="flex items-center gap-2">
                              <span>🇲🇦</span> MAD (Dirham)
                            </div>
                          </SelectItem>
                          <SelectItem value="USD" className="py-3">
                            <div className="flex items-center gap-2">
                              <span>🇺🇸</span> USD (Dollar)
                            </div>
                          </SelectItem>
                          <SelectItem value="EUR" className="py-3">
                            <div className="flex items-center gap-2">
                              <span>🇪🇺</span> EUR (Euro)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Quick Select - Enhanced */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-400">Quick Select</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: t('create_listing.free'), value: '0', icon: '🆓' },
                        { label: '100 MAD', value: '100', icon: '💰' },
                        { label: '500 MAD', value: '500', icon: '💵' },
                        { label: '1,000 MAD', value: '1000', icon: '💎' },
                        { label: '5,000 MAD', value: '5000', icon: '🏆' },
                        { label: 'Negotiable', value: '', icon: '🤝' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => item.value !== '' && setFormData(prev => ({ ...prev, price: item.value }))}
                          className={`px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                            formData.price === item.value
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                              : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Display Preview */}
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 text-center">
                      <p className="text-sm text-zinc-400 mb-2">Your Listing Price</p>
                      <p className="text-4xl font-bold text-white">
                        {formData.currency === 'MAD' ? 'DH' : formData.currency} {parseFloat(formData.price).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Step - Enhanced Professional Preview */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  {/* Main Preview Card */}
                  <div className="rounded-2xl bg-zinc-800/30 border border-zinc-700/30 overflow-hidden">
                    {/* Preview Header */}
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b border-zinc-700/30">
                      <div className="flex items-center gap-2">
                        <Eye className="size-4 text-indigo-400" />
                        <span className="font-medium text-white">{t('create_listing.listing_preview')}</span>
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs ml-auto">
                          Preview Mode
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Details */}
                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Title</p>
                            <h3 className="text-xl font-bold text-white">
                              {formData.title || <span className="text-zinc-500 italic">{t('create_listing.no_title')}</span>}
                            </h3>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-sm text-zinc-300 line-clamp-4 leading-relaxed">
                              {formData.description || <span className="italic text-zinc-500">{t('create_listing.no_description')}</span>}
                            </p>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 capitalize">
                              {formData.condition}
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                              <Coins className="size-3 mr-1" />
                              {formData.currency} {formData.price || '0'}
                            </Badge>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                              <MapPin className="size-3 mr-1" />
                              {formData.location || t('create_listing.no_location')}
                            </Badge>
                          </div>
                        </div>

                        {/* Right Column - Images */}
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Photos</p>
                          {images.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {images.slice(0, 6).map((img, i) => (
                                <div key={i} className={`aspect-square rounded-xl overflow-hidden bg-zinc-700/50 border border-zinc-700/50 ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                                  <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl bg-zinc-800/50 border border-dashed border-zinc-700/50 flex flex-col items-center justify-center text-zinc-500">
                              <ImageIcon className="size-10 mb-2 opacity-50" />
                              <p className="text-sm">{t('create_listing.no_images')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 text-center">
                      <p className="text-2xl font-bold text-white">{images.length}</p>
                      <p className="text-xs text-zinc-500 mt-1">Photos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 text-center">
                      <p className="text-2xl font-bold text-white">{formData.title.length}</p>
                      <p className="text-xs text-zinc-500 mt-1">Characters</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 text-center">
                      <p className="text-2xl font-bold text-emerald-400">Ready</p>
                      <p className="text-xs text-zinc-500 mt-1">Status</p>
                    </div>
                  </div>

                  {/* Review Note */}
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="size-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-300">Ready to publish!</p>
                        <p className="text-xs text-indigo-400/70 mt-1">
                          {t('create_listing.review_note')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons - Enhanced */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800/50">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="gap-2 h-12 px-6 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white hover:border-zinc-600 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="size-4" />
                  {t('common.previous')}
                </Button>

                <div className="flex items-center gap-2">
                  {/* Step Indicator Dots */}
                  <div className="hidden sm:flex items-center gap-1.5 mr-4">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`size-2 rounded-full transition-all duration-300 ${
                          i === currentStepIndex
                            ? 'bg-emerald-400 w-6'
                            : i < currentStepIndex
                            ? 'bg-emerald-400/50'
                            : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStepIndex === steps.length - 2 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="gap-2 h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <Eye className="size-4" />
                      {t('create_listing.review')}
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : currentStepIndex === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !canProceed()}
                      className="gap-2 h-12 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('common.submitting')}
                        </>
                      ) : (
                        <>
                          <Zap className="size-4" />
                          {t('create_listing.publish_ad')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="gap-2 h-12 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {t('common.next')}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Your information is secure and will never be shared with third parties.
        </p>
      </div>
    </div>
  );
}
