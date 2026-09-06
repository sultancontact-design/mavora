/**
 * Interactive Map Component for Listings
 * Displays listings on an interactive map with clustering and filtering
 * 
 * @module components/listings/ListingMap
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, 
  Filter, 
  Layers, 
  Maximize2, 
  Navigation,
  Search,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// ============================================================
// Types
// ============================================================

export interface MapListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  latitude: number;
  longitude: number;
  category: string;
  categoryName?: string;
  image?: string;
  condition?: 'new' | 'used' | 'like_new';
  city: string;
  views?: number;
  createdAt: Date;
}

// ============================================================
// Mock Data (Moroccan Cities)
// ============================================================

const mockListings: MapListing[] = [
  // Casablanca
  { id: '1', title: 'شقة فاخرة في المعاريف', price: 850000, currency: 'MAD', latitude: 33.5731, longitude: -7.5898, category: 'real_estate', cityName: 'عقارات', city: 'الدار البيضاء', image: '/images/placeholder.jpg', condition: 'new', views: 234, createdAt: new Date('2025-01-10') },
  { id: '2', title: 'iPhone 15 Pro Max', price: 12000, currency: 'MAD', latitude: 33.5850, longitude: -7.5950, category: 'electronics', categoryName: 'إلكترونيات', city: 'الدار البيضاء', condition: 'like_new', views: 567, createdAt: new Date('2025-01-09') },
  { id: '3', title: 'سيارة تويوتا كامري 2023', price: 320000, currency: 'MAD', latitude: 33.5650, longitude: -7.6100, category: 'vehicles', categoryName: 'مركبات', city: 'الدار البيضاء', condition: 'used', views: 890, createdAt: new Date('2025-01-08') },
  
  // Rabat
  { id: '4', title: 'كنبة مودرن جديدة', price: 4500, currency: 'MAD', latitude: 34.0209, longitude: -6.8416, category: 'furniture', cityName: 'أثاث', city: 'الرباط', condition: 'new', views: 123, createdAt: new Date('2025-01-10') },
  { id: '5', title: 'لابتوب Dell XPS 15', price: 9000, currency: 'MAD', latitude: 34.0250, longitude: -6.8350, category: 'electronics', cityName: 'إلكترونيات', city: 'الرباط', condition: 'like_new', views: 345, createdAt: new Date('2025-01-07') },
  
  // Marrakech
  { id: '6', title: 'رياضة تقليدية مغربية', price: 1200, currency: 'MAD', latitude: 31.6295, longitude: -7.9811, category: 'arts', cityName: 'فنون', city: 'مراكش', condition: 'used', views: 89, createdAt: new Date('2025-01-10') },
  { id: '7', title: 'فيلا للإيجار في الغابة', price: 15000, currency: 'MAD', latitude: 31.6200, longitude: -7.9900, category: 'real_estate', cityName: 'عقارات', city: 'مراكش', condition: 'used', views: 456, createdAt: new Date('2025-01-06') },
  
  // Fes
  { id: '8', title: 'سجادة يدوية الصنع', price: 2500, currency: 'MAD', latitude: 34.0331, longitude: -5.0003, category: 'arts', cityName: 'فنون', city: 'فاس', condition: 'new', views: 178, createdAt: new Date('2025-01-09') },
  
  // Tangier
  { id: '9', title: 'شقة بحرية في مطوانق', price: 650000, currency: 'MAD', latitude: 35.7595, longitude: -5.8340, category: 'real_estate', cityName: 'عقارات', city: 'طنجة', condition: 'like_new', views: 678, createdAt: new Date('2025-01-05') },
  
  // Agadir
  { id: '10', title: 'دراجة هوائية جبلية', price: 3500, currency: 'MAD', latitude: 30.4278, longitude: -9.5981, category: 'sports', cityName: 'رياضة', city: 'أكادير', condition: 'used', views: 234, createdAt: new Date('2025-01-08') },
];

const moroccanCities = [
  { name: 'كل المدن', value: 'all' },
  { name: 'الدار البيضاء', value: 'casablanca', lat: 33.5731, lng: -7.5898 },
  { name: 'الرباط', value: 'rabat', lat: 34.0209, lng: -6.8416 },
  { name: 'مراكش', value: 'marrakech', lat: 31.6295, lng: -7.9811 },
  { name: 'فاس', value: 'fes', lat: 34.0331, lng: -5.0003 },
  { name: 'طنجة', value: 'tangier', lat: 35.7595, lng: -5.8340 },
  { name: 'أكادير', value: 'agadir', lat: 30.4278, lng: -9.5981 },
];

const categories = [
  { name: 'جميع الفئات', value: 'all' },
  { name: 'عقارات', value: 'real_estate' },
  { name: 'مركبات', value: 'vehicles' },
  { name: 'إلكترونيات', value: 'electronics' },
  { name: 'أثاث', value: 'furniture' },
  { name: 'فنون', value: 'arts' },
  { name: 'رياضة', value: 'sports' },
];

const priceRanges = [
  { name: 'جميع الأسعار', value: 'all' },
  { name: 'أقل من 1,000 درهم', value: '0-1000' },
  { name: '1,000 - 10,000 درهم', value: '1000-10000' },
  { name: '10,000 - 50,000 درهم', value: '10000-50000' },
  { name: 'أكثر من 50,000 درهم', value: '50000+' },
];

// ============================================================
// Simple Map Component
// ============================================================

function SimpleMap({ 
  listings, 
  selectedListing, 
  onSelectListing, 
  center
}: { 
  listings: MapListing[]; 
  selectedListing: MapListing | null; 
  onSelectListing: (listing: MapListing) => void;
  center: [number, number];
}) {
  return (
    <div 
      className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden"
      style={{ minHeight: '500px' }}
    >
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Morocco Outline */}
      <svg viewBox="0 0 400 500" className="absolute inset-0 m-auto w-[80%] h-[90%] opacity-20">
        <path
          d="M200,50 L280,80 L320,150 L340,220 L330,300 L300,380 L250,430 L180,450 L120,420 L80,360 L60,280 L70,200 L100,130 L150,80 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      {/* Listing Markers */}
      {listings.map((listing) => (
        <button
          key={listing.id}
          onClick={() => onSelectListing(listing)}
          className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 hover:z-10 ${
            selectedListing?.id === listing.id ? 'z-10 scale-110' : ''
          }`}
          style={{
            left: `${((listing.longitude + 11) / 20) * 100}%`,
            top: `${((36 - listing.latitude) / 12) * 100}%`,
          }}
        >
          <div className={`
            relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg 
            border-2 transition-all
            ${selectedListing?.id === listing.id 
              ? 'bg-primary text-primary-foreground border-primary scale-125' 
              : 'bg-white dark:bg-gray-800 border-white dark:border-gray-700 hover:bg-primary hover:text-primary-foreground'
            }
          `}>
            <MapPin className="w-5 h-5" />
            
            {/* Price Tooltip */}
            <div className={`
              absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
              bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity
              ${selectedListing?.id === listing.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}>
              {listing.price.toLocaleString('ar-MA')} {listing.currency}
            </div>
          </div>
        </button>
      ))}

      {/* Center Marker */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${((center[1] + 11) / 20) * 100}%`,
          top: `${(36 - center[0]) / 12} %`,
        }}
      >
        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
      </div>

      {/* Controls */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <Button size="icon" variant="secondary" className="bg-white shadow-md">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="bg-white shadow-md">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Mavora Maps ©
      </div>
    </div>
  );
}

// ============================================================
// Listing Card Component
// ============================================================

function ListingCard({ listing }: { listing: MapListing }) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const conditionLabels = {
    new: 'جديد',
    used: 'مستعمل',
    like_new: 'كالجديد',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{listing.city}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary">{listing.categoryName || listing.category}</Badge>
            {listing.condition && (
              <span className="text-xs text-muted-foreground">
                {conditionLabels[listing.condition]}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ListingMap() {
  const [listings] = useState<MapListing[]>(mockListings);
  const [filteredListings, setFilteredListings] = useState<MapListing[]>(mockListings);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [center, setCenter] = useState<[number, number]>([33.5731, -7.5898]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');

  useEffect(() => {
    let filtered = [...listings];
    if (searchQuery) {
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCity !== 'all') {
      const city = moroccanCities.find(c => c.value === selectedCity);
      if (city) {
        filtered = filtered.filter(l => l.city.includes(city.name.replace('ال', '')));
      }
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(l => l.category === selectedCategory);
    }
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(v => v === '+' ? Infinity : parseInt(v));
      filtered = filtered.filter(l => l.price >= (min || 0) && l.price <= (max || Infinity));
    }
    setFilteredListings(filtered);
  }, [searchQuery, selectedCity, selectedCategory, selectedPriceRange, listings]);

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    if (value !== 'all') {
      const city = moroccanCities.find(c => c.value === value);
      if (city) {
        setCenter([city.lat, city.lng]);
      }
    } else {
      setCenter([31.7917, -7.0926]);
    }
  };

  const handleSelectListing = (listing: MapListing) => {
    setSelectedListing(listing);
    setCenter([listing.latitude, listing.longitude]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8" />
            خريطة الإعلانات
          </h1>
          <p className="text-muted-foreground mt-1">اكتشف الإعلانات القريبة منك على الخريطة التفاعلية</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{filteredListings.length}</p>
            <p className="text-xs text-muted-foreground">إعلان</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في الإعلانات أو المدينة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={selectedCity} onValueChange={handleCityChange}>
          <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="المدينة" /></SelectTrigger>
          <SelectContent>
            {moroccanCities.map(city => (
              <SelectItem key={city.value} value={city.value}>{city.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[160px] hidden lg:block"><SelectValue placeholder="الفئة" /></SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
          <SelectTrigger className="w-[180px] hidden lg:block"><SelectValue placeholder="السعر" /></SelectTrigger>
          <SelectContent>
            {priceRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>{range.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 order-1">
          <Card className="overflow-hidden">
            <SimpleMap
              listings={filteredListings}
              selectedListing={selectedListing}
              onSelectListing={handleSelectListing}
              center={center}
            />
          </Card>
        </div>

        <div className="order-2 space-y-4">
          <h2 className="font-semibold">الإعلانات ({filteredListings.length})</h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredListings.length > 0 ? (
              filteredListings.map(listing => (
                <div key={listing.id} onClick={() => handleSelectListing(listing)}>
                  <ListingCard listing={listing} />
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">لا توجد نتائج</h3>
                  <p className="text-sm text-muted-foreground">حاول تغيير معايير البحث</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingMap;
