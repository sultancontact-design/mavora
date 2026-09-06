/**
 * Home Screen for Mavora Mobile
 * Main landing screen with hero section, featured listings, categories grid, and search
 * 
 * @module screens/HomeScreen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, Listing, Category } from '../services/SupabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n';
import { formatPrice, formatDate, toArabicNumerals } from '../utils/formatting';
import { CATEGORIES_DATA } from '../constants/config';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const HERO_HEIGHT = 180;

// Default categories data (can be fetched from API)
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', name_ar: 'إلكترونيات', icon: 'phone-portrait-outline' },
  { id: '2', name: 'Vehicles', name_ar: 'مركبات', icon: 'car-outline' },
  { id: '3', name: 'Property', name_ar: 'عقارات', icon: 'home-outline' },
  { id: '4', name: 'Fashion', name_ar: 'أزياء', icon: 'shirt-outline' },
  { id: '5', name: 'Home & Garden', name_ar: 'المنزل والحديقة', icon: 'bed-outline' },
  { id: '6', name: 'Jobs', name_ar: 'وظائف', icon: 'briefcase-outline' },
  { id: '7', name: 'Services', name_ar: 'خدمات', icon: 'construct-outline' },
  { id: '8', name: 'Animals', name_ar: 'حيوانات', icon: 'paw-outline' },
];

// ============================================================
// Main Component
// ============================================================

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
  // State
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(t('home.greeting'));

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting(t('home.greetingMorning'));
    } else if (hour < 18) {
      setGreeting(t('home.greeting'));
    } else {
      setGreeting(t('home.greetingEvening'));
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchFeaturedListings(),
        fetchRecentListings(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error('[Home] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, []);

  // Data fetching functions
  const fetchFeaturedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setFeaturedListings(data);
      }
    } catch (error) {
      console.error('[Home] Fetch featured error:', error);
      // Use mock data for development
      setFeaturedListings(getMockListings(6));
    }
  };

  const fetchRecentListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(0, 19);

      if (!error && data) {
        setRecentListings(data);
      }
    } catch (error) {
      console.error('[Home] Fetch recent error:', error);
      // Use mock data for development
      setRecentListings(getMockListings(10));
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_ar');

      if (!error && data && data.length > 0) {
        setCategories(data);
      }
    } catch (error) {
      console.error('[Home] Fetch categories error:', error);
      // Keep default categories
    }
  };

  // Render helpers
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Search', { category: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? '#374151' : '#eef2ff' }]}>
        <Ionicons name={item.icon as any} size={24} color="#6366f1" />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]}>
        {item.name_ar || item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderListingCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[styles.listingCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: Array.isArray(item.images) ? item.images[0] : (item.images as any)?.url || 'https://via.placeholder.com/300' }}
          style={styles.listingImage}
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/300?text=Loading' }}
        />
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#f59e0b" />
            <Text style={styles.featuredBadgeText}>⭐</Text>
          </View>
        )}
      </View>
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>
          {formatPrice(item.price)}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.listingLocation, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location?.city || t('app.name')}
          </Text>
        </View>
        <Text style={[styles.listingDate, { color: colors.textTertiary }]}>
          {formatDate(item.created_at, 'relative')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeroSection = () => (
    <View style={[styles.heroContainer, { backgroundColor: '#1a1a2e' }]}>
      <LinearGradientBackground />
      <View style={styles.heroContent}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username || t('common.loading')}</Text>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color="#9ca3af" />
        <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        <View style={styles.searchFilterButton}>
          <Ionicons name="options-outline" size={18} color="#6366f1" />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        data={[]}
        keyExtractor={() => 'header'}
        renderItem={null}
        ListHeaderComponent={
          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Hero Section */}
            {renderHeroSection()}

            {/* Categories Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('home.categories')}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>{t('common.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderCategoryItem}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Featured Listings */}
            {featuredListings.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="star" size={20} color="#f59e0b" />
                    <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                      {t('home.featured')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
                    <Text style={styles.seeAllText}>{t('common.viewAll')}</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={featuredListings}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={renderListingCard}
                  contentContainerStyle={styles.horizontalListingsList}
                />
              </View>
            )}

            {/* Recent Listings */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('home.recent')}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
                  <Text style={styles.seeAllText}>{t('common.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentListings}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderListingCard}
                contentContainerStyle={styles.recentList}
                columnWrapperStyle={styles.row}
                scrollEnabled={false}
              />
            </View>

            {/* Bottom spacing for tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      />
    </View>
  );
};

// ============================================================
// Sub-components
// ============================================================

const LinearGradientBackground: React.FC = () => (
  // Simple gradient simulation with overlay
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
    }} />
    <View style={{
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    }} />
    <View style={{
      position: 'absolute',
      bottom: -30,
      left: -30,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
    }} />
  </View>
);

// ============================================================
// Mock Data Generator (for development)
// ============================================================

function getMockListings(count: number): Listing[] {
  const titles = [
    'آيفون 15 برو ماكس 256 جيجا',
    'سوني PS5 مع إكسسوارات',
    'أريس 2023 حالة ممتازة',
    'شقة للكراء في مركز المدينة',
    'كنبة جديدة لم تستخدم',
    'لابتوب ماك بوك برو M2',
    'دراجة هوائية مرشيد',
    'كاميرا كانون احترافية',
  ];
  
  const cities = ['الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    title: titles[i % titles.length],
    description: 'وصف المنتج هنا...',
    price: Math.floor(Math.random() * 50000) + 100,
    currency: 'MAD',
    category_id: '1',
    seller_id: 'seller-1',
    images: [`https://picsum.photos/400/300?random=${i}`],
    location: {
      lat: 33.5731 + (Math.random() - 0.5) * 2,
      lng: -7.5898 + (Math.random() - 0.5) * 2,
      city: cities[i % cities.length],
    },
    status: 'active' as const,
    is_featured: i < 3,
    is_negotiable: Math.random() > 0.5,
    view_count: Math.floor(Math.random() * 500),
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Cairo',
  },

  // Hero Section
  heroContainer: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTextContainer: {},
  greeting: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Cairo-Bold',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    marginHorizontal: 10,
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'Cairo',
  },
  searchFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  sectionContainer: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontFamily: 'Cairo',
  },

  // Categories
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Cairo-SemiBold',
  },
  categoriesList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  // Listings
  horizontalListingsList: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  listingCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f3f4f6',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  featuredBadgeText: {
    fontSize: 10,
    marginLeft: 2,
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    lineHeight: 18,
    marginBottom: 6,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'Cairo-Bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  listingLocation: {
    fontSize: 11,
    marginLeft: 2,
    fontFamily: 'Cairo',
  },
  listingDate: {
    fontSize: 10,
    fontFamily: 'Cairo',
    marginTop: 2,
  },
});

export default HomeScreen;
