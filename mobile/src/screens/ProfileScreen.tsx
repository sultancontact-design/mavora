/**
 * Profile Screen for Mavora Mobile
 * User info, settings links, logout
 * 
 * @module screens/ProfileScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Share,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';

import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { t, setLanguage, getCurrentLanguage, getLanguageInfo, SUPPORTED_LANGUAGES } from '../i18n';
import { formatPrice, formatDate, getInitials } from '../utils/formatting';
import { APP_CONFIG } from '../constants/config';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// ============================================================
// Types
// ============================================================

interface StatsData {
  listings: number;
  followers: number;
  following: number;
  reviews: number;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  icon: string;
  iconColor?: string;
  onPress?: () => void;
  type?: 'toggle' | 'navigation' | 'action' | 'info';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  rightComponent?: React.ReactNode;
  destructive?: boolean;
}

// ============================================================
// Main Component
// ============================================================

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut, isAuthenticated } = useAuth();
  const { colors, isDark, toggleTheme, setLanguage: setThemeLanguage } = useTheme();

  // State
  const [stats, setStats] = useState<StatsData>({
    listings: 0,
    followers: 0,
    following: 0,
    reviews: 0,
  });
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  // Current language
  const currentLang = getCurrentLanguage();
  const langInfo = getLanguageInfo();

  // Fetch user stats
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUserStats();
    }
  }, [user, isAuthenticated]);

  const fetchUserStats = async () => {
    try {
      // In production, fetch from API
      setStats({
        listings: 12,
        followers: 156,
        following: 45,
        reviews: 28,
      });
    } catch (error) {
      console.error('[Profile] Fetch stats error:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              console.error('[Profile] Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle language change
  const handleLanguageChange = async () => {
    const newLang = currentLang === 'ar' ? 'fr' : 'ar';
    await setLanguage(newLang as any);
    setThemeLanguage(newLang as any);
  };

  // Handle share profile
  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `${user?.full_name || user?.username} - مافورا\nhttps://mavora.ma/@${user?.username}`,
      });
    } catch (error) {
      // Silently fail
    }
  };

  // Settings sections configuration
  const getSettingsSections = (): SettingsSection[] => [
    {
      title: '',
      items: [
        {
          id: 'edit_profile',
          label: t('profile.editProfile'),
          icon: 'person-outline',
          iconColor: '#6366f1',
          onPress: () => {},
          type: 'navigation',
        },
        {
          id: 'my_listings',
          label: t('profile.myListings'),
          icon: 'list-outline',
          iconColor: '#22c55e',
          onPress: () => navigation.navigate('SellerDashboard', { sellerId: user?.id || '' }),
          type: 'navigation',
          rightComponent: (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {toArabicNumerals(String(stats.listings))}
              </Text>
            </View>
          ),
        },
        {
          id: 'favorites',
          label: t('profile.favoriteListings'),
          icon: 'heart-outline',
          iconColor: '#ef4444',
          onPress: () => navigation.navigate('Favorites'),
          type: 'navigation',
        },
        {
          id: 'wallet',
          label: t('profile.myWallet'),
          icon: 'wallet-outline',
          iconColor: '#f59e0b',
          onPress: () => navigation.navigate('Wallet'),
          type: 'navigation',
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          id: 'language',
          label: t('settings.language'),
          icon: 'globe-outline',
          iconColor: '#3b82f6',
          onPress: handleLanguageChange,
          type: 'navigation',
          rightComponent: (
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{langInfo.name}</Text>
              <Ionicons name="chevron-back" size={16} color={colors.textTertiary} />
            </View>
          ),
        },
        {
          id: 'dark_mode',
          label: t('settings.darkMode'),
          icon: isDark ? 'moon-outline' : 'sunny-outline',
          iconColor: '#8b5cf6',
          type: 'toggle',
          value: isDark,
          onToggle: toggleTheme,
        },
        {
          id: 'notifications',
          label: t('settings.pushNotifications'),
          icon: 'notifications-outline',
          iconColor: '#ec4899',
          type: 'toggle',
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
      ],
    },
    {
      title: t('settings.support'),
      items: [
        {
          id: 'help',
          label: t('profile.helpCenter'),
          icon: 'help-circle-outline',
          iconColor: '#06b6d4',
          onPress: () => {},
          type: 'navigation',
        },
        {
          id: 'terms',
          label: t('profile.termsConditions'),
          icon: 'document-text-outline',
          iconColor: '#64748b',
          onPress: () => {},
          type: 'navigation',
        },
        {
          id: 'privacy',
          label: t('profile.privacyPolicy'),
          icon: 'shield-checkmark-outline',
          iconColor: '#10b981',
          onPress: () => {},
          type: 'navigation',
        },
        {
          id: 'about',
          label: t('settings.about'),
          icon: 'information-circle-outline',
          iconColor: '#94a3b8',
          onPress: () => {},
          type: 'navigation',
          rightComponent: (
            <Text style={{ color: colors.textTertiary, fontSize: 13, fontFamily: 'Cairo' }}>
              v{APP_CONFIG.version}
            </Text>
          ),
        },
        {
          id: 'share',
          label: t('settings.shareApp'),
          icon: 'share-social-outline',
          iconColor: '#6366f1',
          onPress: handleShareProfile,
          type: 'action',
        },
        {
          id: 'rate',
          label: t('settings.rateApp'),
          icon: 'star-outline',
          iconColor: '#f59e0b',
          onPress: () => {},
          type: 'action',
        },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          label: t('profile.logout'),
          icon: 'log-out-outline',
          iconColor: '#ef4444',
          onPress: handleLogout,
          type: 'action',
          destructive: true,
        },
      ],
    },
  ];

  // Render header section
  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: '#1a1a2e' }]}>
      {/* Background decoration */}
      <View style={styles.headerBgDecoration} />
      
      <View style={styles.headerContent}>
        {/* Avatar */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: user?.avatar_url || 'https://via.placeholder.com/150'
            }}
            style={styles.avatar}
          />
          <View style={styles.editAvatarButton}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Name & Username */}
        <Text style={styles.userName}>
          {user?.full_name || user?.username || t('common.loading')}
        </Text>
        <Text style={styles.userHandle}>
          @{user?.username || 'user'}
        </Text>

        {/* Verification Badge */}
        {user?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
            <Text style={styles.verifiedText}>{t('listingDetail.verifiedSeller')}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleShareProfile}
          >
            <Ionicons name="share-social-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render stats section
  const renderStats = () => (
    <View style={[statsContainer, { backgroundColor: colors.surface }]}>
      <StatItem
        label={t('profile.stats.listings')}
        value={toArabicNumerals(String(stats.listings))}
        icon="list-outline"
        colors={colors}
      />
      <View style={[statsDivider, { backgroundColor: colors.border }]} />
      <StatItem
        label={t('profile.stats.followers')}
        value={toArabicNumerals(String(stats.followers))}
        icon="people-outline"
        colors={colors}
      />
      <View style={[statsDivider, { backgroundColor: colors.border }]} />
      <StatItem
        label={t('profile.stats.following')}
        value={toArabicNumerals(String(stats.following))}
        icon="arrow-forward-outline"
        colors={colors}
      />
      <View style={[statsDivider, { backgroundColor: colors.border }]} />
      <StatItem
        label={t('profile.stats.reviews')}
        value={toArabicNumerals(String(stats.reviews))}
        icon="star-outline"
        colors={colors}
      />
    </View>
  );

  // Render settings item
  const renderItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingsItem,
        { backgroundColor: colors.surface },
        item.destructive && styles.destructiveItem,
      ]}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
    >
      <View style={[styles.itemIconContainer, { backgroundColor: `${item.iconColor}15` }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      
      <Text style={[
        styles.itemLabel,
        { color: item.destructive ? '#ef4444' : colors.text },
      ]}>
        {item.label}
      </Text>

      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
          thumbColor={item.value ? colors.primary : '#f3f4f6'}
          ios_backgroundColor="#e5e7eb"
        />
      ) : (
        <View style={styles.itemRight}>
          {item.rightComponent}
          {(item.type === 'navigation') && !item.rightComponent && (
            <Ionicons name="chevron-back" size={20} color={colors.textTertiary} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  // Render settings section
  const renderSection = (section: SettingsSection, index: number) => (
    <View key={`section-${index}`} style={index > 0 && { marginTop: 24 }}>
      {section.title && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {section.title}
        </Text>
      )}
      <View style={[styles.sectionContainer, { 
        backgroundColor: colors.surface,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          },
          android: {
            elevation: 2,
          },
        }),
      }]}>
        {section.items.map(renderItem)}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderHeader()}
        
        <View style={styles.content}>
          {renderStats()}
          
          {getSettingsSections().map((section, index) => renderSection(section, index))}

          {/* App version at bottom */}
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            {t('profile.version', { version: APP_CONFIG.version })}
          </Text>
          
          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Loading overlay for logout */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

// ============================================================
// Sub-components
// ============================================================

interface StatItemProps {
  label: string;
  value: string;
  icon: string;
  colors: any;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, colors }) => (
  <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
    <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

// ============================================================
// Helper Functions
// ============================================================

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

  // Header
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerBgDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#374151',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Cairo-Bold',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Cairo',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifiedText: {
    color: '#60a5fa',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Cairo',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    marginTop: -20,
    paddingHorizontal: 16,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Cairo',
  },
  statsDivider: {
    width: 1,
    height: 40,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    marginBottom: 10,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sectionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  destructiveItem: {},
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  langBadgeText: {
    fontSize: 13,
    fontFamily: 'Cairo',
    color: '#374151',
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Cairo',
    marginTop: 24,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
