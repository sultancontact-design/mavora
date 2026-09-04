#!/usr/bin/env node
/**
 * Fix untranslated i18n keys
 */

const fs = require('fs');
const path = require('path');

// Translations for the 50 missing keys
const translations = {
  ar: {
    "admin.categories_tab": "التصنيفات",
    "messages.report_submitted": "تم إرسال البلاغ بنجاح",
    "messages.select_conversation": "اختر محادثة",
    "messages.select_reason": "اختر السبب",
    "messages.sort_newest": "الأحدث",
    "messages.sort_recent": "الأحدث",
    "messages.sort_unread": "غير المقروءة",
    "messages.start_conversation": "ابدأ محادثة",
    "messages.submit_report": "إرسال بلاغ",
    "messages.unknown_user": "مستخدم غير معروف",
    "min_price": "أقل سعر",
    "profile.activity": "النشاط",
    "profile.location": "الموقع",
    "profile.manage_account": "إدارة الحساب",
    "profile.no_listings_yet": "لا توجد إعلانات بعد",
    "profile.personal_info": "المعلومات الشخصية",
    "profile.received_reviews": "التقييمات المستلمة",
    "profile.saved_items": "العناصر المحفوظة",
    "profile.start_posting": "ابدأ النشر",
    "profile.updated_successfully": "تم تحديث الملف الشخصي بنجاح",
    "q": "بحث",
    "search": "بحث",
    "sort.most_popular": "الأكثر شعبية",
    "sort.newest": "الأحدث",
    "sort.price_high_low": " السعر: من الأعلى للأدنى",
    "sort.price_low_high": "السعر: من الأدنى للأعلى",
    "sort_by": "ترتيب حسب",
    "tokens.description": "اشتري الرموز لإضافة مميزات إلى إعلاناتك",
    "tokens.proceed_to_pay": "متابعة للدفع",
    "tokens.purchase_description": "اختر باقة الرموز التي تناسب احتياجاتك",
    "tokens.purchase_title": "شراء الرموز",
    "tokens.will_be_added": "سيتم إضافة الرموز إلى حسابك فوراً",
    "wallet.all_types": "جميع الأنواع",
    "wallet.amount": "المبلغ",
    "wallet.available": "متاح",
    "wallet.confirm_withdraw": "تأكيد السحب",
    "wallet.credit": "ائتمان",
    "wallet.debit": "خصم",
    "wallet.frozen": "مجمد",
    "wallet.frozen_note": "هذا الرصيد مجمد بسبب نشاط مشبوه",
    "wallet.insufficient_funds": "رصيد غير كافٍ",
    "wallet.invalid_amount": "مبلغ غير صالح",
    "wallet.min_withdrawal": "الحد الأدنى للسحب: 50 درهم",
    "wallet.total_balance": "إجمالي الرصيد",
    "wallet.unfrozen": "غير مجمد",
    "wallet.withdraw": "سحب",
    "wallet.withdraw_description": "أدخل المبلغ الذي تريد سحبه",
    "wallet.withdraw_notice": "سيتم تحويل المبلغ إلى حسابك البنكي خلال 1-3 أيام عمل",
    "wallet.withdraw_title": "سحب الأموال",
    "wallet.withdrawal_requested": "تم طلب السحب بنجاح"
  },
  en: {
    "admin.categories_tab": "Categories",
    "messages.report_submitted": "Report submitted successfully",
    "messages.select_conversation": "Select a conversation",
    "messages.select_reason": "Select a reason",
    "messages.sort_newest": "Newest",
    "messages.sort_recent": "Recent",
    "messages.sort_unread": "Unread",
    "messages.start_conversation": "Start conversation",
    "messages.submit_report": "Submit Report",
    "messages.unknown_user": "Unknown User",
    "min_price": "Min Price",
    "profile.activity": "Activity",
    "profile.location": "Location",
    "profile.manage_account": "Manage Account",
    "profile.no_listings_yet": "No listings yet",
    "profile.personal_info": "Personal Info",
    "profile.received_reviews": "Received Reviews",
    "profile.saved_items": "Saved Items",
    "profile.start_posting": "Start Posting",
    "profile.updated_successfully": "Profile updated successfully",
    "q": "Search",
    "search": "Search",
    "sort.most_popular": "Most Popular",
    "sort.newest": "Newest",
    "sort.price_high_low": "Price: High to Low",
    "sort.price_low_high": "Price: Low to High",
    "sort_by": "Sort by",
    "tokens.description": "Buy tokens to add features to your listings",
    "tokens.proceed_to_pay": "Proceed to Pay",
    "tokens.purchase_description": "Choose the token package that suits your needs",
    "tokens.purchase_title": "Purchase Tokens",
    "tokens.will_be_added": "Tokens will be added to your account instantly",
    "wallet.all_types": "All Types",
    "wallet.amount": "Amount",
    "wallet.available": "Available",
    "wallet.confirm_withdraw": "Confirm Withdrawal",
    "wallet.credit": "Credit",
    "wallet.debit": "Debit",
    "wallet.frozen": "Frozen",
    "wallet.frozen_note": "This balance is frozen due to suspicious activity",
    "wallet.insufficient_funds": "Insufficient Funds",
    "wallet.invalid_amount": "Invalid Amount",
    "wallet.min_withdrawal": "Minimum withdrawal: 50 MAD",
    "wallet.total_balance": "Total Balance",
    "wallet.unfrozen": "Unfrozen",
    "wallet.withdraw": "Withdraw",
    "wallet.withdraw_description": "Enter the amount you want to withdraw",
    "wallet.withdraw_notice": "Funds will be transferred to your bank account within 1-3 business days",
    "wallet.withdraw_title": "Withdraw Funds",
    "wallet.withdrawal_requested": "Withdrawal requested successfully"
  },
  fr: {
    "admin.categories_tab": "Catégories",
    "messages.report_submitted": "Signalement soumis avec succès",
    "messages.select_conversation": "Sélectionner une conversation",
    "messages.select_reason": "Sélectionner une raison",
    "messages.sort_newest": "Plus récent",
    "messages.sort_recent": "Récent",
    "messages.sort_unread": "Non lu",
    "messages.start_conversation": "Démarrer une conversation",
    "messages.submit_report": "Soumettre le signalement",
    "messages.unknown_user": "Utilisateur inconnu",
    "min_price": "Prix min",
    "profile.activity": "Activité",
    "profile.location": "Emplacement",
    "profile.manage_account": "Gérer le compte",
    "profile.no_listings_yet": "Aucune annonce pour le moment",
    "profile.personal_info": "Informations personnelles",
    "profile.received_reviews": "Avis reçus",
    "profile.saved_items": "Éléments sauvegardés",
    "profile.start_posting": "Commencer à publier",
    "profile.updated_successfully": "Profil mis à jour avec succès",
    "q": "Rechercher",
    "search": "Recherche",
    "sort.most_popular": "Plus populaire",
    "sort.newest": "Plus récent",
    "sort.price_high_low": "Prix : décroissant",
    "sort.price_low_high": "Prix : croissant",
    "sort_by": "Trier par",
    "tokens.description": "Achetez des jetons pour ajouter des fonctionnalités à vos annonces",
    "tokens.proceed_to_pay": "Procéder au paiement",
    "tokens.purchase_description": "Choisissez le pack de jetons qui correspond à vos besoins",
    "tokens.purchase_title": "Acheter des jetons",
    "tokens.will_be_added": "Les jetons seront ajoutés à votre compte instantanément",
    "wallet.all_types": "Tous les types",
    "wallet.amount": "Montant",
    "wallet.available": "Disponible",
    "wallet.confirm_withdraw": "Confirmer le retrait",
    "wallet.credit": "Crédit",
    "wallet.debit": "Débit",
    "wallet.frozen": "Gelé",
    "wallet.frozen_note": "Ce solde est gelé en raison d'une activité suspecte",
    "wallet.insufficient_funds": "Fonds insuffisants",
    "wallet.invalid_amount": "Montant invalide",
    "wallet.min_withdrawal": "Retrait minimum : 50 MAD",
    "wallet.total_balance": "Solde total",
    "wallet.unfrozen": "Non gelé",
    "wallet.withdraw": "Retirer",
    "wallet.withdraw_description": "Entrez le montant que vous souhaitez retirer",
    "wallet.withdraw_notice": "Les fonds seront transférés sur votre compte bancaire dans les 1-3 jours ouvrables",
    "wallet.withdraw_title": "Retirer des fonds",
    "wallet.withdrawal_requested": "Demande de retrait soumise avec succès"
  }
};

// Process each language
for (const [lang, fixes] of Object.entries(translations)) {
  const filePath = path.join(__dirname, '../src/i18n/' + lang + '.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    let fixedCount = 0;
    for (const [key, value] of Object.entries(fixes)) {
      if (data[key] === key || data[key].startsWith(key.split('.')[0] + '.')) {
        data[key] = value;
        fixedCount++;
      }
    }
    
    // Write back with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ ${lang.toUpperCase()}: Fixed ${fixedCount} untranslated keys`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${lang}:`, error.message);
  }
}

console.log('\n🎉 All translations fixed!');
