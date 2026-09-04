/**
 * Coupon & Discount System for Mavora
 * Supports percentage discounts, fixed amount, free shipping, and more
 * 
 * @module lib/promotions/coupons
 */

import crypto from 'crypto';

// ============================================================
// Types & Interfaces
// ============================================================

export enum CouponType {
  PERCENTAGE = 'percentage',     // X% off
  FIXED_AMOUNT = 'fixed_amount', // $X off
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',   // Buy X get Y free
  THRESHOLD = 'threshold',       // Discount after spending $X
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SCHEDULED = 'scheduled',
  DISABLED = 'disabled',
  USED_UP = 'used_up',           // All redemptions used
}

export enum DiscountScope {
  ENTIRE_ORDER = 'entire_order',
  CATEGORY = 'category',
  LISTING = 'listing',
  USER_FIRST_ORDER = 'user_first_order',
  SPECIFIC_USERS = 'specific_users',
}

export interface Coupon {
  id: string;
  code: string;                   // Uppercase code like "WELCOME20"
  type: CouponType;
  value: number;                  // Percentage or fixed amount
  scope: DiscountScope;
  
  // Limits
  maxUses: number;                // Total uses allowed (-1 = unlimited)
  usesCount: number;              // Current use count
  maxUsesPerUser: number;         // Per-user limit (-1 = unlimited)
  
  // Constraints
  minimumOrderAmount?: number;    // Minimum order value
  maximumDiscountAmount?: number; // Cap on discount
  
  // Applicability
  applicableCategories?: string[];   // Category IDs
  applicableListings?: string[];     // Listing IDs
  applicableUsers?: string[];        // User IDs
  
  // Dates
  validFrom: Date;
  validUntil: Date;
  
  // Metadata
  status: CouponStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  description?: string;           // Arabic
  descriptionEn?: string;         // English
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  redeemedAt: Date;
}

export interface CartContext {
  userId: string;
  items: Array<{
    listingId: string;
    categoryId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  isFirstOrder?: boolean;
}

export interface DiscountResult {
  success: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  message?: string;
  messageEn?: string;
  errors?: string[];
}

// ============================================================
// Coupon Manager Class
// ============================================================

class CouponManager {
  private coupons: Map<string, Coupon> = new Map();
  private redemptions: Map<string, CouponRedemption[]> = new Map();

  // ============================================================
  // Coupon CRUD Operations
  // ============================================================

  /**
   * Create a new coupon
   */
  createCoupon(params: {
    code: string;
    type: CouponType;
    value: number;
    scope: DiscountScope;
    maxUses?: number;
    maxUsesPerUser?: number;
    minimumOrderAmount?: number;
    maximumDiscountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    applicableCategories?: string[];
    applicableListings?: string[];
    applicableUsers?: string[];
    createdBy: string;
    description?: string;
    descriptionEn?: string;
  }): Coupon {
    const code = params.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Check if coupon code already exists
    if (this.coupons.has(code)) {
      throw new Error(`Coupon code "${code}" already exists`);
    }

    const coupon: Coupon = {
      id: crypto.randomUUID(),
      code,
      type: params.type,
      value: params.value,
      scope: params.scope,
      maxUses: params.maxUses ?? -1,
      usesCount: 0,
      maxUsesPerUser: params.maxUsesPerUser ?? 1,
      minimumOrderAmount: params.minimumOrderAmount,
      maximumDiscountAmount: params.maximumDiscountAmount,
      applicableCategories: params.applicableCategories,
      applicableListings: params.applicableListings,
      applicableUsers: params.applicableUsers,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      status: CouponStatus.SCHEDULED,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: params.createdBy,
      description: params.description,
      descriptionEn: params.descriptionEn,
    };

    // Set status to active if within valid date range
    const now = new Date();
    if (now >= params.validFrom && now <= params.validUntil) {
      coupon.status = CouponStatus.ACTIVE;
    }

    this.coupons.set(code, coupon);

    console.log(`[Coupons] Created coupon: ${code}`);
    return coupon;
  }

