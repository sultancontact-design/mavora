'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, ThumbsUp, Verified } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* ── Testimonials Data ── */
const TESTIMONIALS_DATA = [
  {
    id: 1,
    name: 'أحمد بنعلي',
    nameEn: 'Ahmed Benali',
    location: 'الدار البيضاء، المغرب',
    locationEn: 'Casablanca, Morocco',
    avatar: null,
    initials: 'أب',
    rating: 5,
    date: '2024',
    textAr: 'مافورا غيرت طريقة بيعي للمنتجات تماماً! بعت سيارتي في أقل من أسبوع بسعر ممتاز. المنصة سهلة الاستخدام والدعم فوري.',
    textEn: 'Mavora completely changed the way I sell products! I sold my car in less than a week at an excellent price. The platform is easy to use and support is instant.',
    verified: true,
    likes: 234,
    category: 'vehicles',
  },
  {
    id: 2,
    name: 'فاطمة الزهراء',
    nameEn: 'Fatima Zahra',
    location: 'الرباط، المغرب',
    locationEn: 'Rabat, Morocco',
    avatar: null,
    initials: 'فز',
    rating: 5,
    date: '2024',
    textAr: 'وجدت شقة أحلامي عبر مافورا! التواصل مع المالك كان سهلاً والإجراءات سلسة. أنصح بها كل من يبحث عن عقارات.',
    textEn: 'I found my dream apartment through Mavora! Communication with the owner was easy and the process was smooth. I recommend it to anyone looking for real estate.',
    verified: true,
    likes: 189,
    category: 'real-estate',
  },
  {
    id: 3,
    name: 'كريم المنصوري',
    nameEn: 'Karim Mansouri',
    location: 'مراكش، المغرب',
    locationEn: 'Marrakech, Morocco',
    avatar: null,
    initials: 'كم',
    rating: 5,
    date: '2024',
    textAr: 'كنت أبحث عن هاتف مستعمل وبفضل مافورا وجدت واحدة بحالة ممتازة بسعر مناسب. الأمان في المنصة يعطي ثقة كبيرة.',
    textEn: 'I was looking for a used phone and thanks to Mavora I found one in excellent condition at a reasonable price. The security on the platform gives great confidence.',
    verified: true,
    likes: 156,
    category: 'electronics',
  },
  {
    id: 4,
    name: 'سارة العلوي',
    nameEn: 'Sara Alaoui',
    location: 'فاس، المغرب',
    locationEn: 'Fes, Morocco',
    avatar: null,
    initials: 'سع',
    rating: 4,
    date: '2024',
    textAr: 'منصة رائعة للأعمال الحرة! نشرت خدماتي وبدأت أتلقي طلبات من اليوم الأول. واجهة عصرية وسهلة جداً.',
    textEn: 'Amazing platform for freelancers! I posted my services and started receiving requests from day one. Modern interface and very easy to use.',
    verified: false,
    likes: 98,
    category: 'services',
  },
  {
    id: 5,
    name: 'يوسف الحسني',
    nameEn: 'Youssef Hassani',
    location: 'طنجة، المغرب',
    locationEn: 'Tangier, Morocco',
    avatar: null,
    initials: 'يح',
    rating: 5,
    date: '2024',
    textAr: 'أفضل سوق إلكتروني في المغرب بلا منازع! بعت الكثير من الأشياء غير المستخدمة وكسبت مالاً إضافياً. شكراً مافورا!',
    textEn: 'The best online marketplace in Morocco without a doubt! I sold many unused items and earned extra money. Thank you Mavora!',
    verified: true,
    likes: 312,
    category: 'general',
  },
  {
    id: 6,
    name: 'نادية رشيد',
    nameEn: 'Nadia Rachid',
    location: 'أغادير، المغرب',
    locationEn: 'Agadir, Morocco',
    avatar: null,
    initials: 'نر',
    rating: 5,
    date: '2024',
    textAr: 'كنت مترددة في البداية لكن التجربة كانت رائعة! اشتريت أثاث بتصميم عصري بسعر أقل من المحلات. منصة موثوقة 100%.',
    textEn: 'I was hesitant at first but the experience was amazing! I bought modern design furniture at a lower price than stores. 100% reliable platform.',
    verified: true,
    likes: 145,
    category: 'fashion',
  },
];

/* ── Star Rating Component ── */
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating 
              ? 'fill-gold text-gold' 
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Testimonial Card Component ── */
interface TestimonialCardProps {
  testimonial: typeof TESTIMONIALS_DATA[0];
  isActive: boolean;
  isRtl: boolean;
  locale: string;
}

