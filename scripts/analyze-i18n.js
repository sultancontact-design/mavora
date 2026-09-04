#!/usr/bin/env node
/**
 * i18n Translation Analysis Script
 * Compares ar.json, en.json, fr.json for missing/inconsistent keys
 */

const fs = require('fs');
const path = require('path');

// Read all translation files
const files = {
  ar: path.join(__dirname, '../src/i18n/ar.json'),
  en: path.join(__dirname, '../src/i18n/en.json'),
  fr: path.join(__dirname, '../src/i18n/fr.json')
};

const translations = {};
const keySets = {};
const allKeys = new Set();

console.log('🔍 Analyzing i18n translation files...\n');

// Load and parse each file
for (const [lang, filePath] of Object.entries(files)) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    translations[lang] = JSON.parse(content);
    keySets[lang] = new Set(Object.keys(translations[lang]));
    
    // Add to all keys
    Object.keys(translations[lang]).forEach(key => allKeys.add(key));
    
    console.log(`✅ ${lang.toUpperCase()}: ${keySets[lang].size} keys loaded`);
  } catch (error) {
    console.error(`❌ Error loading ${lang}:`, error.message);
    process.exit(1);
  }
}

console.log(`\n📊 Total unique keys across all files: ${allKeys.size}\n`);

// Find missing keys in each language
console.log('=' .repeat(60));
console.log('📋 MISSING KEYS ANALYSIS');
console.log('='.repeat(60));

const missingKeys = { ar: [], en: [], fr: [] };

for (const key of allKeys) {
  if (!keySets.ar.has(key)) missingKeys.ar.push(key);
  if (!keySets.en.has(key)) missingKeys.en.push(key);
  if (!keySets.fr.has(key)) missingKeys.fr.push(key);
}

for (const [lang, missing] of Object.entries(missingKeys)) {
  console.log(`\n🔴 Keys MISSING in ${lang.toUpperCase()} (${missing.length}):`);
  if (missing.length === 0) {
    console.log('   ✅ None - All keys present!');
  } else {
    missing.forEach((key, i) => {
      console.log(`   ${i + 1}. ${key}`);
    });
  }
}

// Find unverified marketing claims
console.log('\n' + '='.repeat(60));
console.log('⚠️  UNVERIFIED MARKETING CLAIMS (needs review)');
console.log('='.repeat(60));

const marketingPatterns = [
  /أكبر/i,  // "largest" in Arabic
  /الأفضل/i, // "best" in Arabic
  /largest/i,
  /best/i,
  /meilleur/i, // "best" in French
  /plus grand/i, // "largest" in French
  /thousands/i,
  /آلاف/i,  // "thousands" in Arabic
  /\+100/,
  /\+100/
];

const suspiciousKeys = [];
for (const key of allKeys) {
  for (const lang of ['ar', 'en', 'fr']) {
    const value = translations[lang]?.[key];
    if (value && typeof value === 'string') {
      for (const pattern of marketingPatterns) {
        if (pattern.test(value) && !suspiciousKeys.find(s => s.key === key && s.lang === lang)) {
          suspiciousKeys.push({ key, lang, value: value.substring(0, 80) + (value.length > 80 ? '...' : '') });
        }
      }
    }
  }
}

if (suspiciousKeys.length > 0) {
  console.log('\nKeys with potentially unverified claims:');
  suspiciousKeys.forEach(({ key, lang, value }) => {
    console.log(`   [${lang.toUpperCase()}] ${key}: "${value}"`);
  });
} else {
  console.log('   ✅ No suspicious patterns found');
}

// Statistics summary
console.log('\n' + '='.repeat(60));
console.log('📈 SUMMARY STATISTICS');
console.log('='.repeat(60));

console.log(`
┌─────────┬──────────┬────────────┬────────────┐
│ Language │ Keys     │ Missing    │ Coverage   │
├─────────┼──────────┼────────────┼────────────┤
│ AR      │ ${keySets.ar.size.toString().padStart(6)} │ ${missingKeys.ar.length.toString().padStart(10)} │ ${((keySets.ar.size / allKeys.size) * 100).toFixed(1).padStart(8)}%   │
│ EN      │ ${keySets.en.size.toString().padStart(6)} │ ${missingKeys.en.length.toString().padStart(10)} │ ${((keySets.en.size / allKeys.size) * 100).toFixed(1).padStart(8)}%   │
│ FR      │ ${keySets.fr.size.toString().padStart(6)} │ ${missingKeys.fr.length.toString().padStart(10)} │ ${((keySets.fr.size / allKeys.size) * 100).toFixed(1).padStart(8)}%   │
├─────────┼──────────┼────────────┼────────────┤
│ TOTAL   │ ${allKeys.size.toString().padStart(6)} │            │ 100%      │
└─────────┴──────────┴────────────┴────────────┘
`);

// Output JSON for programmatic use
const report = {
  totalUniqueKeys: allKeys.size,
  languages: {
    ar: { count: keySets.ar.size, missing: missingKeys.ar },
    en: { count: keySets.en.size, missing: missingKeys.en },
    fr: { count: keySets.fr.size, missing: missingKeys.fr }
  },
  suspiciousKeys
};

fs.writeFileSync(
  path.join(__dirname, '../docs/I18N_ANALYSIS.json'), 
  JSON.stringify(report, null, 2)
);

console.log('\n💾 Full report saved to: docs/I18N_ANALYSIS.json');