  /**
   * Get coupon by code
   */
  getCoupon(code: string): Coupon | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  /**
   * List all coupons with optional filters
   */
  listCoupons(filters?: {
    status?: CouponStatus;
    type?: CouponType;
    scope?: DiscountScope;
    createdBy?: string;
    limit?: number;
    offset?: number;
  }): Coupon[] {
    let coupons = Array.from(this.coupons.values());

    if (filters?.status) {
      coupons = coupons.filter(c => c.status === filters.status);
    }
    if (filters?.type) {
      coupons = coupons.filter(c => c.type === filters.type);
    }
    if (filters?.scope) {
      coupons = coupons.filter(c => c.scope === filters.scope);
    }
    if (filters?.createdBy) {
      coupons = coupons.filter(c => c.createdBy === filters.createdBy);
    }

    // Sort by creation date (newest first)
    coupons.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    if (filters?.offset) {
      coupons = coupons.slice(filters.offset);
    }
    if (filters?.limit) {
      coupons = coupons.slice(0, filters.limit);
    }

    return coupons;
  }

  /**
   * Update coupon status
   */
  updateCouponStatus(code: string, status: CouponStatus): Coupon | null {
    const coupon = this.coupons.get(code.toUpperCase());
    if (!coupon) return null;

    coupon.status = status;
    coupon.updatedAt = new Date();

    this.coupons.set(code.toUpperCase(), coupon);
    return coupon;
  }

  /**
   * Delete coupon (soft delete by disabling)
   */
  deleteCoupon(code: string): boolean {
    const coupon = this.coupons.get(code.toUpperCase());
    if (!coupon) return false;

    coupon.status = CouponStatus.DISABLED;
    coupon.updatedAt = new Date();
    return true;
  }

  // ============================================================
  // Coupon Validation & Redemption
  // ============================================================

  /**
   * Validate and apply coupon to cart
   */
  validateAndApply(code: string, cart: CartContext): DiscountResult {
    const coupon = this.getCoupon(code);
    
    // Check if coupon exists
    if (!coupon) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: cart.subtotal,
        message: 'كوبون غير صالح',
        messageEn: 'Invalid coupon code',
        errors: ['COUPON_NOT_FOUND'],
      };
    }

    // Run all validations
    const errors = this.validateCoupon(coupon, cart);
    
    if (errors.length > 0) {
      return {
        success: false,
        coupon,
        discountAmount: 0,
        finalAmount: cart.subtotal,
        message: this.getErrorMessage(errors[0], 'ar'),
        messageEn: this.getErrorMessage(errors[0], 'en'),
        errors,
      };
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(coupon, cart);
    const finalAmount = Math.max(0, cart.subtotal - discountAmount);

    return {
      success: true,
      coupon,
      discountAmount,
      finalAmount,
      message: `تم تطبيق الكوبون بنجاح! وفرت ${discountAmount} ${this.getCurrencySymbol()}`,
      messageEn: `Coupon applied successfully! You saved ${discountAmount} ${this.getCurrencySymbol()}`,
    };
  }

  /**
   * Redeem coupon (after order completion)
   */
  redeemCoupon(
    code: string,
    userId: string,
    orderId: string
  ): CouponRedemption | { error: string } {
    const coupon = this.getCoupon(code);
    
    if (!coupon) {
      return { error: 'Coupon not found' };
    }

    // Quick validation
    const now = new Date();
    if (coupon.status !== CouponStatus.ACTIVE) {
      return { error: 'Coupon is not active' };
    }
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { error: 'Coupon has expired' };
    }
    if (coupon.maxUses !== -1 && coupon.usesCount >= coupon.maxUses) {
      return { error: 'Coupon has reached its usage limit' };
    }

