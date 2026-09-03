import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://kyanecjjautqmuowbtvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YW5lY2pqYXV0cW11b3didHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI5ODM2MiwiZXhwIjoyMTAzODc0MzYyfQ.CfYJjFHkacydBjS7U2kE44K9o4k8fH5DexC9Xd7sdN0';

const cities = [
  { name: 'Casablanca', nameAr: 'الدار البيضاء', lat: 33.5731, lng: -7.5898 },
  { name: 'Rabat', nameAr: 'الرباط', lat: 34.0209, lng: -6.8416 },
  { name: 'Fes', nameAr: 'فاس', lat: 34.0331, lng: -5.0003 },
  { name: 'Marrakech', nameAr: 'مراكش', lat: 31.6295, lng: -7.9811 },
  { name: 'Agadir', nameAr: 'أكادير', lat: 30.4278, lng: -9.5981 },
  { name: 'Tangier', nameAr: 'طنجة', lat: 35.7595, lng: -5.8340 },
  { name: 'Meknes', nameAr: 'مكناس', lat: 33.8935, lng: -5.5547 },
  { name: 'Oujda', nameAr: 'وجدة', lat: 34.6867, lng: -1.9114 },
  { name: 'Kenitra', nameAr: 'كنترة', lat: 34.2610, lng: -6.5802 },
  { name: 'Tetouan', nameAr: 'تطوان', lat: 35.5889, lng: -5.3628 },
  { name: 'El Jadida', nameAr: 'الجديدة', lat: 33.2309, lng: -8.5075 },
  { name: 'Nador', nameAr: 'ناظور', lat: 35.1688, lng: -2.9316 },
  { name: 'Beni Mellal', nameAr: 'بنى ملال', lat: 32.4972, lng: -6.7396 },
  { name: 'Khenifra', nameAr: 'خنيفرة', lat: 32.9378, lng: -5.6635 },
  { name: 'Al Hoceima', nameAr: 'الحسيمة', lat: 35.2469, lng: -3.9366 },
  { name: 'Sale', nameAr: 'سلا', lat: 34.0532, lng: -6.7958 },
  { name: 'Settat', nameAr: 'سطات', lat: 32.9770, lng: -7.6164 },
  { name: 'Mohammedia', nameAr: 'المحمدية', lat: 33.6843, lng: -7.3830 },
  { name: 'Khouribga', nameAr: 'خريبكة', lat: 32.8814, lng: -6.9062 },
  { name: 'Taza', nameAr: 'تازة', lat: 34.2196, lng: -4.0095 },
  { name: 'Laayoune', nameAr: 'العيون', lat: 27.1538, lng: -13.2033 },
  { name: 'Safi', nameAr: 'آسفي', lat: 32.2995, lng: -9.2372 },
  { name: 'Essaouira', nameAr: 'الصويرة', lat: 31.5085, lng: -9.7595 },
  { name: 'Errachidia', nameAr: 'الرشيدية', lat: 31.9403, lng: -4.4334 },
  { name: 'Ouarzazate', nameAr: 'ورزازات', lat: 30.9185, lng: -6.8935 },
  { name: 'Guelmim', nameAr: 'كلميم', lat: 28.9841, lng: -10.0650 },
  { name: 'Taroudant', nameAr: 'تارودانت', lat: 30.4731, lng: -8.8748 },
  { name: 'Skhirate-Temara', nameAr: 'الصخيرات', lat: 33.8710, lng: -6.6939 },
  { name: 'Sidi Kacem', nameAr: 'سيدي قاسم', lat: 34.2673, lng: -5.7043 },
  { name: 'Berkane', nameAr: 'بركان', lat: 35.0015, lng: -2.3286 },
  { name: 'Chefchaouen', nameAr: 'شفشاون', lat: 35.1689, lng: -5.2636 },
  { name: 'Larache', nameAr: 'العرائش', lat: 35.1936, lng: -6.1565 },
  { name: 'Mediouna', nameAr: 'مديونة', lat: 33.4714, lng: -7.4617 },
  { name: 'Nouaceur', nameAr: 'نواصر', lat: 33.3045, lng: -7.6505 },
  { name: 'Berrechid', nameAr: 'برشيد', lat: 32.9970, lng: -7.6715 },
  { name: 'Benslimane', nameAr: 'بنسليمان', lat: 33.7000, lng: -7.7500 },
];

async function main() {
  console.log('🏙️ جارِ إضافة المدن المغربية...\n');
  
  // Get Morocco country ID
  const countries = await fetch(`${SUPABASE_URL}/rest/v1/countries?code=eq.MA`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  }).then(r => r.json());
  
  if (!countries || !countries[0]) {
    console.error('❌ لم يتم العثور على المغرب');
    return;
  }
  
  const countryId = countries[0].id;
  console.log(`🇲🇦 Country ID: ${countryId}\n`);
  
  let successCount = 0;
  
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const data = {
      id: uuidv4(),
      name: city.name,
      nameAr: city.nameAr,
      countryId: countryId,
      latitude: city.lat,
      longitude: city.lng,
      sortOrder: i + 1,
      isActive: true
    };
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/cities`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        successCount++;
        console.log(`   ✅ ${city.nameAr}`);
      } else {
        const err = await res.text();
        console.log(`   ❌ ${city.nameAr}: ${err.substring(0, 50)}...`);
      }
    } catch (e) {
      console.log(`   ❌ ${city.nameAr}: ${String(e).substring(0, 50)}`);
    }
  }
  
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`✅ تم إضافة ${successCount}/${cities.length} مدينة بنجاح!`);
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