function TestimonialCard({ testimonial, isActive, isRtl, locale }: TestimonialCardProps) {
  const text = locale === 'ar' ? testimonial.textAr : testimonial.textEn;
  const name = locale === 'ar' ? testimonial.name : testimonial.nameEn;
  const location = locale === 'ar' ? testimonial.location : testimonial.locationEn;

  return (
    <div
      className={`
        flex-shrink-0 w-full transition-all duration-700 ease-out
        ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0'}
      `}
    >
      <div className="relative bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border/50 h-full">
        
        {/* Quote Icon */}
        <div className="absolute top-6 end-6 opacity-10">
          <Quote className="w-16 h-16 text-primary" />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Rating & Date */}
          <div className="flex items-center justify-between mb-6">
            <StarRating rating={testimonial.rating} />
            <span className="text-sm text-muted-foreground">{testimonial.date}</span>
          </div>

          {/* Review Text */}
          <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8 min-h-[120px]">
            "{text}"
          </p>

          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarImage src={testimonial.avatar || undefined} alt={name} />
                <AvatarFallback className={`bg-gradient-to-br from-primary to-violet text-white font-bold text-lg`}>
                  {testimonial.initials}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground">{name}</h4>
                  {testimonial.verified && (
                    <Verified className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
            </div>

            {/* Likes */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">{testimonial.likes}</span>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Accent */}
        <div className="absolute bottom-0 start-0 h-1 w-full bg-gradient-to-r from-primary via-violet to-gold rounded-b-3xl" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
    MAIN TESTIMONIALS COMPONENT
   ════════════════════════════════════════════════════════════════════ */

interface TestimonialsProps {
  variant?: 'default' | 'compact' | 'minimal';
}

export default function Testimonials({ variant = 'default' }: TestimonialsProps) {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => setIsAutoPlaying(false), []);
  const handleMouseLeave = useCallback(() => setIsAutoPlaying(true), []);

  // Navigation
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Calculate average rating
  const averageRating = TESTIMONIALS_DATA.reduce((acc, t) => acc + t.rating, 0) / TESTIMONIALS_DATA.length;

  if (variant === 'compact') {
    return (
      <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Left - Stats */}
            <div className="md:w-1/3 text-center md:text-start">
              <div className="text-5xl font-bold text-foreground mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} size="md" />
              <p className="mt-2 text-muted-foreground">
                {locale === 'ar' ? 'بناءً على آلاف التقييمات' : locale === 'fr' ? "Basé sur des milliers d'avis" : 'Based on thousands of reviews'}
              </p>
            </div>

            {/* Right - Mini Carousel */}
            <div className="flex-1 max-w-2xl overflow-hidden">
              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <TestimonialCard
                  testimonial={TESTIMONIALS_DATA[currentIndex]}
                  isActive={true}
                  isRtl={isRtl}
                  locale={locale}
                />
                
                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-2">
                    {TESTIMONIALS_DATA.slice(0, 5).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={goToPrev}
                      className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors"
                      aria-label="Previous"
                    >
                      <ChevronRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                    </button>
                    <button
                      onClick={goToNext}
                      className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors"
                      aria-label="Next"
                    >
                      <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default / Full Featured Variant
  return (
    <section dir={isRtl ? 'rtl' : 'ltr'} className="py-20 sm:py-28 relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 start-1/4 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 end-1/4 w-72 h-72 bg-violet/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ═════════════════════ HEADER ═════════════════════ */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-current" />
            {locale === 'ar' ? 'آراء المستخدمين' : locale === 'fr' ? 'Avis des utilisateurs' : 'User Reviews'}
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {locale === 'ar' 
              ? 'ماذا يقول عملاؤنا عنا؟'
              : locale === 'fr'
                ? 'Que disent nos clients de nous ?'
                : 'What Our Customers Say About Us?'
            }
          </h2>

          {/* Overall Rating */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold to-orange-400 bg-clip-text text-transparent">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} size="md" />
            </div>
            <div className="h-12 w-px bg-border hidden md:block" />
            <p className="text-muted-foreground text-left max-w-xs">
              {locale === 'ar'
                ? 'تقييمات حقيقية من مستخدمين حقيقيين في جميع أنحاء المغرب'
                : locale === 'fr'
                  ? 'Avis réels de vrais utilisateurs à travers le Maroc'
                  : 'Real reviews from real users across Morocco'
              }
            </p>
          </div>
        </div>

        {/* ═════════════════════ CAROUSEL ═════════════════════ */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Main Card Container */}
          <div className="relative min-h-[320px] md:min-h-[280px]">
            {TESTIMONIALS_DATA.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                isActive={index === currentIndex}
                isRtl={isRtl}
                locale={locale}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'start-0 -ms-4' : 'end-0 -me-4'} w-12 h-12 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted hover:scale-110 transition-all duration-300 hidden md:flex`}
            aria-label="Previous testimonial"
          >
            <ChevronRight className={`w-5 h-5 ${isRtl ? '' : 'rotate-180'}`} />
          </button>
          <button
            onClick={goToNext}
            className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'end-0 -me-4' : 'start-0 -ms-4'} w-12 h-12 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted hover:scale-110 transition-all duration-300 hidden md:flex`}
            aria-label="Next testimonial"
          >
            <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ═════════════════════ DOTS NAVIGATION ═════════════════════ */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS_DATA.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-gradient-to-r from-primary to-violet' 
                  : 'w-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* ═════════════════════ TRUST INDICATOR ═════════════════════ */}
        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Verified className="w-4 h-4 text-emerald" />
            {locale === 'ar' 
              ? 'جميع التقييمات تم التحقق منها من مستخدمين حقيقيين'
              : locale === 'fr'
                ? 'Tous les avis sont vérifiés par de vrais utilisateurs'
                : 'All reviews are verified from real users'
            }
          </p>
        </div>
      </div>
    </section>
  );
}

export { TESTIMONIALS_DATA, StarRating };
