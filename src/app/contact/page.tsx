'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

export default function ContactPage() {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isRtl = locale === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: locale === 'ar' ? 'البريد الإلكتروني' : locale === 'fr' ? 'E-mail' : 'Email',
      value: 'support@mavora.ma',
      href: 'mailto:support@mavora.ma',
      description: locale === 'ar' ? 'نرد خلال 24 ساعة' : locale === 'fr' ? 'Réponse sous 24h' : 'Response within 24 hours',
      color: 'teal'
    },
    {
      icon: Phone,
      title: locale === 'ar' ? 'الهاتف' : locale === 'fr' ? 'Téléphone' : 'Phone',
      value: '+212 5 00 00 00 00',
      href: 'tel:+212500000000',
      description: locale === 'ar' ? 'الإثنين - الجمعة، 9 ص - 6 م' : locale === 'fr' ? 'Lun-Ven, 9h-18h' : 'Mon-Fri, 9AM-6PM',
      color: 'violet'
    },
    {
      icon: MapPin,
      title: locale === 'ar' ? 'العنوان' : locale === 'fr' ? 'Adresse' : 'Address',
      value: locale === 'ar' ? 'الدار البيضاء، المغرب' : locale === 'fr' ? 'Casablanca, Maroc' : 'Casablanca, Morocco',
      href: '#',
      description: locale === 'ar' ? 'المركز التجاري أنفابلاس' : locale === 'fr' ? 'Centre commercial Anfaplace' : 'Anfaplace Shopping Center',
      color: 'rose'
    },
    {
      icon: Clock,
      title: locale === 'ar' ? 'ساعات العمل' : locale === 'fr' ? "Heures d'ouverture" : 'Working Hours',
      value: locale === 'ar' ? '24/7 للدعم الفني' : locale === 'fr' ? '24/7 pour le support technique' : '24/7 for tech support',
      href: '#',
      description: locale === 'ar' ? 'فريق الدعم متاح دائماً' : locale === 'fr' ? 'L\'équipe est toujours disponible' : 'Support team always available',
      color: 'amber'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              {locale === 'ar' ? 'تواصل معنا' : locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-pink-100">
              {locale === 'ar'
                ? 'نسعد بتواصلك معنا! سواء كان لديك سؤال أو اقتراع أو شكوى، نحن هنا لمساعدتك.'
                : locale === 'fr'
                  ? 'Nous sommes ravis de vous entendre ! Que vous ayez une question, une suggestion ou une réclamation, nous sommes là pour vous aider.'
                  : 'We\'d love to hear from you! Whether you have a question, suggestion, or complaint, we\'re here to help.'}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 start-0 end-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-white p-8 shadow-lg border border-gray-100">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare className="size-6 text-rose-500" />
                {locale === 'ar' ? 'أرسل لنا رسالة' : locale === 'fr' ? 'Envoyez-nous un message' : 'Send us a message'}
              </h2>

              {isSubmitted && (
                <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                  <CheckCircle className="size-5 text-green-600 shrink-0" />
                  <p className="text-green-700">
                    {locale === 'ar'
                      ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.'
                      : locale === 'fr'
                        ? 'Votre message a été envoyé avec succès ! Nous vous contacterons bientôt.'
                        : 'Your message has been sent successfully! We\'ll contact you soon.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {locale === 'ar' ? 'الاسم الكامل' : locale === 'fr' ? 'Nom complet' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      placeholder={locale === 'ar' ? 'أدخل اسمك' : locale === 'fr' ? 'Entrez votre nom' : 'Enter your name'}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      {locale === 'ar' ? 'البريد الإلكتروني' : locale === 'fr' ? 'E-mail' : 'Email'} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : locale === 'fr' ? 'Entrez votre e-mail' : 'Enter your email'}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {locale === 'ar' ? 'الموضوع' : locale === 'fr' ? 'Sujet' : 'Subject'} *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">{locale === 'ar' ? 'اختر الموضوع' : locale === 'fr' ? 'Choisir le sujet' : 'Select subject'}</option>
                    <option value="general">{locale === 'ar' ? 'استعلام عام' : locale === 'fr' ? 'Demande générale' : 'General inquiry'}</option>
                    <option value="support">{locale === 'ar' ? 'دعم فني' : locale === 'fr' ? 'Support technique' : 'Technical support'}</option>
                    <option value="billing">{locale === 'ar' ? 'استفسار دفع' : locale === 'fr' ? 'Question de paiement' : 'Billing question'}</option>
                    <option value="report">{locale === 'ar' ? 'إبلاغ عن مشكلة' : locale === 'fr' ? 'Signaler un problème' : 'Report an issue'}</option>
                    <option value="partnership">{locale === 'ar' ? 'شراكة' : locale === 'fr' ? 'Partenariat' : 'Partnership'}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {locale === 'ar' ? 'الرسالة' : locale === 'fr' ? 'Message' : 'Message'} *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : locale === 'fr' ? 'Écrivez votre message ici...' : 'Write your message here...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:from-rose-600 hover:to-pink-600 disabled:opacity-70 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {locale === 'ar' ? 'جاري الإرسال...' : locale === 'fr' ? 'Envoi en cours...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="size-5" />
                      {locale === 'ar' ? 'إرسال الرسالة' : locale === 'fr' ? 'Envoyer le message' : 'Send Message'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <a
                  key={index}
                  href={info.href}
                  className="group block rounded-2xl border border-gray-200 bg-white p-6 hover:border-rose-300 hover:shadow-lg transition-all"
                >
                  <div className={`mb-3 flex size-12 items-center justify-center rounded-xl bg-${info.color}-100 text-${info.color}-600 group-hover:scale-110 transition-transform`}>
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-bold text-gray-900">{info.title}</h3>
                  <p className="mt-1 font-medium text-gray-700">{info.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{info.description}</p>
                </a>
              );
            })}

            {/* Social Media */}
            <div className="rounded-2xl bg-gray-900 p-6 text-white">
              <h3 className="mb-4 font-bold">
                {locale === 'ar' ? 'تابعنا' : locale === 'fr' ? 'Suivez-nous' : 'Follow Us'}
              </h3>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Social, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-rose-500 transition-colors"
                  >
                    <Social className="size-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
