'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function TermsPage() {
  const { t, locale } = useTranslation();
  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {locale === 'ar' ? 'شروط الاستخدام' : locale === 'fr' ? "Conditions d'utilisation" : 'Terms of Service'}
            </div>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
              {locale === 'ar' ? 'شروط وأحكام الاستخدام' : locale === 'fr' ? "Conditions Générales d'Utilisation" : 'Terms & Conditions'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-amber-100">
              {locale === 'ar'
                ? 'الرجاء قراءة هذه الشروط بعناية قبل استخدام منصة مافورا'
                : locale === 'fr'
                  ? 'Veuillez lire ces conditions attentivement avant d\'utiliser la plateforme MAVORA'
                  : 'Please read these terms carefully before using the MAVORA platform'}
            </p>
            <p className="mt-4 text-sm text-amber-200">
              {locale === 'ar' ? 'آخر تحديث: يناير 2025' : locale === 'fr' ? 'Dernière mise à jour: Janvier 2025' : 'Last updated: January 2025'}
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
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Acceptance of Terms */}
          <div className="mb-10 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-6">
            <h2 className="!mt-0 !text-amber-800 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold">!</span>
              {locale === 'ar' ? 'قبول الشروط' : locale === 'fr' ? 'Acceptation des conditions' : 'Acceptance of Terms'}
            </h2>
            <p className="text-gray-700 mb-0 mt-3">
              {locale === 'ar'
                ? 'باستخدامك لمنصة مافورا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.'
                : locale === 'fr'
                  ? 'En utilisant la plateforme MAVORA, vous acceptez de vous conformer à ces conditions générales. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.'
                  : 'By using the MAVORA platform, you agree to comply with these terms and conditions. If you do not agree to any of these terms, please do not use the platform.'}
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {[
              {
                number: '1',
                title: locale === 'ar' ? 'التعريفات' : locale === 'fr' ? 'Définitions' : 'Definitions',
                content: locale === 'ar'
                  ? '"المنصة" تشير إلى موقع مافو? وإطبيقاته وخدماته. "المستخدم" يشير إلى أي شخص يستخدم المنصة. "الإعلان" يشير إلى أي سلعة أو خدمة معروضة للبيع على المنصة.'
                  : locale === 'fr'
                    ? '« La Plateforme » fait référence au site web MAVORA, ses applications et ses services. « L\'Utilisateur » désigne toute personne utilisant la plateforme. « L\'Annonce » désigne tout bien ou service mis en vente sur la plateforme.'
                    : '"The Platform" refers to the MAVORA website, its applications and services. "User" refers to anyone using the platform. "Listing" refers to any item or service offered for sale on the platform.',
                color: 'amber'
              },
              {
                number: '2',
                title: locale === 'ar' ? 'شروط استخدام المنصة' : locale === 'fr' ? "Conditions d'utilisation de la plateforme" : 'Platform Usage Terms',
                content: locale === 'ar'
                  ? 'يجب أن يكون عمرك 18 عاماً على الأقل لاستخدام المنصة. أنت مسؤول عن الحفاظ على سرية حسابك. يُحظر إنشاء حسابات وهمية أو تقديم معلومات كاذبة. يُمنع استخدام المنصة لأغراض غير قانونية.'
                  : locale === 'fr'
                    ? 'Vous devez avoir au moins 18 ans pour utiliser la plateforme. Vous êtes responsable de maintenir la confidentialité de votre compte. Il est interdit de créer des comptes fictifs ou de fausser des informations. L\'utilisation de la plateforme à des fins illégales est interdite.'
                    : 'You must be at least 18 years old to use the platform. You are responsible for maintaining the confidentiality of your account. Creating fake accounts or providing false information is prohibited. Using the platform for illegal purposes is forbidden.',
                color: 'orange'
              },
              {
                number: '3',
                title: locale === 'ar' ? 'الإعلانات والمبيعات' : locale === 'fr' ? 'Annonces et ventes' : 'Listings and Sales',
                content: locale === 'ar'
                  ? 'أنت المسؤول عن محتوى إعلاناتك. يجب أن تكون جميع السلع والخدمات المعلنة قانونية ومملوكة لك أو مخولة ببيعها. يحق لمنصة مافورا إزالة أي إعلان ينتهك هذه الشروط دون إشعار مسبق.'
                  : locale === 'fr'
                    ? 'Vous êtes responsable du contenu de vos annonces. Tous les biens et services annoncés doivent être légaux et vous appartenir ou être autorisés à être vendus. MAVORA se réserve le droit de supprimer toute annonce violant ces conditions sans préavis.'
                    : 'You are responsible for the content of your listings. All advertised goods and services must be legal and owned by or authorized to be sold by you. MAVORA reserves the right to remove any listing violating these terms without prior notice.',
                color: 'red'
              },
              {
                number: '4',
                title: locale === 'ar' ? 'المدفوعات والرسوم' : locale === 'fr' ? 'Paiements et frais' : 'Payments and Fees',
                content: locale === 'ar'
                  ? 'قد تطبق المنصة رسوماً على بعض الخدمات المميزة. الأسعار معروضة بشكل صريح قبل الشراء. جميع المدفوعات آمنة ومشفرة. يتم استرداد الأموال وفقاً لسياسة الاسترداد المطبقة.'
                  : locale === 'fr'
                    ? 'La plateforme peut appliquer des frais pour certains services premium. Les prix sont affichés clairement avant l\'achat. Tous les paiements sont sécurisés et chiffrés. Les remboursements sont effectués selon la politique de remboursement applicable.'
                    : 'The platform may apply fees for certain premium services. Prices are clearly displayed before purchase. All payments are secure and encrypted. Refunds are made according to the applicable refund policy.',
                color: 'emerald'
              },
              {
                number: '5',
                title: locale === 'ar' ? 'المحتوى المحظور' : locale === 'fr' ? 'Contenu interdit' : 'Prohibited Content',
                content: locale === 'ar'
                  ? 'يُحظر نشر: سلع مسروقة، مستندات مزورة، مواد غير قانونية، محتوى مسيء أو تمييزي، معلومات شخصية للآخرين، برامج ضارة أو روابط خطرة، إعلانات مضللة أو احتيالية.'
                  : locale === 'fr'
                    ? 'Il est interdit de publier : des biens volés, des documents falsifiés, des matériaux illégaux, un contenu abusif ou discriminatoire, des informations personnelles d\'autrui, des logiciels malveillants ou des liens dangereux, des annonces trompeuses ou frauduleuses.'
                    : 'It is prohibited to publish: stolen goods, forged documents, illegal materials, abusive or discriminatory content, others\' personal information, malware or dangerous links, misleading or fraudulent advertisements.',
                color: 'rose'
              },
              {
                number: '6',
                title: locale === 'ar' ? 'المسؤولية المحدودة' : locale === 'fr' ? 'Limitation de responsabilité' : 'Limitation of Liability',
                content: locale === 'ar'
                  ? 'مافورا ليست طرفاً في المعاملات بين المستخدمين. نحن لا نضمن جودة أو سلامة السلع المعلنة. لا نتحمل مسؤولية أي خسائر ناتجة عن استخدام المنصة. الحد الأقصى لمسؤوليتنا هو المبلغ المدفوع خلال آخر 12 شهراً.'
                  : locale === 'fr'
                    ? 'MAVORA n\'est pas partie aux transactions entre les utilisateurs. Nous ne garantissons pas la qualité ou la sécurité des biens annoncés. Nous ne sommes pas responsables des pertes résultant de l\'utilisation de la plateforme. Notre responsabilité maximale est limitée au montant payé au cours des 12 derniers mois.'
                    : 'MAVORA is not a party to transactions between users. We do not guarantee the quality or safety of advertised items. We are not liable for any losses resulting from the use of the platform. Our maximum liability is limited to the amount paid in the last 12 months.',
                color: 'slate'
              },
            ].map((term, index) => (
              <div key={index} className="rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <h2 className={`!text-${term.color}-600 !mt-0 flex items-center gap-3`}>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-${term.color}-100 text-${term.color}-600 font-bold text-lg">{term.number}</span>
                  {term.title}
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">{term.content}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 rounded-2xl bg-gray-900 p-8 text-center text-white">
            <h2 className="!text-white !mt-0 text-2xl">
              {locale === 'ar' ? 'هل لديك أسئلة؟' : locale === 'fr' ? 'Des questions ?' : 'Have Questions?'}
            </h2>
            <p className="mt-3 text-gray-300">
              {locale === 'ar'
                ? 'إذا كان لديك أي استفسارات حول هذه الشروط، تواصل معنا'
                : locale === 'fr'
                  ? 'Si vous avez des questions sur ces conditions, contactez-nous'
                  : 'If you have any questions about these terms, contact us'}
            </p>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              {locale === 'ar' ? 'تواصل معنا' : locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
