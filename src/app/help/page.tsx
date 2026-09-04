'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import {
  Search,
  ChevronDown,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  BookOpen,
  Shield,
  CreditCard,
  Package,
  User,
  AlertCircle
} from 'lucide-react';

export default function HelpPage() {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isRtl = locale === 'ar';

  const faqItems = [
    {
      question: locale === 'ar' ? 'كيف أنشئ حساباً جديدًا؟' : locale === 'fr' ? 'Comment créer un nouveau compte ?' : 'How do I create a new account?',
      answer: locale === 'ar'
        ? 'انقر على زر "تسجيل" في أعلى الصفحة، ثم أدخل بريدك الإلكتروني وكلمة المرور والمعلومات المطلوبة. ست رسالة تأكيد إلى بريدك الإلكتروني لتفعيل الحساب.'
        : locale === 'fr'
          ? 'Cliquez sur le bouton "S\'inscrire" en haut de la page, puis entrez votre e-mail, mot de passe et les informations requises. Vous recevrez un e-mail de confirmation pour activer votre compte.'
          : 'Click the "Sign Up" button at the top of the page, then enter your email, password, and required information. You will receive a confirmation email to activate your account.',
      icon: User
    },
    {
      question: locale === 'ar' ? 'كيف أنشر إعلاناً جديداً؟' : locale === 'fr' ? 'Comment publier une nouvelle annonce ?' : 'How do I post a new listing?',
      answer: locale === 'ar'
        ? 'بعد تسجيل الدخول، انقر على زر "نشر إعلان". اختر القسم المناسب، وأضف الصور والوصف والسعر، ثم انقر "نشر". سيتم مراجعة إعلانك قبل ظهوره للجمهور.'
        : locale === 'fr'
          ? 'Après connexion, cliquez sur le bouton "Publier une annonce". Choisissez la catégorie appropriée, ajoutez photos, description et prix, puis cliquez sur "Publier". Votre annonce sera examinée avant d\'être visible publiquement.'
          : 'After logging in, click the "Post Ad" button. Choose the appropriate category, add photos, description and price, then click "Post". Your listing will be reviewed before being publicly visible.',
      icon: Package
    },
    {
      question: locale === 'ar' ? 'كيف أتواصل مع البائع؟' : locale === 'fr' ? 'Comment contacter le vendeur ?' : 'How do I contact the seller?',
      answer: locale === 'ar'
        ? 'يمكنك التواصل مع البائع عبر نظام الرسائل الداخلي في المنصة. انقر على زر "رسالة" في صفحة الإعلان. ننصح بعدم مشاركة معلومات شخصية خارج المنصة.'
        : locale === 'fr'
          ? 'Vous pouvez contacter le vendeur via le système de messagerie interne de la plateforme. Cliquez sur le bouton "Message" sur la page de l\'annonce. Nous vous déconseillons de partager des informations personnelles en dehors de la plateforme.'
          : 'You can contact the seller through the platform\'s internal messaging system. Click the "Message" button on the listing page. We advise against sharing personal information outside the platform.',
      icon: MessageCircle
    },
    {
      question: locale === 'ar' ? 'هل مافورا آمنة للاستخدام؟' : locale === 'fr' ? 'MAVORA est-elle sûre à utiliser ?' : 'Is MAVORA safe to use?',
      answer: locale === 'ar'
        ? 'نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتنا. لدينا فريق moderation يراجع الإبلاغات ويحظر الحسابات المخالفة. ومع ذلك، ننصح دما بالحذر عند التعامل مع مستخدمين جدد.'
        : locale === 'fr'
          ? 'Oui, nous utilisons les dernières technologies de chiffrement pour protéger vos données. Nous avons une équipe de modération qui examine les signalements et bloque les comptes violateurs. Cependant, nous vous recommandons d\'être prudent lors de transactions avec de nouveaux utilisateurs.'
          : 'Yes, we use the latest encryption technologies to protect your data. We have a moderation team that reviews reports and blocks violating accounts. However, we advise caution when dealing with new users.',
      icon: Shield
    },
    {
      question: locale === 'ar' ? 'كيف تتم عمليات الدفع؟' : locale === 'fr' ? 'Comment fonctionnent les paiements ?' : 'How do payments work?',
      answer: locale === 'ar'
        ? 'ندعم عدة طرق دفع بما فيها البطاقات البنكية والدفع عند الاستلام والمحافظ الإلكترونية. جميع المعاملات مشفرة وآمنة. لا نحتفظ بمعلومات بطاقتك البنكية.'
        : locale === 'fr'
          ? 'Nous prenons en charge plusieurs méthodes de paiement, y compris les cartes bancaires, le paiement à la livraison et les portefeuilles électroniques. Toutes les transactions sont chiffrées et sécurisées. Nous ne stockons pas les informations de votre carte bancaire.'
          : 'We support multiple payment methods including credit cards, cash on delivery, and digital wallets. All transactions are encrypted and secure. We do not store your credit card information.',
      icon: CreditCard
    },
    {
      question: locale === 'ar' ? 'ماذا أفعل إذا واجهت مشكلة؟' : locale === 'fr' ? 'Que faire si je rencontre un problème ?' : 'What if I encounter a problem?',
      answer: locale === 'ar'
        ? 'يمكنك الإبلاغ عن المشكلة عبر نموذج الاتصال بنا أو إرسال بريد إلكتروني إلى support@mavora.ma. فريق الدعم لدينا سيتواصل معك خلال 24 ساعة عمل.'
        : locale === 'fr'
          ? 'Vous pouvez signaler le problème via notre formulaire de contact ou envoyer un e-mail à support@mavora.ma. Notre équipe de support vous contactera dans les 24 heures ouvrables.'
          : 'You can report the problem through our contact form or send an email to support@mavora.ma. Our support team will contact you within 24 business hours.',
      icon: AlertCircle
    },
  ];

  const helpCategories = [
    { 
      icon: User, 
      name: locale === 'ar' ? 'الحساب' : locale === 'fr' ? 'Compte' : 'Account', 
      count: 12,
      color: 'teal'
    },
    { 
      icon: Package, 
      name: locale === 'ar' ? 'الإعلانات' : locale === 'fr' ? 'Annonces' : 'Listings', 
      count: 18,
      color: 'violet'
    },
    { 
      icon: CreditCard, 
      name: locale === 'ar' ? 'المدفوعات' : locale === 'fr' ? 'Paiements' : 'Payments', 
      count: 8,
      color: 'amber'
    },
    { 
      icon: Shield, 
      name: locale === 'ar' ? 'الأمان' : locale === 'fr' ? 'Sécurité' : 'Security', 
      count: 10,
      color: 'rose'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-cyan-600 via-blue-500 to-indigo-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              {locale === 'ar' ? 'مركز المساعدة' : locale === 'fr' ? 'Centre d\'aide' : 'Help Center'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-blue-100">
              {locale === 'ar'
                ? 'كيف يمكننا مساعدتك اليوم؟ ابحث عن إجابات أو تواصل مع فريق الدعم'
                : locale === 'fr'
                  ? 'Comment pouvons-nous vous aider aujourd\'hui ? Cherchez des réponses ou contactez notre équipe de support'
                  : 'How can we help you today? Find answers or contact our support team'}
            </p>
            
            {/* Search */}
            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'ابحث عن سؤال...' : locale === 'fr' ? 'Rechercher une question...' : 'Search for a question...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white/90 py-4 pe-4 ps-12 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
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
        {/* Help Categories */}
        <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {helpCategories.map((cat, index) => (
            <button
              key={index}
              className="group rounded-2xl border border-gray-200 bg-white p-6 text-start hover:border-blue-300 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-${cat.color}-100 text-${cat.color}-600 group-hover:scale-110 transition-transform`}>
                <cat.icon className="size-6" />
              </div>
              <h3 className="font-bold text-gray-900">{cat.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {cat.count} {locale === 'ar' ? 'مقال' : locale === 'fr' ? 'articles' : 'articles'}
              </p>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {locale === 'ar' ? 'الأسئلة الشائعة' : locale === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
            </h2>
            <p className="mt-2 text-gray-600">
              {locale === 'ar' ? 'إجابات على الأسئلة الأكثر شيوعاً' : locale === 'fr' ? 'Réponses aux questions les plus courantes' : 'Answers to the most common questions'}
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const Icon = item.icon;
              const isOpen = openFaq === index;
              
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center gap-4 p-5 text-start"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Icon className="size-5" />
                    </div>
                    <span className="flex-1 font-semibold text-gray-900">{item.question}</span>
                    <ChevronDown className={`size-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 ps-19">
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold">
                {locale === 'ar' ? 'لم تجد إجابتك؟' : locale === 'fr' ? 'Pas trouvé votre réponse ?' : 'Didn\'t find your answer?'}
              </h2>
              <p className="mt-4 text-gray-300">
                {locale === 'ar'
                  ? 'فريق الدعم لدينا جاهز لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت ممكن.'
                  : locale === 'fr'
                    ? 'Notre équipe de support est prête à vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.'
                    : 'Our support team is ready to help. Contact us and we\'ll get back to you as soon as possible.'}
              </p>
              <div className="mt-6 space-y-3">
                <a href="/contact" className="flex items-center gap-3 text-teal-400 hover:text-teal-300 transition-colors">
                  <Mail className="size-5" /> support@mavora.ma
                </a>
                <a href="tel:+212500000000" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <Phone className="size-5" /> +212 5 00 00 00 00
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-teal-600 transition-colors"
              >
                <MessageCircle className="size-5" />
                {locale === 'ar' ? 'تواصل مع الدعم' : locale === 'fr' ? 'Contacter le support' : 'Contact Support'}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
