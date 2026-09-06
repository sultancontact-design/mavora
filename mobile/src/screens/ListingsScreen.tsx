/**
 * Listings Screen for Mavora Mobile
 * Grid/list view, filters, infinite scroll, pull-to-refresh
 * 
 * @module screens/ListingsScreen
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, Listing, ListingFilters, ListingCondition } from '../services/SupabaseClient';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n';
import { formatPrice, formatDate } from '../utils/formatting';
import { LISTING_CONDITIONS, SORT_OPTIONS, MOROCCAN_CITIES } from '../constants/config';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type ViewMode = 'grid' | 'list';

// ============================================================
// Main Component
// ============================================================

const ListingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  
  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ListingFilters>({
    sort_by: 'date',
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Pagination
  const pageRef = useRef(0);
  const PAGE_SIZE = 20;

  // Initial fetch
  useEffect(() => {
    fetchListings(true);
  }, []);

  // Handle category selection from navigation
  useEffect(() => {
    if (navigation as any?.route?.params?.category) {
      setSelectedCategory((navigation as any).route.params.category);
    }
  }, [(navigation as any)?.route?.params?.category]);

  const fetchListings = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        pageRef.current = 0;
        setHasMore(true);
      }

      const page = reset ? 0 : pageRef.current;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike(`%${searchQuery.trim()}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply price filters
      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }

      // Apply condition filter
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Apply city filter
      if (selectedCity) {
        // This would need a join in production
        // query = query.eq('location.city', selectedCity);
      }

      // Apply sorting
      switch (filters.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popularity':
          query = query.order('view_count', { ascending: false });
          break;
        default: // date
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const newListings = data || [];
      
      if (reset) {
        setListings(newListings);
      } else {
        setListings(prev => [...prev, ...newListings]);
      }

      // Check if there's more data
      const totalItems = count || 0;
      setHasMore(from + newListings.length < totalItems);
      pageRef.current = page + 1;

    } catch (error) {
      console.error('[Listings] Fetch error:', error);
      // Use mock data for development
      if (reset) {
        setListings(getMockListings(PAGE_SIZE));
      } else {
        setListings(prev => [...prev, ...getMockListings(10)]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings(true);
  }, [searchQuery, selectedCategory, filters]);

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await fetchListings(false);
  };

  const handleSearch = () => {
    fetchListings(true);
  };

  const applyFilters = (newFilters: ListingFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    fetchListings(true);
  };

  const clearFilters = () => {
    setFilters({ sort_by: 'date' });
    setSelectedCategory(null);
    setSelectedCity(null);
    setShowFilters(false);
    fetchListings(true);
  };

  // Render helpers
  const renderListingCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[styles.listingCard, viewMode === 'list' && styles.listingCardList, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: Array.isArray(item.images) ? item.images[0] : 'https://via.placeholder.com/300' }}
        style={[
          styles.listingImage,
          viewMode === 'list' && styles.listingImageList
        ]}
        resizeMode="cover"
      />
      <View style={[styles.listingInfo, viewMode === 'list' && styles.listingInfoList]}>
        <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={viewMode === 'grid' ? 2 : 1}>
          {item.title}
        </Text>
        
        {viewMode === 'list' && (
          <Text style={[styles.listingDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <Text style={styles.listingPrice}>
          {formatPrice(item.price)}
          {item.is_negotiable && (
            <Text style={styles.negotiableTag}> {t('listingDetail.negotiable')}</Text>
          )}
        </Text>
        
        <View style={styles.listingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.location?.city || t('app.name')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDate(item.created_at, 'relative')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('listings.noResults')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {t('listings.tryDifferentSearch')}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={clearFilters}
      >
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchListings(true); }}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* Category Filter Chip */}
          <FilterChip
            label={selectedCategory ? t('listings.conditions.new') : t('listings.filters')}
            active={showFilters || !!selectedCategory}
            onPress={() => setShowFilters(true)}
            colors={colors}
          />
          
          {/* Sort Button */}
          <FilterChip
            label={SORT_OPTIONS.find(s => s.value === filters.sort_by)?.label || t('common.sort')}
            icon="swap-vertical-outline"
            onPress={() => {}}
            colors={colors}
          />

          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'grid' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons 
                name="grid-outline" 
                size={18} 
                color={viewMode === 'grid' ? '#fff' : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'list' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list-outline" 
                size={18} 
                color={viewMode === 'list' ? '#fff' : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Results Count */}
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {toArabicNumerals(String(listings.length))} {t('listings.resultsCount', { count: '' })}
          </Text>
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={[styles.loadingMoreText, { color: colors.textSecondary }]}>
          {t('listings.loadMore')}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderListingCard}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={[
          styles.listContent,
          listings.length === 0 && styles.listContentEmpty,
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.7}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Create Listing */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateListing')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Filters Modal */}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        selectedCategory={selectedCategory}
        selectedCity={selectedCity}
        onApply={applyFilters}
        onClear={clearFilters}
        colors={colors}
      />
    </View>
  );
};

// ============================================================
// Sub-components
// ============================================================

