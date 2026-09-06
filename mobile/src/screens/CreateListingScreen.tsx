/**
 * Create Listing Screen for Mavora Mobile
 * Multi-step form, image picker, category selection
 * 
 * @module screens/CreateListingScreen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from 'react-native-vector-icons';
import * as ImagePicker from 'react-native-image-picker';

import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase, ListingCondition, Category } from '../services/SupabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n';
import { formatPrice } from '../utils/formatting';
import { LISTING_CONDITIONS, LISTING_CONFIG, MOROCCAN_CITIES, CATEGORY_ICONS } from '../constants/config';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Step definitions
type CreateStep = 'category' | 'details' | 'photos' | 'pricing' | 'location' | 'review';

interface ListingFormData {
  category_id: string | null;
  title: string;
  description: string;
  condition: ListingCondition | null;
  price: string;
  is_negotiable: boolean;
  is_free: boolean;
  images: string[];
  city: string;
  address: string;
}

const INITIAL_FORM: ListingFormData = {
  category_id: null,
  title: '',
  description: '',
  condition: null,
  price: '',
  is_negotiable: true,
  is_free: false,
  images: [],
  city: '',
  address: '',
};

// Categories data (can be fetched from API)
const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', name_ar: 'إلكترونيات', icon: 'phone-portrait-outline' },
  { id: '2', name: 'Vehicles', name_ar: 'مركبات', icon: 'car-outline' },
  { id: '3', name: 'Property', name_ar: 'عقارات', icon: 'home-outline' },
  { id: '4', name: 'Fashion', name_ar: 'أزياء', icon: 'shirt-outline' },
  { id: '5', name: 'Home & Garden', name_ar: 'المنزل والحديقة', icon: 'bed-outline' },
  { id: '6', name: 'Jobs', name_ar: 'وظائف', icon: 'briefcase-outline' },
  { id: '7', name: 'Services', name_ar: 'خدمات', icon: 'construct-outline' },
  { id: '8', name: 'Animals', name_ar: 'حيوانات', icon: 'paw-outline' },
  { id: '9', name: 'Sports', name_ar: 'رياضة', icon: 'basketball-outline' },
  { id: '10', name: 'Books', name_ar: 'كتب', icon: 'book-outline' },
  { id: '11', name: 'Baby', name_ar: 'أطفال', icon: 'happy-outline' },
  { id: '12', name: 'Other', name_ar: 'أخرى', icon: 'grid-outline' },
];

const STEPS: { key: CreateStep; label: string; icon: string }[] = [
  { key: 'category', label: t('createListing.steps.category'), icon: 'grid-outline' },
  { key: 'details', label: t('createListing.steps.details'), icon: 'document-text-outline' },
  { key: 'photos', label: t('createListing.steps.photos'), icon: 'images-outline' },
  { key: 'pricing', label: t('createListing.steps.pricing'), icon: 'pricetag-outline' },
  { key: 'location', label: t('createListing.steps.location'), icon: 'location-outline' },
  { key: 'review', label: t('createListing.steps.review'), icon: 'checkmark-circle-outline' },
];

// ============================================================
// Main Component
// ============================================================

const CreateListingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Form state
  const [currentStep, setCurrentStep] = useState<CreateStep>('category');
  const [formData, setFormData] = useState<ListingFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
    }
  }, [user]);

  // Update form field
  const updateField = <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Navigation between steps
  const goToNextStep = () => {
    // Validate current step
    if (!validateCurrentStep()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const goToStep = (step: CreateStep) => {
    // Only allow going back to previous steps or to review
    const targetIndex = STEPS.findIndex(s => s.key === step);
    if (targetIndex <= currentStepIndex || step === 'review') {
      setCurrentStep(step);
    }
  };

  // Validation
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'category':
        if (!formData.category_id) {
          newErrors.category = t('validation.required');
        }
        break;

      case 'details':
        if (!formData.title.trim()) {
          newErrors.title = t('createListing.details.titleMin');
        } else if (formData.title.length < LISTING_CONFIG.titleMinLength) {
          newErrors.title = t('createListing.details.titleMin');
        } else if (formData.title.length > LISTING_CONFIG.titleMaxLength) {
          newErrors.title = t('createListing.details.titleMax');
        }

        if (!formData.description.trim()) {
          newErrors.description = t('createListing.details.descriptionMin');
        } else if (formData.description.length < LISTING_CONFIG.descriptionMinLength) {
          newErrors.description = t('createListing.details.descriptionMin');
        }

        if (!formData.condition) {
          newErrors.condition = t('validation.required');
        }
        break;

      case 'photos':
        if (formData.images.length === 0) {
          newErrors.images = t('createListing.photos.minPhotos');
        }
        break;

      case 'pricing':
        if (!formData.is_free && !formData.price.trim()) {
          newErrors.price = t('validation.required');
        } else if (!formData.is_free && parseFloat(formData.price) < LISTING_CONFIG.minPrice) {
          newErrors.price = t('createListing.pricing.minPrice', { amount: toArabicNumerals(String(LISTING_CONFIG.minPrice)) });
        }
        break;

      case 'location':
        if (!formData.city) {
          newErrors.city = t('validation.required');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Image picking
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: LISTING_CONFIG.maxImages - formData.images.length,
      });

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets
          .map(asset => asset.uri)
          .filter(Boolean) as string[];
        
        updateField('images', [...formData.images, ...newImages]);
      }
    } catch (error) {
      console.error('[CreateListing] Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        updateField('images', [...formData.images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('[CreateListing] Camera error:', error);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  // Submit listing
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t('auth.login'), t('auth.login'));
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const imageUrls: string[] = [];
      
      for (const imageUri of formData.images) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const fileName = `${user.id}_${Date.now()}_${imageUrls.length}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('listings')
            .getPublicUrl(fileName);

          imageUrls.push(publicUrlData.publicUrl);
        } catch (error) {
          console.error('[CreateListing] Image upload error:', error);
          // Use placeholder for demo
          imageUrls.push(imageUri);
        }
      }

      // Create listing
      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: formData.is_free ? 0 : parseFloat(formData.price),
        currency: 'MAD',
        images: imageUrls,
        condition: formData.condition,
        is_negotiable: formData.is_negotiable,
        location: {
          city: formData.city,
          address: formData.address || null,
        },
        status: 'active',
      });

      if (error) throw error;

      Alert.alert(
        t('common.success'),
        t('createListing.review.publishSuccess'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('[CreateListing] Submit error:', error);
      Alert.alert(t('errors.generic'), t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return <CategoryStep 
          selected={formData.category_id}
          onSelect={(id) => updateField('category_id', id)}
          error={errors.category}
          colors={colors}
        />;

      case 'details':
        return <DetailsStep 
          data={formData}
          onUpdate={updateField}
          errors={errors}
          colors={colors}
        />;

      case 'photos':
        return <PhotosStep 
          images={formData.images}
          onAddImage={pickImage}
          onTakePhoto={takePhoto}
          onRemoveImage={removeImage}
          error={errors.images}
          colors={colors}
        />;

      case 'pricing':
        return <PricingStep 
          data={formData}
          onUpdate={updateField}
          error={errors.price}
          colors={colors}
        />;

      case 'location':
        return <LocationStep 
          city={formData.city}
          address={formData.address}
          onCitySelect={(city) => updateField('city', city)}
          onAddressChange={(address) => updateField('address', address)}
          error={errors.city}
          colors={colors}
          showCityPicker={showCityPicker}
          setShowCityPicker={setShowCityPicker}
        />;

      case 'review':
        return <ReviewStep 
          data={formData}
          onEdit={goToStep}
          onSubmit={handleSubmit}
          loading={loading}
          colors={colors}
        />;

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => currentStep === 'category' ? navigation.goBack() : goToPrevStep()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={currentStep === 'category' ? 'close' : 'chevron-forward'} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('createListing.title')}
        </Text>
        
        <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>
          {toArabicNumerals(String(currentStepIndex + 1))}/{toArabicNumerals(String(STEPS.length))}
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressScroll}
        >
          {STEPS.map((step, index) => (
            <TouchableOpacity
              key={step.key}
              style={[
                styles.progressStep,
                index <= currentStepIndex && { opacity: 1 },
                index > currentStepIndex && { opacity: 0.4 },
              ]}
              onPress={() => goToStep(step.key)}
              disabled={index > currentStepIndex}
            >
              <View style={[
                styles.stepCircle,
                index < currentStepIndex && styles.stepCircleCompleted,
                index === currentStepIndex && { borderColor: colors.primary, backgroundColor: colors.primary },
              ]}>
                {index < currentStepIndex ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    index === currentStepIndex && { color: '#fff' },
                  ]}>
                    {toArabicNumerals(String(index + 1))}
                  </Text>
                )}
              </View>
              <Text 
                style={[
                  styles.stepLabel,
                  { color: index === currentStepIndex ? colors.primary : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Step Content */}
      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>

      {/* Bottom Actions */}
      {currentStep !== 'review' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={goToNextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStepIndex === STEPS.length - 2 ? t('createListing.steps.review') : t('common.next')}
            </Text>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================================
// Step Components
// ============================================================

// Category Step
interface StepProps {
  colors: any;
}

interface CategoryStepProps extends StepProps {
  selected: string | null;
  onSelect: (id: string) => void;
  error?: string;
}

const CategoryStep: React.FC<CategoryStepProps> = ({ selected, onSelect, error, colors }) => (
  <View style={styles.stepContent}>
    <Text style={[styles.stepTitle, { color: colors.text }]}>
      {t('createListing.categories.selectCategory')}
    </Text>
    <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
      اختر الفئة الأنسب لإعلانك
    </Text>

    <View style={styles.categoriesGrid}>
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryCard,
            { 
              backgroundColor: selected === category.id ? '#eef2ff' : colors.surface,
              borderColor: selected === category.id ? colors.primary : colors.border,
            }
          ]}
          onPress={() => onSelect(category.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIconWrapper,
            { backgroundColor: selected === category.id ? '#c7d2fe' : '#f3f4f6' }
          ]}>
            <Ionicons 
              name={(category.icon || 'grid-outline') as any} 
              size={28} 
              color={selected === category.id ? colors.primary : '#6b7280'} 
            />
          </View>
          <Text style={[
            styles.categoryName,
            { color: selected ? colors.primary : colors.text }
          ]}>
            {category.name_ar}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Details Step
