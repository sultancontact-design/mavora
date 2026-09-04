/**
 * Home Screen for Mavora Mobile
 * Main landing screen with featured listings and categories
 * 
 * @module screens/HomeScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, Listing } from '../services/SupabaseClient';
import { useAuth } from '../context/AuthContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', nameAr: 'إلكترونيات', icon: 'phone-portrait-outline' },
  { id: '2', name: 'Vehicles', nameAr: 'مركبات', icon: 'car-outline' },
  { id: '3', name: 'Property', nameAr: 'عقارات', icon: 'home-outline' },
  { id: '4', name: 'Fashion', nameAr: 'أزياء', icon: 'shirt-outline' },
  { id: '5', name: 'Home', nameAr: 'المنزل', icon: 'bed-outline' },
  { id: '6', name: 'Jobs', nameAr: 'وظائف', icon: 'briefcase-outline' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeaturedListings();
    fetchRecentListings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeaturedListings(), fetchRecentListings()]);
    setRefreshing(false);
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setFeaturedListings(data);
      }
    } catch (error) {
      console.error('[Home] Fetch featured error:', error);
    }
  };

  const fetchRecentListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(10, 19);

      if (!error && data) {
        setRecentListings(data);
      }
    } catch (error) {
      console.error('[Home] Fetch recent error:', error);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryIconContainer}>
        <Ionicons name={item.icon as any} size={24} color="#6366f1" />
      </View>
      <Text style={styles.categoryName}>{item.nameAr}</Text>
    </TouchableOpacity>
  );

  const renderListingCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }}
        style={styles.listingImage}
        resizeMode="cover"
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>
          {item.price.toLocaleString('ar-MA')} {item.currency}
        </Text>
        <Text style={styles.listingLocation} numberOfLines={1}>
          {item.location?.city || 'المغرب'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً 👋</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username || 'زائر'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search" size={20} color="#9ca3af" />
        <Text style={styles.searchPlaceholder}>ابحث عن منتجات...</Text>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>الفئات</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>عرض الكل</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.categoriesList}
      />

      {/* Featured Listings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مميز</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>عرض الكل</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={featuredListings}
        horizontal
        showsHorizontalScrollIndicator={false
        keyExtractor={(item) => item.id}
        renderItem={renderListingCard}
        contentContainerStyle={styles.listingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Recent Listings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>الأحدث</Text>
      </View>
      <FlatList
        data={recentListings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderListingCard}
        contentContainerStyle={styles.recentList}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
  },
  greeting: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Cairo-Bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#9ca3af',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Cairo-Bold',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontFamily: 'Cairo',
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 70,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  categoriesList: {
    paddingHorizontal: 8,
  },
  listingsList: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  listingCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listingImage: {
    width: '100%',
    height: 140,
  },
  listingInfo: {
    padding: 10,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Cairo-SemiBold',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'Cairo-Bold',
  },
  listingLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Cairo',
  },
});

export default HomeScreen;
