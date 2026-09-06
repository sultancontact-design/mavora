/**
 * Listing Detail Screen for Mavora Mobile
 * Image gallery, seller info, chat button, favorite button
 * 
 * @module screens/ListingDetailScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, Listing, User } from '../services/SupabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n';
import { formatPrice, formatDate, formatPhoneNumber } from '../utils/formatting';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ListingRouteProp = RouteProp<RootStackParamList, 'ListingDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.75;

// ============================================================
// Main Component
// ============================================================

const ListingDetailScreen: React.FC = () => {
  const route = useRoute<ListingRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuth();
  const { colors, isDark } = useTheme();

  // State
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const listingId = route.params?.listingId;

  // Fetch listing data
  useEffect(() => {
    if (listingId) {
      fetchListing();
      checkFavoriteStatus();
    }
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;
      
      if (data) {
        setListing(data);
        
        // Fetch seller info
        if (data.seller_id) {
          await fetchSeller(data.seller_id);
        }

        // Increment view count
        await incrementViewCount(listingId);
      }
    } catch (error) {
      console.error('[ListingDetail] Fetch error:', error);
      // Use mock data for development
      setListing(getMockListing());
      setSeller(getMockSeller());
    } finally {
      setLoading(false);
    }
  };

  const fetchSeller = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (!error && data) {
        setSeller(data);
      }
    } catch (error) {
      console.error('[ListingDetail] Fetch seller error:', error);
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      await supabase.rpc('increment_view_count', { listing_id: id });
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const checkFavoriteStatus = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('listing_id', listingId)
        .single();

      setIsFavorite(!error && !!data);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      Alert.alert(t('auth.login'), t('auth.login'));
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('listing_id', listingId);

        if (!error) {
          setIsFavorite(false);
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            listing_id: listingId,
          });

        if (!error) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('[ListingDetail] Favorite toggle error:', error);
      Alert.alert(t('errors.generic'), t('errors.generic'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    
    try {
      await Share.share({
        message: `${listing.title}\n${formatPrice(listing.price)}\n\nمافورا - سوق المغرب الرقمي`,
        title: listing.title,
      });
    } catch (error) {
      console.error('[ListingDetail] Share error:', error);
    }
  };

  const handleContactSeller = () => {
    if (!currentUser) {
      Alert.alert(t('auth.login'), t('auth.login'));
      return;
    }

    navigation.navigate('Chat', {
      conversationId: `${currentUser.id}-${listing?.seller_id}`,
      userName: seller?.full_name || seller?.username || 'البائع',
      userAvatar: seller?.avatar_url,
    });
  };

  const handleCallSeller = () => {
    if (!seller?.phone) return;
    
    Alert.alert(
      t('listingDetail.callSeller'),
      formatPhoneNumber(seller.phone),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => Linking.openURL(`tel:${seller.phone}`),
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      t('listingDetail.reportListing'),
      'هل تريد الإبلاغ عن هذا الإعلان؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          onPress: () => {
            // Handle report logic
            Alert.alert(t('common.success'), 'تم إرسال البلاغ بنجاح');
          },
        },
      ]
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

  if (!listing) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('errors.notFound')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = Array.isArray(listing.images) 
    ? listing.images 
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <TouchableOpacity
            style={styles.imageContainer}
            activeOpacity={1}
          >
            <Image
              source={{ uri: images[currentImageIndex] || 'https://via.placeholder.com/400x300' }}
              style={styles.listingImage}
              resizeMode="cover"
            />
            
            {/* Image Overlay Gradient */}
            <View style={styles.imageOverlay}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={toggleFavorite}
                  disabled={favoriteLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavorite ? "#ef4444" : "#fff"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleReport}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="flag-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              <Text style={styles.imageIndicatorText}>
                {toArabicNumerals(String(currentImageIndex + 1))} / {toArabicNumerals(String(images.length))}
              </Text>
            </View>
          )}

          {/* Image Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.slice(0, 5).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
              {images.length > 5 && (
                <Text style={styles.moreDotsText}>+{images.length - 5}</Text>
              )}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: colors.surface }]}>
          {/* Price and Title */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>
              {listing.price === 0 ? t('common.free') : formatPrice(listing.price)}
            </Text>
            {listing.is_negotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableBadgeText}>
                  {t('listingDetail.negotiable')}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {listing.title}
          </Text>

          {/* Meta Info */}
          <View style={[styles.metaRow, { borderColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t('listingDetail.postedAt', { date: formatDate(listing.created_at, 'relative') })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t('listingDetail.views', { count: toArabicNumerals(String(listing.view_count || 0)) })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {listing.location?.city || t('app.name')}
              </Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('listingDetail.description')}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {listing.description}
            </Text>
          </View>

          {/* Details Section */}
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('listingDetail.details')}
            </Text>
            
            <DetailRow
              label={t('listingDetail.condition')}
              value={getConditionLabel(listing.condition)}
              colors={colors}
            />
            <DetailRow
              label={t('listingDetail.category')}
              value={listing.category_name_ar || listing.category_name || '-'}
              colors={colors}
            />
          </View>

          {/* Location Section */}
          {listing.location && (
            <View style={[styles.section, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('listingDetail.location')}
              </Text>
              <TouchableOpacity
                style={styles.locationCard}
                onPress={() => navigation.navigate('MapView', {
                  listings: [listing],
                  selectedLocation: listing.location,
                })}
              >
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color="#ef4444" />
                  <View style={styles.locationTextContainer}>
                    <Text style={[styles.locationCity, { color: colors.text }]}>
                      {listing.location.city}
                    </Text>
                    {listing.location.address && (
                      <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                        {listing.location.address}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Seller Info Section */}
          {seller && (
            <View style={[styles.section, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('listingDetail.sellerInfo')}
              </Text>
              
              <TouchableOpacity
                style={styles.sellerCard}
                onPress={() => navigation.navigate('SellerProfile', { sellerId: seller.id })}
              >
                <Image
                  source={{ uri: seller.avatar_url || 'https://via.placeholder.com/100' }}
                  style={styles.sellerAvatar}
                />
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={[styles.sellerName, { color: colors.text }]}>
                      {seller.full_name || seller.username}
                    </Text>
                    {seller.is_verified && (
                      <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                    )}
                  </View>
                  <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
                    {t('listingDetail.memberSince', { date: formatDate(seller.created_at!, 'short') })}
                  </Text>
                  <View style={styles.sellerStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {seller.rating?.toFixed(1) || '5.0'}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {toArabicNumerals(String(seller.total_reviews || 0))} {t('profile.stats.reviews')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom spacing for action bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={handleContactSeller}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>
            {t('listingDetail.chatWithSeller')}
          </Text>
        </TouchableOpacity>
        
        {seller?.phone && (
          <TouchableOpacity
            style={[styles.callButton, { borderColor: colors.primary }]}
            onPress={handleCallSeller}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================
// Sub-components
// ============================================================

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, colors }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
  </View>
);

// ============================================================
// Helper Functions
// ============================================================

function getConditionLabel(condition?: string): string {
  const conditions: Record<string, string> = {
    new: t('listings.conditions.new'),
    like_new: t('listings.conditions.likeNew'),
    good: t('listings.conditions.good'),
    fair: t('listings.conditions.fair'),
    poor: t('listings.conditions.poor'),
  };
  return conditions[condition || ''] || condition || '-';
}

function toArabicNumerals(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
}

// ============================================================
// Mock Data
// ============================================================

function getMockListing(): Listing {
  return {
    id: 'mock-listing-1',
    title: 'آيفون 15 برو ماكس 256 جيجا - حالة ممتازة',
    description: 'آيفون 15 برو ماكس لون تيتانيوم طبيعي، سعة تخزين 256 جيجابايت. الجهاز بحالة ممتازة، بدون أي خدوش أو كسور. يأتي مع العلبة الأصلية والشاحن.\n\nالمواصفات:\n• الشاشة: 6.7 بوصة OLED ProMotion\n• المعالج: A17 Pro\n• الكاميرا: 48 ميجابكسل\n• البطارية: صحية 95%\n\nالسبب للبيع: ترقية للإصدار الأحدث.',
    price: 14500,
    currency: 'MAD',
    category_id: '1',
    category_name: 'Electronics',
    category_name_ar: 'إلكترونيات',
    seller_id: 'seller-1',
    images: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
      'https://picsum.photos/800/600?random=4',
    ],
    location: {
      lat: 33.5731,
      lng: -7.5898,
      city: 'الدار البيضاء',
      address: 'شارع محمد الخامس، وسط المدينة',
    },
    condition: 'like_new',
    status: 'active',
    is_featured: true,
    is_negotiable: true,
    view_count: 234,
    favorite_count: 45,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getMockSeller(): User {
  return {
    id: 'seller-1',
    email: 'seller@mavora.ma',
    username: 'ahmed_vendeur',
    full_name: 'أحمد بن علي',
    avatar_url: 'https://picsum.photos/200/200?random=100',
    phone: '+212661234567',
    is_seller: true,
    is_verified: true,
    rating: 4.8,
    total_reviews: 127,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },

  // Image Gallery
  imageGalleryContainer: {
    position: 'relative',
  },
  imageContainer: {},
  listingImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#f3f4f6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Cairo',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  moreDotsText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Cairo',
    marginLeft: 4,
  },

  // Content
  contentContainer: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
  },

  // Price & Title
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    fontFamily: 'Cairo-Bold',
  },
  negotiableBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  negotiableBadgeText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    lineHeight: 28,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Cairo',
  },

  // Sections
  section: {
    padding: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'Cairo',
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Cairo',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Cairo-SemiBold',
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  locationAddress: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Cairo',
  },

  // Seller
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5e7eb',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  memberSince: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Cairo',
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Cairo',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#d1d5db',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  callButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ListingDetailScreen;