interface FilterChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onPress: () => void;
  colors: any;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, icon, active, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      { 
        backgroundColor: active ? '#eef2ff' : colors.surface,
        borderColor: active ? colors.primary : colors.border,
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon && <Ionicons name={icon as any} size={14} color={active ? colors.primary : colors.textSecondary} />}
    <Text 
      style={[
        styles.filterChipLabel, 
        { color: active ? colors.primary : colors.textSecondary }
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ListingFilters;
  selectedCategory: string | null;
  selectedCity: string | null;
  onApply: (filters: ListingFilters) => void;
  onClear: () => void;
  colors: any;
}

const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  filters,
  selectedCategory,
  selectedCity,
  onApply,
  onClear,
  colors,
}) => {
  const [localFilters, setLocalFilters] = useState<ListingFilters>(filters);
  const [localCategory, setLocalCategory] = useState<string | null>(selectedCategory);
  const [localCity, setLocalCity] = useState<string | null>(selectedCity);
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() || '');

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      setLocalCategory(selectedCategory);
      setLocalCity(selectedCity);
      setMinPrice(filters.min_price?.toString() || '');
      setMaxPrice(filters.max_price?.toString() || '');
    }
  }, [visible]);

  const handleApply = () => {
    onApply({
      ...localFilters,
      min_price: minPrice ? parseFloat(minPrice) : undefined,
      max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('listings.filters')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                {t('createListing.pricing.title')}
              </Text>
              <View style={styles.priceRow}>
                <View style={[styles.priceInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    style={[styles.priceInputText, { color: colors.text }]}
                    placeholder={t('createListing.pricing.pricePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: colors.textSecondary }}>د.م.</Text>
                </View>
                <Text style={[styles.priceSeparator, { color: colors.textTertiary }]}>—</Text>
                <View style={[styles.priceInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    style={[styles.priceInputText, { color: colors.text }]}
                    placeholder={t('createListing.pricing.pricePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: colors.textSecondary }}>د.م.</Text>
                </View>
              </View>
            </View>

            {/* Condition */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                {t('listingDetail.condition')}
              </Text>
              <View style={styles.conditionGrid}>
                {LISTING_CONDITIONS.map((condition) => (
                  <TouchableOpacity
                    key={condition.value}
                    style={[
                      styles.conditionChip,
                      {
                        backgroundColor: localFilters.condition === condition.value ? '#eef2ff' : colors.background,
                        borderColor: localFilters.condition === condition.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setLocalFilters(prev => ({
                      ...prev,
                      condition: prev?.condition === condition.value ? undefined : condition.value as ListingCondition,
                    }))}
                  >
                    <Text style={{
                      color: localFilters.condition === condition.value ? colors.primary : colors.textSecondary,
                    }}>
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                {t('listings.sortBy')}
              </Text>
              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: localFilters.sort_by === option.value ? '#eef2ff' : colors.background,
                        borderColor: localFilters.sort_by === option.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sort_by: option.value as any }))}
                  >
                    <View style={[
                      styles.radioCircle,
                      { borderColor: localFilters.sort_by === option.value ? colors.primary : colors.border }
                    ]}>
                      {localFilters.sort_by === option.value && (
                        <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={{
                      color: localFilters.sort_by === option.value ? colors.primary : colors.text,
                      marginLeft: 8,
                    }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={onClear}
            >
              <Text style={{ color: colors.textSecondary }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
// Mock Data Generator
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
    'تلفزيون سامسونج 55 بوصة',
    'غسالة أوتوماتيك 9 كيلو',
  ];
  
  const cities = ['الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير'];
  const conditions: ListingCondition[] = ['new', 'like_new', 'good', 'fair'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `listing-${i}-${Date.now()}`,
    title: titles[i % titles.length],
    description: 'وصف تفصيلي للمنتج هنا. حالة ممتازة، يستخدم لفترة قصيرة فقط.',
    price: Math.floor(Math.random() * 50000) + 100,
    currency: 'MAD',
    category_id: `${(i % 8) + 1}`,
    seller_id: 'seller-1',
    images: [`https://picsum.photos/400/300?random=${i + Date.now()}`],
    location: {
      lat: 33.5731 + (Math.random() - 0.5) * 2,
      lng: -7.5898 + (Math.random() - 0.5) * 2,
      city: cities[i % cities.length],
    },
    status: 'active' as const,
    condition: conditions[i % conditions.length],
    is_featured: i < 3,
    is_negotiable: Math.random() > 0.5,
    view_count: Math.floor(Math.random() * 500),
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function toArabicNumerals(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
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
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Cairo',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipLabel: {
    fontSize: 13,
    marginLeft: 4,
    fontFamily: 'Cairo',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resultsCount: {
    fontSize: 12,
    fontFamily: 'Cairo',
  },

  // Listings
  listingCard: {
    width: GRID_CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  listingCardList: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 12,
  },
  listingImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
  },
  listingImageList: {
    width: 120,
    height: 120,
  },
  listingInfo: {
    padding: 10,
  },
  listingInfoList: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    lineHeight: 18,
    marginBottom: 4,
  },
  listingDescription: {
    fontSize: 12,
    fontFamily: 'Cairo',
    lineHeight: 18,
    marginBottom: 6,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'Cairo-Bold',
    marginBottom: 6,
  },
  negotiableTag: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Cairo',
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    marginLeft: 2,
    fontFamily: 'Cairo',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 40,
    fontFamily: 'Cairo',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },

  // Loading More
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Cairo',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },

  // Filter Sections
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  priceInputText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo',
  },
  priceSeparator: {
    fontSize: 16,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ListingsScreen;