    // Check per-user limit
    const userRedemptions = this.getUserRedemptions(coupon.id, userId);
    if (coupon.maxUsesPerUser !== -1 && userRedemptions.length >= coupon.maxUsesPerUser) {
      return { error: 'You have already used this coupon' };
    }

    // Calculate discount (simplified - would need actual cart)
    const discountAmount = coupon.type === CouponType.PERCENTAGE
      ? 100 * (coupon.value / 100) // Example calculation
      : coupon.value;

    const redemption: CouponRedemption = {
      id: crypto.randomUUID(),
      couponId: coupon.id,
      userId,
      orderId,
      discountAmount,
      originalAmount: 100, // Would come from actual order
      finalAmount: 100 - discountAmount,
      redeemedAt: new Date(),
    };

    // Record redemption
    if (!this.redemptions.has(coupon.id)) {
      this.redemptions.set(coupon.id, []);
    }
    this.redemptions.get(coupon.id)!.push(redemption);

    // Update coupon usage count
    coupon.usesCount++;
    
    // Check if coupon is now used up
    if (coupon.maxUses !== -1 && coupon.usesCount >= coupon.maxUses) {
      coupon.status = CouponStatus.USED_UP;
    }
    coupon.updatedAt = new Date();

    console.log(`[Coupons] Redeemed coupon ${code} for user ${userId}`);
    return redemption;
  }

  // ============================================================
  // Private Validation Methods
  // ============================================================

  private validateCoupon(coupon: Coupon, cart: CartContext): string[] {
    const errors: string[] = [];
    const now = new Date();

    // Status check
    if (coupon.status === CouponStatus.DISABLED) {
      errors.push('COUPON_DISABLED');
      return errors; // No point checking further
    }
    if (coupon.status === CouponStatus.EXPIRED || now > coupon.validUntil) {
      errors.push('COUPON_EXPIRED');
      return errors;
    }
    if (coupon.status === CouponStatus.USED_UP) {
      errors.push('COUPON_USED_UP');
      return errors;
    }
    if (now < coupon.validFrom) {
      errors.push('COUPON_NOT_YET_VALID');
    }

    // Usage limits
    if (coupon.maxUses !== -1 && coupon.usesCount >= coupon.maxUses) {
      errors.push('MAX_USES_REACHED');
    }

    const userRedemptions = this.getUserRedemptions(coupon.id, cart.userId);
    if (coupon.maxUsesPerUser !== -1 && userRedemptions.length >= coupon.maxUsesPerUser) {
      errors.push('MAX_USER_USES_REACHED');
    }

    // Minimum order amount
    if (coupon.minimumOrderAmount && cart.subtotal < coupon.minimumOrderAmount) {
      errors.push('MINIMUM_AMOUNT_NOT_MET');
    }

    // Scope validation
    switch (coupon.scope) {
      case DiscountScope.USER_FIRST_ORDER:
        if (!cart.isFirstOrder) {
          errors.push('NOT_FIRST_ORDER');
        }
        break;

      case DiscountScope.SPECIFIC_USERS:
        if (coupon.applicableUsers && !coupon.applicableUsers.includes(cart.userId)) {
          errors.push('USER_NOT_ELIGIBLE');
        }
        break;

      case DiscountScope.CATEGORY:
        if (coupon.applicableCategories) {
          const hasEligibleItem = cart.items.some(item =>
            coupon.applicableCategories!.includes(item.categoryId)
          );
          if (!hasEligibleItem) {
            errors.push('NO_ELIGIBLE_ITEMS');
          }
        }
        break;

      case DiscountScope.LISTING:
        if (coupon.applicableListings) {
          const hasEligibleItem = cart.items.some(item =>
            coupon.applicableListings!.includes(item.listingId)
          );
          if (!hasEligibleItem) {
            errors.push('NO_ELIGIBLE_ITEMS');
          }
        }
        break;
    }

    return errors;
  }

  private calculateDiscount(coupon: Coupon, cart: CartContext): number {
    let discount = 0;

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = cart.subtotal * (coupon.value / 100);
        break;

      case CouponType.FIXED_AMOUNT:
        discount = coupon.value;
        break;

      case CouponType.FREE_SHIPPING:
        // Would calculate shipping cost and subtract it
        discount = 30; // Example: 30 MAD shipping
        break;

      case CouponType.THRESHOLD:
        if (cart.subtotal >= (coupon.minimumOrderAmount || 0)) {
          discount = coupon.value;
        }
        break;

      case CouponType.BUY_X_GET_Y:
        // Complex logic for buy X get Y
        // Simplified: give flat discount
        discount = cart.subtotal * 0.15; // 15% off
        break;
    }

    // Apply maximum discount cap
    if (coupon.maximumDiscountAmount) {
      discount = Math.min(discount, coupon.maximumDiscountAmount);
    }

    // Don't exceed subtotal
    discount = Math.min(discount, cart.subtotal);

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  private getUserRedemptions(couponId: string, userId: string): CouponRedemption[] {
    const redemptions = this.redemptions.get(couponId) || [];
    return redemptions.filter(r => r.userId === userId);
  }

  private getErrorMessage(errorCode: string, lang: 'ar' | 'en'): string {
    const messages: Record<string, { ar: string; en: string }> = {
      COUPON_NOT_FOUND: { ar: 'كوبون غير موجود', en: 'Coupon not found' },
      COUPON_DISABLED: { ar: 'هذا الكوبون معطل', en: 'This coupon is disabled' },
      COUPON_EXPIRED: { ar: 'هذا الكوبون منتهي الصلاحية', en: 'This coupon has expired' },
      COUPON_USED_UP: { ar: 'تم استهلاك جميع استخدامات هذا الكوبون', en: 'All uses of this coupon have been redeemed' },
      COUPON_NOT_YET_VALID: { ar: 'هذا الكوبون غير فعال بعد', en: 'This coupon is not yet valid' },
      MAX_USES_REACHED: { ar: 'تم الوصول للحد الأقصى من الاستخدامات', en: 'Maximum uses reached' },
      MAX_USER_USES_REACHED: { ar: 'لقد استخدمت هذا الكوبون بالفعل', en: 'You have already used this coupon' },
      MINIMUM_AMOUNT_NOT_MET: { ar: 'لم يتم تحديد الحد الأدنى للطلب', en: 'Minimum order amount not met' },
      NOT_FIRST_ORDER: { ar: 'هذا الكوبون للطلب الأول فقط', en: 'This coupon is for first orders only' },
      USER_NOT_ELIGIBLE: { ar: 'لست مؤهلاً لاستخدام هذا الكوبون', en: 'You are not eligible for this coupon' },
      NO_ELIGIBLE_ITEMS: { ar: 'لا توجد منتجات مؤهلة في السلة', en: 'No eligible items in cart' },
    };

    return messages[errorCode]?.[lang] || errorCode;
  }

  private getCurrencySymbol(): string {
    return 'MAD'; // Moroccan Dirham
  }

  // ============================================================
  // Statistics & Reporting
  // ============================================================

  /**
   * Get coupon statistics
   */
  getCouponStats(code: string): {
    coupon: Coupon | undefined;
    totalRedemptions: number;
    totalDiscountGiven: number;
    uniqueUsers: number;
  } | null {
    const coupon = this.getCoupon(code);
    if (!coupon) return null;

    const redemptions = this.redemptions.get(coupon.id) || [];
    const totalDiscountGiven = redemptions.reduce((sum, r) => sum + r.discountAmount, 0);
    const uniqueUsers = new Set(redemptions.map(r => r.userId)).size;

    return {
      coupon,
      totalRedemptions: redemptions.length,
      totalDiscountGiven,
      uniqueUsers,
    };
  }

  /**
   * Generate a random coupon code
   */
  static generateCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

// Singleton instance
export const couponManager = new CouponManager();

// Export class for testing
export { CouponManager };

export default couponManager;
