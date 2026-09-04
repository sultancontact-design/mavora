#!/usr/bin/env node
/**
 * Fix missing translation keys in all language files
 */
const fs = require('fs');
const path = require('path');

// Load all translation files
const ar = require('/home/z/my-project/src/i18n/ar.json');
const en = require('/home/z/my-project/src/i18n/en.json');
const fr = require('/home/z/my-project/src/i18n/fr.json');

// Load missing keys
const missing = JSON.parse(fs.readFileSync('/tmp/missing_keys.json', 'utf8'));

// Translation mappings for missing keys
const translations = {
  // Auth
  'auth.accept_terms': { ar: 'أوافق على الشروط', en: 'Accept terms', fr: 'Accepter les conditions' },
  'auth.agree_to_terms': { ar: 'أوافق على', en: 'Agree to', fr: "J'accepte" },
  'auth.already_have_account': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?', fr: 'Vous avez déjà un compte ?' },
  'auth.and': { ar: 'و', en: 'and', fr: 'et' },
  'auth.create_account': { ar: 'إنشاء حساب', en: 'Create account', fr: 'Créer un compte' },
  'auth.fill_all_fields': { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields', fr: 'Veuillez remplir tous les champs requis' },
  'auth.join_mavora': { ar: 'انضم إلى مافورا', en: 'Join Mavora', fr: 'Rejoindre Mavora' },
  'auth.login_failed': { ar: 'فشل تسجيل الدخول', en: 'Login failed', fr: 'Échec de la connexion' },
  'auth.login_to_account': { ar: 'تسجيل الدخول إلى حسابك', en: 'Login to your account', fr: 'Connectez-vous à votre compte' },
  'auth.or_continue_with': { ar: 'أو المتابعة مع', en: 'Or continue with', fr: 'Ou continuer avec' },
  'auth.password_requirements': { ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل', en: 'Password must be at least 8 characters', fr: 'Le mot de passe doit contenir au moins 8 caractères' },
  'auth.password_too_short': { ar: 'كلمة المرور قصيرة جداً', en: 'Password too short', fr: 'Mot de passe trop court' },
  'auth.passwords_not_match': { ar: 'كلمات المرور غير متطابقة', en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
  'auth.privacy_policy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  'auth.reset_email_sent': { ar: 'تم إرسال بريد إعادة التعيين', en: 'Reset email sent', fr: 'Email de réinitialisation envoyé' },
  'auth.reset_password_subtitle': { ar: 'أدخل بريدك الإلكتروني وسنرسل رابط إعادة التعيين', en: 'Enter your email and we\'ll send you a reset link', fr: 'Entrez votre email et nous vous enverrons un lien de réinitialisation' },
  'auth.signup_failed': { ar: 'فشل إنشاء الحساب', en: 'Signup failed', fr: 'Échec de l\'inscription' },
  'auth.terms_of_service': { ar: 'شروط الاستخدام', en: 'Terms of Service', fr: 'Conditions d\'utilisation' },
  'auth.too_many_attempts': { ar: 'محاولات كثيرة جداً، حاول لاحقاً', en: 'Too many attempts, please try later', fr: 'Trop de tentatives, veuillez réessayer plus tard' },
  
  // Placeholders
  'bio_placeholder': { ar: 'أخبرنا عن نفسك...', en: 'Tell us about yourself...', fr: 'Parlez-nous de vous...' },
  
  // Categories
  'categories.all_categories': { ar: 'جميع التصنيفات', en: 'All Categories', fr: 'Toutes les catégories' },
  'categories.home_garden': { ar: 'المنزل والحديقة', en: 'Home & Garden', fr: 'Maison & Jardin' },
  'categories.other': { ar: 'أخرى', en: 'Other', fr: 'Autre' },
  
  // IDs
  'category_id': { ar: 'معرف التصنيف', en: 'Category ID', fr: 'ID Catégorie' },
  'city_id': { ar: 'معرف المدينة', en: 'City ID', fr: 'ID Ville' },
  'country_id': { ar: 'معرف الدولة', en: 'Country ID', fr: 'ID Pays' },
  
  // Common
  'common.load_more': { ar: 'تحميل المزيد', en: 'Load More', fr: 'Charger plus' },
  'common.submitting': { ar: 'جاري الإرسال...', en: 'Submitting...', fr: 'Envoi en cours...' },
  'common.view': { ar: 'عرض', en: 'View', fr: 'Voir' },
  
  // Conditions
  'condition.excellent': { ar: 'ممتاز', en: 'Excellent', fr: 'Excellent' },
  'condition.fair': { ar: 'مقبول', en: 'Fair', fr: 'Acceptable' },
  'condition.good': { ar: 'جيد', en: 'Good', fr: 'Bon' },
  'condition.like_new': { ar: 'مثل جديد', en: 'Like New', fr: 'Comme neuf' },
  'condition.new': { ar: 'جديد', en: 'New', fr: 'Neuf' },
  
  // Create Listing
  'create_listing.category': { ar: 'التصنيف', en: 'Category', fr: 'Catégorie' },
  'create_listing.choose_category': { ar: 'اختر تصنيفاً', en: 'Choose a category', fr: 'Choisir une catégorie' },
  'create_listing.city': { ar: 'المدينة', en: 'City', fr: 'Ville' },
  'create_listing.condition': { ar: 'الحالة', en: 'Condition', fr: 'État' },
  'create_listing.currency': { ar: 'العملة', en: 'Currency', fr: 'Devise' },
  'create_listing.description': { ar: 'الوصف', en: 'Description', fr: 'Description' },
  'create_listing.details': { ar: 'التفاصيل', en: 'Details', fr: 'Détails' },
  'create_listing.enter_details': { ar: 'أدخل تفاصيل إعلانك', en: 'Enter your listing details', fr: 'Entrez les détails de votre annonce' },
  'create_listing.follow_steps': { ar: 'اتبع الخطوات التالية', en: 'Follow these steps', fr: 'Suivez ces étapes' },
  'create_listing.free': { ar: 'مجاني', en: 'Free', fr: 'Gratuit' },
  'create_listing.image_guidelines': { ar: 'إرشادات الصور', en: 'Image Guidelines', fr: "Directives d'image" },
  'create_listing.images_preview': { ar: 'معاينة الصور', en: 'Images Preview', fr: 'Aperçu des images' },
  'create_listing.listing_preview': { ar: 'معاينة الإعلان', en: 'Listing Preview', fr: 'Aperçu de l\'annonce' },
  'create_listing.location': { ar: 'الموقع', en: 'Location', fr: 'Emplacement' },
  'create_listing.no_description': { ar: 'لم يتم إدخال وصف', en: 'No description entered', fr: 'Aucune description saisie' },
  'create_listing.no_images': { ar: 'لم يتم رفع صور', en: 'No images uploaded', fr: 'Aucune image téléchargée' },
  'create_listing.no_location': { ar: 'لم يتم تحديد الموقع', en: 'No location selected', fr: 'Aucun emplacement sélectionné' },
  'create_listing.no_title': { ar: 'لم يتم إدخال عنوان', en: 'No title entered', fr: 'Aucun titre saisi' },
  'create_listing.photos': { ar: 'الصور', en: 'Photos', fr: 'Photos' },
  'create_listing.post_ad': { ar: 'نشر الإعلان', en: 'Post Ad', fr: 'Publier l\'annonce' },
  'create_listing.preview': { ar: 'معاينة', en: 'Preview', fr: 'Aperçu' },
  'create_listing.price': { ar: 'السعر', en: 'Price', fr: 'Prix' },
  'create_listing.publish_ad': { ar: 'نشر الإعلان الآن', en: 'Publish Ad Now', fr: 'Publier l\'annonce maintenant' },
  'create_listing.review': { ar: 'مراجعة', en: 'Review', fr: 'Révision' },
  'create_listing.review_listing': { ar: 'مراجعة الإعلان', en: 'Review Listing', fr: 'Réviser l\'annonce' },
  'create_listing.review_note': { ar: 'راجع معلومات إعلانك قبل النشر', en: 'Review your listing information before publishing', fr: 'Révisez les informations de votre annonce avant publication' },
  'create_listing.select_category': { ar: 'اختر تصنيفاً لإعلانك', en: 'Select a category for your listing', fr: 'Sélectionnez une catégorie pour votre annonce' },
  'create_listing.set_price': { ar: 'حدد السعر', en: 'Set Price', fr: 'Définir le prix' },
  'create_listing.specify_location': { ar: 'حدد الموقع', en: 'Specify Location', fr: 'Spécifier l\'emplacement' },
  'create_listing.title': { ar: 'العنوان', en: 'Title', fr: 'Titre' },
  'create_listing.upload_images': { ar: 'رفع صور', en: 'Upload Images', fr: 'Télécharger des images' },
  'create_listing.upload_photos': { ar: 'رفع صور', en: 'Upload Photos', fr: 'Télécharger des photos' },
  
  // Favorites
  'favorites.browse_listings': { ar: 'تصفح الإعلانات', en: 'Browse Listings', fr: 'Parcourir les annonces' },
  'favorites.items_saved': { ar: 'عنصر محفوظ', en: 'item saved', fr: 'élément sauvegardé' },
  'favorites.no_favorites_yet': { ar: 'لا توجد مفضلة بعد', en: 'No favorites yet', fr: 'Pas encore de favoris' },
  'favorites.saved_items': { ar: 'العناصر المحفوظة', en: 'Saved Items', fr: 'Éléments sauvegardés' },
  'favorites.start_saving': { ar: 'ابدأ بالحفظ', en: 'Start saving', fr: 'Commencer à sauvegarder' },
  
  // Listings
  'listings.browse_listings': { ar: 'تصفح الإعلانات', en: 'Browse Listings', fr: 'Parcourir les annonces' },
  'listings.clear_filters': { ar: 'مسح الفلاتر', en: 'Clear Filters', fr: 'Effacer les filtres' },
  'listings.listings_found': { ar: 'إعلان موجود', en: 'listing found', fr: 'annonce trouvée' },
  'listings.no_results': { ar: 'لا توجد نتائج', en: 'No results found', fr: 'Aucun résultat trouvé' },
  'listings.try_different_search': { ar: 'جرب بحثاً مختلفاً', en: 'Try a different search', fr: 'Essayez une recherche différente' },
  
  // Price
  'max_price': { ar: 'السعر الأقصى', en: 'Max Price', fr: 'Prix Max' },
  
  // Messages
  'messages.choose_chat': { ar: 'اختر محادثة', en: 'Choose a chat', fr: 'Choisir une discussion' },
  'messages.confirm_leave': { ar: 'تأكيد المغادرة', en: 'Confirm Leave', fr: 'Confirmer le départ' },
  'messages.conversation_left': { ar: 'تمت مغادرة المحادثة', en: 'Conversation left', fr: 'Discussion quittée' },
  'messages.conversations': { ar: 'المحادثات', en: 'Conversations', fr: 'Discussions' },
  'messages.description': { ar: 'الوصف', en: 'Description', fr: 'Description' },
  'messages.leave_conversation': { ar: 'مغادرة المحادثة', en: 'Leave Conversation', fr: 'Quitter la discussion' },
  'messages.leave_description': { ar: 'هل أنت متأكد من أنك تريد مغادرة هذه المحادثة؟', en: 'Are you sure you want to leave this conversation?', fr: 'Êtes-vous sûr de vouloir quitter cette discussion ?' },
  'messages.leave_title': { ar: 'مغادرة المحادثة', en: 'Leave Conversation', fr: 'Quitter la discussion' },
  'messages.mark_read': { ar: 'تحديد كمقروء', en: 'Mark as Read', fr: 'Marquer comme lu' },
  'messages.no_messages': { ar: 'لا توجد رسائل', en: 'No messages', fr: 'Aucun message' },
  'messages.no_results': { ar: 'لا توجد نتائج', en: 'No results', fr: 'Aucun résultat' },
  'messages.not_found': { ar: 'غير موجودة', en: 'Not Found', fr: 'Non trouvé' },
  'messages.reason': { ar: 'السبب', en: 'Reason', fr: 'Raison' },
  'messages.reason_harassment': { ar: 'مضايقة', en: 'Harassment', fr: 'Harcèlement' },
  'messages.reason_inappropriate': { ar: 'محتوى غير لائق', en: 'Inappropriate content', fr: 'Contenu inapproprié' },
  'messages.reason_other': { ar: 'سبب آخر', en: 'Other reason', fr: 'Autre raison' },
  'messages.reason_scam': { ar: 'احتيال', en: 'Scam', fr: 'Arnaque' },
  'messages.reason_spam': { ar: 'رسائل مزعجة', en: 'Spam', fr: 'Spam' },
  'messages.report': { ar: 'إبلاغ', en: 'Report', fr: 'Signaler' },
  'messages.report_description': { ar: 'صف المشكلة', en: 'Describe the issue', fr: 'Décrivez le problème' },
  'messages.report_sent': { ar: 'تم إرسال البلاغ', en: 'Report sent', fr: 'Signalement envoyé' },
  'messages.report_title': { ar: 'إبلاغ عن محادثة', en: 'Report conversation', fr: 'Signaler une discussion' },
  'messages.send': { ar: 'إرسال', en: 'Send', fr: 'Envoyer' },
  'messages.send_message': { ar: 'إرسال رسالة', en: 'Send Message', fr: 'Envoyer un message' },
  'messages.start_new_chat': { ar: 'بدء محادثة جديدة', en: 'Start new chat', fr: 'Démarrer une nouvelle discussion' },
  'messages.type_message': { ar: 'اكتب رسالتك...', en: 'Type a message...', fr: 'Tapez un message...' },
  'messages.unread_messages': { ar: 'رسائل غير مقروءة', en: 'Unread messages', fr: 'Messages non lus' },
  
  // Single letter
  'a': { ar: '،', en: ',', fr: ',' }
};

// Add missing keys to each language file
function addMissingKeys(obj, lang) {
  let added = 0;
  for (const key of missing) {
    if (!obj[key] && translations[key]) {
      obj[key] = translations[key][lang];
      added++;
    } else if (!obj[key]) {
      // Fallback: use key name as value
      obj[key] = key;
      added++;
    }
  }
  return added;
}

console.log('Adding missing translation keys...\n');

const arAdded = addMissingKeys(ar, 'ar');
const enAdded = addMissingKeys(en, 'en');
const frAdded = addMissingKeys(fr, 'fr');

console.log(`Arabic: ${arAdded} keys added`);
console.log(`English: ${enAdded} keys added`);
console.log(`French: ${frAdded} keys added`);

// Save updated files
fs.writeFileSync('/home/z/my-project/src/i18n/ar.json', JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync('/home/z/my-project/src/i18n/en.json', JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync('/home/z/my-project/src/i18n/fr.json', JSON.stringify(fr, null, 2), 'utf8');

console.log('\n✅ All translation files updated!');