interface DetailsStepProps extends StepProps {
  data: ListingFormData;
  onUpdate: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  errors: Record<string, string>;
}

const DetailsStep: React.FC<DetailsStepProps> = ({ data, onUpdate, errors, colors }) => (
  <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
    <Text style={[styles.stepTitle, { color: colors.text }]}>
      {t('createListing.steps.details')}
    </Text>

    {/* Title Input */}
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {t('createListing.details.title')} *
      </Text>
      <TextInput
        style={[
          styles.textInput,
          { 
            backgroundColor: colors.background, 
            borderColor: errors.title ? '#ef4444' : colors.border,
            color: colors.text,
          }
        ]}
        placeholder={t('createListing.details.titlePlaceholder')}
        placeholderTextColor={colors.textTertiary}
        value={data.title}
        onChangeText={(text) => onUpdate('title', text)}
        maxLength={LISTING_CONFIG.titleMaxLength}
      />
      <View style={styles.charCount}>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {data.title.length}/{LISTING_CONFIG.titleMaxLength}
        </Text>
      </View>
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
    </View>

    {/* Description Input */}
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {t('createListing.details.description')} *
      </Text>
      <TextInput
        style={[
          styles.textAreaInput,
          { 
            backgroundColor: colors.background, 
            borderColor: errors.description ? '#ef4444' : colors.border,
            color: colors.text,
          }
        ]}
        placeholder={t('createListing.details.descriptionPlaceholder')}
        placeholderTextColor={colors.textTertiary}
        value={data.description}
        onChangeText={(text) => onUpdate('description', text)}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={LISTING_CONFIG.descriptionMaxLength}
      />
      <View style={styles.charCount}>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {data.description.length}/{LISTING_CONFIG.descriptionMaxLength}
        </Text>
      </View>
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
    </View>

    {/* Condition Selection */}
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {t('createListing.details.condition')} *
      </Text>
      <View style={styles.conditionGrid}>
        {LISTING_CONDITIONS.map((condition) => (
          <TouchableOpacity
            key={condition.value}
            style={[
              styles.conditionChip,
              {
                backgroundColor: data.condition === condition.value ? '#eef2ff' : colors.background,
                borderColor: data.condition === condition.value ? colors.primary : colors.border,
              }
            ]}
            onPress={() => onUpdate('condition', condition.value as ListingCondition)}
          >
            <View style={[
              styles.conditionRadio,
              { borderColor: data.condition === condition.value ? colors.primary : colors.border }
            ]}>
              {data.condition === condition.value && (
                <View style={[styles.conditionRadioFill, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={{
              color: data.condition === condition.value ? colors.primary : colors.text,
              fontFamily: 'Cairo',
            }}>
              {condition.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
    </View>
  </ScrollView>
);

// Photos Step
interface PhotosStepProps extends StepProps {
  images: string[];
  onAddImage: () => void;
  onTakePhoto: () => void;
  onRemoveImage: (index: number) => void;
  error?: string;
}

const PhotosStep: React.FC<PhotosStepProps> = ({ images, onAddImage, onTakePhoto, onRemoveImage, error, colors }) => (
  <View style={styles.stepContent}>
    <Text style={[styles.stepTitle, { color: colors.text }]}>
      {t('createListing.photos.title')}
    </Text>
    <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
      {t('createListing.photos.maxPhotos', { max: toArabicNumerals(String(LISTING_CONFIG.maxImages)) })}
    </Text>

    {/* Images Grid */}
    <View style={styles.imagesGrid}>
      {images.map((imageUri, index) => (
        <View key={index} style={styles.imageItem}>
          <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => onRemoveImage(index)}
          >
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
          {index === 0 && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>١</Text>
            </View>
          )}
        </View>
      ))}

      {/* Add Photo Buttons */}
      {images.length < LISTING_CONFIG.maxImages && (
        <>
          <TouchableOpacity
            style={[styles.addPhotoButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={onAddImage}
          >
            <Ionicons name="images" size={32} color={colors.textTertiary} />
            <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>
              {t('createListing.photos.chooseFromGallery')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addPhotoButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={onTakePhoto}
          >
            <Ionicons name="camera" size={32} color={colors.textTertiary} />
            <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>
              {t('createListing.photos.takePhoto')}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>

    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Pricing Step
interface PricingStepProps extends StepProps {
  data: ListingFormData;
  onUpdate: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  error?: string;
}

const PricingStep: React.FC<PricingStepProps> = ({ data, onUpdate, error, colors }) => (
  <View style={styles.stepContent}>
    <Text style={[styles.stepTitle, { color: colors.text }]}>
      {t('createListing.pricing.title')}
    </Text>

    {/* Free Toggle */}
    <TouchableOpacity
      style={[styles.freeToggle, { 
        backgroundColor: data.is_free ? '#f0fdf4' : colors.background,
        borderColor: data.is_free ? '#86efac' : colors.border,
      }]}
      onPress={() => onUpdate('is_free', !data.is_free)}
    >
      <View style={[
        styles.checkbox,
        { 
          backgroundColor: data.is_free ? '#22c55e' : 'transparent',
          borderColor: data.is_free ? '#22c55e' : colors.border,
        }
      ]}>
        {data.is_free && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={{ color: data.is_free ? '#16a34a' : colors.text, fontFamily: 'Cairo' }}>
        {t('createListing.pricing.freeItem')}
      </Text>
    </TouchableOpacity>

    {/* Price Input */}
    {!data.is_free && (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          {t('createListing.pricing.price')} *
        </Text>
        <View style={[
          styles.priceInputContainer,
          { 
            backgroundColor: colors.background, 
            borderColor: error ? '#ef4444' : colors.border,
          }
        ]}>
          <TextInput
            style={[styles.priceInput, { color: colors.text }]}
            placeholder={t('createListing.pricing.pricePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={data.price}
            onChangeText={(text) => onUpdate('price', text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
          <Text style={styles.currencyLabel}>{t('common.currency')}</Text>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    )}

    {/* Negotiable Toggle */}
    {!data.is_free && (
      <TouchableOpacity
        style={[styles.negotiableToggle, { 
          backgroundColor: data.is_negotiable ? '#eef2ff' : colors.background,
          borderColor: data.is_negotiable ? colors.primary : colors.border,
        }]}
        onPress={() => onUpdate('is_negotiable', !data.is_negotiable)}
      >
        <View style={[
          styles.checkbox,
          { 
            backgroundColor: data.is_negotiable ? colors.primary : 'transparent',
            borderColor: data.is_negotiable ? colors.primary : colors.border,
          }
        ]}>
          {data.is_negotiable && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text style={{ color: data.is_negotiable ? colors.primary : colors.text, fontFamily: 'Cairo' }}>
          {t('createListing.pricing.negotiable')}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

// Location Step
interface LocationStepProps extends StepProps {
  city: string;
  address: string;
  onCitySelect: (city: string) => void;
  onAddressChange: (address: string) => void;
  error?: string;
  showCityPicker: boolean;
  setShowCityPicker: (show: boolean) => void;
}

const LocationStep: React.FC<LocationStepProps> = ({
  city,
  address,
  onCitySelect,
  onAddressChange,
  error,
  colors,
  showCityPicker,
  setShowCityPicker,
}) => (
  <View style={styles.stepContent}>
    <Text style={[styles.stepTitle, { color: colors.text }]}>
      {t('createListing.location.title')}
    </Text>

    {/* City Selector */}
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {t('createListing.location.city')} *
      </Text>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          { 
            backgroundColor: colors.background, 
            borderColor: error ? '#ef4444' : colors.border,
          }
        ]}
        onPress={() => setShowCityPicker(true)}
      >
        <Text style={{ color: city ? colors.text : colors.textTertiary, fontFamily: 'Cairo' }}>
          {city || t('createListing.location.selectLocation')}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>

    {/* Address Input */}
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {t('createListing.location.address')}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          { 
            backgroundColor: colors.background, 
            borderColor: colors.border,
            color: colors.text,
          }
        ]}
        placeholder={t('createListing.location.addressPlaceholder')}
        placeholderTextColor={colors.textTertiary}
        value={address}
        onChangeText={onAddressChange}
      />
    </View>

    {/* Current Location Button */}
    <TouchableOpacity
      style={[styles.currentLocationButton, { borderColor: colors.primary }]}
      onPress={() => {
        // In production, get current location
        onCitySelect(MOROCCAN_CITIES[0].name);
      }}
    >
      <Ionicons name="locate" size={20} color={colors.primary} />
      <Text style={{ color: colors.primary, fontFamily: 'Cairo', marginLeft: 8 }}>
        {t('createListing.location.useCurrentLocation')}
      </Text>
    </TouchableOpacity>

    {/* City Picker Modal */}
    <Modal visible={showCityPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('createListing.location.city')}
            </Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOROCCAN_CITIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cityOption,
                  city === item.name && { backgroundColor: '#eef2ff' },
                ]}
                onPress={() => {
                  onCitySelect(item.name);
                  setShowCityPicker(false);
                }}
              >
                <Text style={{
                  color: city === item.name ? colors.primary : colors.text,
                  fontFamily: 'Cairo',
                }}>
                  {item.name}
                </Text>
                {city === item.name && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  </View>
);

// Review Step
interface ReviewStepProps extends StepProps {
  data: ListingFormData;
  onEdit: (step: CreateStep) => void;
  onSubmit: () => void;
  loading: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onEdit, onSubmit, loading, colors }) => {
  const selectedCategory = CATEGORIES.find(c => c.id === data.category_id);
  const selectedCondition = LISTING_CONDITIONS.find(c => c.value === data.condition);

  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t('createListing.review.title')}
      </Text>

      {/* Review Items */}
      <ReviewItem
        label={t('createListing.steps.category')}
        value={selectedCategory?.name_ar || '-'}
        step="category"
        onEdit={onEdit}
        colors={colors}
      />
      <ReviewItem
        label={t('createListing.details.title')}
        value={data.title}
        step="details"
        onEdit={onEdit}
        colors={colors}
      />
      <ReviewItem
        label={t('createListing.details.condition')}
        value={selectedCondition?.label || '-'}
        step="details"
        onEdit={onEdit}
        colors={colors}
      />
      <ReviewItem
        label={t('createListing.pricing.price')}
        value={data.is_free ? t('common.free') : formatPrice(parseFloat(data.price) || 0)}
        step="pricing"
        onEdit={onEdit}
        colors={colors}
      />
      <ReviewItem
        label={t('createListing.photos.title')}
        value={`${toArabicNumerals(String(data.images.length))} صورة`}
        step="photos"
        onEdit={onEdit}
        colors={colors}
      />
      <ReviewItem
        label={t('createListing.location.city')}
        value={data.city || '-'}
        step="location"
        onEdit={onEdit}
        colors={colors}
      />

      {/* Images Preview */}
      {data.images.length > 0 && (
        <View style={styles.previewImagesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.images.slice(0, 5).map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.previewImage}
              />
            ))}
            {data.images.length > 5 && (
              <View style={[styles.moreImagesPreview, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Cairo' }}>
                  +{data.images.length - 5}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {t('createListing.review.publish')}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Save Draft Button */}
      <TouchableOpacity
        style={[styles.draftButton, { borderColor: colors.border }]}
        disabled={loading}
      >
        <Text style={{ color: colors.textSecondary, fontFamily: 'Cairo' }}>
          {t('createListing.review.saveDraft')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Review Item Component
interface ReviewItemProps {
  label: string;
  value: string;
  step: CreateStep;
  onEdit: (step: CreateStep) => void;
  colors: any;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ label, value, step, onEdit, colors }) => (
  <TouchableOpacity
    style={[styles.reviewItem, { borderBottomColor: colors.border }]}
    onPress={() => onEdit(step)}
  >
    <View style={styles.reviewItemContent}>
      <Text style={[styles.reviewItemLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.reviewItemValue, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
    <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
  </TouchableOpacity>
);

// Need FlatList import at top level
import { FlatList } from 'react-native';

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  stepIndicator: {
    fontSize: 14,
    fontFamily: 'Cairo',
  },

  // Progress Steps
  progressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  progressScroll: {
    gap: 8,
  },
  progressStep: {
    alignItems: 'center',
    width: 70,
    opacity: 0.4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Cairo-SemiBold',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Cairo',
    textAlign: 'center',
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo',
    marginBottom: 20,
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  categoryIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Cairo-SemiBold',
  },

  // Form Fields
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Cairo',
  },
  textAreaInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Cairo',
    minHeight: 140,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'Cairo',
  },

  // Condition Grid
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  conditionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionRadioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Images Grid
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageItem: {
    position: 'relative',
    width: (SCREEN_WIDTH - 52) / 3,
    height: (SCREEN_WIDTH - 52) / 3,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    left: -8,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Cairo-Bold',
  },
  addPhotoButton: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: (SCREEN_WIDTH - 52) / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  addPhotoText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },

  // Pricing
  freeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  negotiableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    fontFamily: 'Cairo-SemiBold',
    marginLeft: 8,
  },

  // Location
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
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
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  // Review
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reviewItemContent: {
    flex: 1,
    marginRight: 12,
  },
  reviewItemLabel: {
    fontSize: 13,
    fontFamily: 'Cairo',
    marginBottom: 4,
  },
  reviewItemValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Cairo-SemiBold',
  },
  previewImagesContainer: {
    marginVertical: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  moreImagesPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  draftButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    marginTop: 12,
  },

  // Bottom Bar
  bottomBar: {
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
});

export default CreateListingScreen;
