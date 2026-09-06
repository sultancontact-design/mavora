# 📚 Mavora API Documentation

وثائق واجهة برمجة التطبيقات لمشروع مافورا

API Documentation for Mavora Marketplace

---

## 📋 جدول المحتويات | Table of Contents

- [مقدمة](#-مقدمة-introduction)
- [المصادقة](#-المصادقة-authentication)
- [المستخدمين](#-المستخدمين-users)
- [الإعلانات](#-الإعلانات-listings)
- [الرسائل](#-الرسائل-messages)
- [الدفع](#-الدفع-payments)
- [المحفظة](#-المحفظة-wallet)
- [الإشعارات](#-الإشعارات-notifications)
- [البحث](#-البحث-search)
- [الأخطاء](#-الأخطاء-errors)

---

## 🚀 مقدمة | Introduction

### Base URL

```
Production: https://mavora.ma/api
Staging:    https://staging.mavora.ma/api
Local:      http://localhost:3000/api
```

### المصادقة | Authentication

جميع الطلبات المحمية تتطلب header:

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### الاستجابات | Responses

جميع الاستجابات تتبع هذا التنسيق:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## 🔐 المصادقة | Authentication

### تسجيل الدخول | Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xxx",
      "email": "user@example.com",
      "name": "أحمد محمد",
      "avatar": "https://...",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | بيانات ناقصة أو غير صحيحة |
| 401 | كلمة المرور غير صحيحة |
| 404 | المستخدم غير موجود |
| 429 | الكثير من المحاولات (Rate Limited) |

---

### التسجيل | Register

```http
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "أحمد محمد",
  "phone": "+212600000000"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xxx",
      "email": "user@example.com",
      "name": "أحمد محمد",
      "emailVerified": false
    },
    "message": "تم إنشاء الحساب بنجاح"
  }
}
```

---

### تسجيل الخروج | Logout

```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

### إعادة تعيين كلمة المرور | Password Reset

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني"
}
```

---

### تأكيد إعادة التعيين | Confirm Reset

```http
POST /auth/reset-password/confirm
```

**Request Body:**
```json
{
  "token": "reset_xxx",
  "newPassword": "newSecurePassword123"
}
```

---

## 👥 المستخدمين | Users

### الحصول على الملف الشخصي | Get Profile

```http
GET /api/users/[id]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_xxx",
    "name": "أحمد محمد",
    "email": "user@example.com",
    "phone": "+212600000000",
    "avatar": "https://...",
    "bio": "بائع موثوق...",
    "location": {
      "city": "الدار البيضاء",
      "region": "Casablanca-Settat"
    },
    "stats": {
      "listingsCount": 25,
      "reviewsCount": 48,
      "rating": 4.8,
      "memberSince": "2024-06-15"
    },
    "isVerified": true,
    "isSeller": true
  }
}
```

---

### تحديث الملف الشخصي | Update Profile

```http
PUT /api/users/[id]
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "اسم جديد",
  "bio": "وصف جديد",
  "phone": "+212612345678"
}
```

---

### رفع الصورة الشخصية | Upload Avatar

```http
POST /api/users/[id]/avatar
```

**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data`
- `avatar`: Image file (JPEG, PNG, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://storage.mavora.ma/avatars/usr_xxx.jpg"
  }
}
```

---

## 🛍️ الإعلانات | Listings

### قائمة الإعلانات | List Listings

```http
GET /api/listings
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | رقم الصفحة |
| `limit` | integer | 20 | عدد النتائج |
| `category` | string | - | فلترة بالفئة |
| `city` | string | - | فلترة بالمدينة |
| `minPrice` | number | - | الحد الأدنى للسعر |
| `maxPrice` | number | - | الحد الأقصى للسعر |
| `condition` | string | - | الحالة (new, used, refurbished) |
| `sort` | string | newest | ترتيب (newest, price_low, price_high, popular) |
| `search` | string | - | بحث في العنوان والوصف |

**Example:**
```http
GET /api/listings?category=electronics&city=casablanca&minPrice=100&maxPrice=1000&sort=newest&page=1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "lst_xxx",
        "title": "iPhone 15 Pro Max",
        "description": "جهاز بحالة ممتازة...",
        "price": 14500,
        "currency": "MAD",
        "images": ["https://...", "https://..."],
        "category": {
          "id": "cat_electronics",
          "name": "إلكترونيات",
          "slug": "electronics"
        },
        "location": {
          "city": "الدار البيضاء",
          "region": "Casablanca-Settat"
        },
        "condition": "used",
        "seller": {
          "id": "usr_xxx",
          "name": "أحمد",
          "avatar": "https://...",
          "isVerified": true,
          "rating": 4.8
        },
        "stats": {
          "views": 245,
          "favorites": 18,
          "createdAt": "2025-01-10T14:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### تفاصيل إعلان | Get Listing

```http
GET /api/listings/[id]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "lst_xxx",
    "title": "iPhone 15 Pro Max",
    "description": "جهاز بحالة ممتازة، يستخدم منذ 3 أشهر...",
    "price": 14500,
    "currency": "MAD",
    "negotiable": true,
    "images": [
      { "url": "https://...", "width": 800, "height": 600 },
      { "url": "https://...", "width": 800, "height": 600 }
    ],
    "category": { ... },
    "location": { ... },
    "condition": "used",
    "seller": { ... },
    "specs": {
      "brand": "Apple",
      "model": "iPhone 15 Pro Max",
      "color": "Titanium Blue",
      "storage": "256GB"
    },
    "stats": {
      "views": 245,
      "favorites": 18,
      "shares": 5,
      "createdAt": "2025-01-10T14:30:00Z"
    },
    "isFavorited": false,
    "relatedListings": [...]
  }
}
```

---

### إنشاء إعلان | Create Listing

```http
POST /api/listings/create
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "iPhone 15 Pro Max",
  "description": "جهاز بحالة ممتازة...",
  "price": 14500,
  "categoryId": "cat_smartphones",
  "condition": "used",
  "negotiable": true,
  "location": {
    "city": "casablanca",
    "address": "حي المعاريف"
  },
  "specs": {
    "brand": "Apple",
    "model": "iPhone 15 Pro Max",
    "color": "Titanium Blue",
    "storage": "256GB"
  },
  "imageIds": ["img_xxx", "img_yyy"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "lst_new_xxx",
    "message": "تم إنشاء الإعلان بنجاح",
    "status": "pending_review"
  }
}
```

---

### رفع صور الإعلان | Upload Images

```http
POST /api/listings/upload-images
```

**Headers:** 
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
- `images`: Array of image files (max 10, each max 5MB)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadedImages": [
      { "id": "img_xxx", "url": "https://...", "width": 800, "height": 600 },
      { "id": "img_yyy", "url": "https://...", "width": 800, "height": 600 }
    ]
  }
}
```

---

### تحديث إعلان | Update Listing

```http
PUT /api/listings/[id]
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:** نفس إنشاء إعلان (حقوق اختيارية)

---

### حذف إعلان | Delete Listing

```http
DELETE /api/listings/[id]
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "تم حذف الإعلان بنجاح"
}
```

---

## 💬 الرسائل | Messages

### قائمة المحادثات | Get Conversations

```http
GET /api/conversations
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | رقم الصفحة |
| `limit` | integer | عدد النتائج |
| `search` | string | بحث في المحادثات |
| `sort` | string | ترتيب (recent, unread) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_xxx",
        "participant": {
          "id": "usr_yyy",
          "name": "سارة أحمد",
          "avatar": "https://..."
        },
        "listing": {
          "id": "lst_xxx",
          "title": "iPhone 15 Pro Max",
          "image": "https://..."
        },
        "lastMessage": {
          "content": "هل لا يزال المتاح؟",
          "createdAt": "2025-01-15T10:30:00Z",
          "isOwn": false
        },
        "unreadCount": 2,
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### رسائل محادثة | Get Messages

```http
GET /api/conversations/[id]/messages
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | رقم الصفحة |
| `limit` | integer | 50 | عدد الرسائل |
| `before` | string | - | رسائل قبل هذا التاريخ |

---

### إرسال رسالة | Send Message

```http
POST /api/conversations/[id]/messages
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "مرحباً، هل المنتج لا يزال متاحاً؟"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg_xxx",
      "content": "مرحباً، هل المنتج لا يزال متاحاً؟",
      "createdAt": "2025-01-15T10:35:00Z"
    }
  }
}
```

---

## 💳 الدفع | Payments

### إنشاء طلب دفع PayPal | Create PayPal Order

```http
POST /api/payments/paypal/create-order
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "listingId": "lst_xxx",
  "amount": 14500,
  "currency": "MAD",
  "returnUrl": "https://mavora.ma/payment/success",
  "cancelUrl": "https://mavora.ma/payment/cancel"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "pay_xxx",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=xxx"
  }
}
```

---

### التقاط دفع PayPal | Capture Payment

```http
POST /api/payments/paypal/capture
```

**Request Body:**
```json
{
  "orderId": "pay_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "pmt_xxx",
    "status": "completed",
    "amount": 14500,
    "currency": "MAD",
    "paypalTransactionId": "XXX-XXXXX-XXXX-XXXXX"
  }
}
```

---

### استرداد دفع | Refund Payment

```http
POST /api/payments/refund
```

**Headers:** `Authorization: Bearer <token>` (seller only)

**Request Body:**
```json
{
  "paymentId": "pmt_xxx",
  "reason": "المنتج لا يتطابق مع الوصف"
}
```

---

### webhook PayPal | PayPal Webhook

```http
POST /api/payments/webhook/paypal
```

**Headers:**
```http
PayPal-Transmission-Id: xxx
PayPal-Cert-Id: xxx
PayPal-Transmission-Sig: xxx
PayPal-Transmission-Time: 2025-01-15T10:30:00Z
PayPal-Auth-Algo: SHA256withRSA
```

**Body:** PayPal event payload

---

## 👛 المحفظة | Wallet

### رصيد المحفظة | Get Balance

```http
GET /api/wallet
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 500.00,
    "currency": "MAD",
    "frozenAmount": 100.00,
    "availableBalance": 400.00,
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
}
```

---

### سجل المعاملات | Transaction History

```http
GET /api/wallet/transactions
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | deposit, withdrawal, payment, refund |
| `status` | string | pending, completed, failed |
| `page` | integer | رقم الصفحة |
| `limit` | integer | عدد النتائج |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_xxx",
        "type": "deposit",
        "amount": 200.00,
        "currency": "MAD",
        "status": "completed",
        "description": "إيداع عبر بطاقة",
        "createdAt": "2025-01-14T15:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### طلب سحب | Request Withdrawal

```http
POST /api/wallet/withdraw
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 300.00,
  "method": "bank_transfer",
  "bankDetails": {
    "bankName": "BMCE",
    "accountNumber": "XXXXXXXXXX",
    "iban": "MAXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

---

## 🔔 الإشعارات | Notifications

### قائمة الإشعارات | Get Notifications

```http
GET /api/notifications
```

**Headers:** `Authorization: Bearer <token>**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_xxx",
        "type": "new_message",
        "title": "رسالة جديدة",
        "body": "أرسل لك أحمد رسالة حول إعلانك",
        "data": {
          "conversationId": "conv_xxx",
          "listingId": "lst_xxx"
        },
        "read": false,
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### تعيين كمقروءة | Mark as Read

```http
PUT /api/notifications/[id]/read
```

**Headers:** `Authorization: Bearer <token>`

---

### تعيين الكل كمقروء | Mark All as Read

```http
PUT /api/notifications/read-all
```

**Headers:** `Authorization: Bearer <token>`

---

## 🔍 البحث | Search

### بحث عام | Global Search

```http
GET /api/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | نص البحث (مطلوب) |
| `type` | string | listings, users, categories |
| `category` | string | فلترة بالفئة |
| `city` | string | فلترة بالمدينة |
| `minPrice` | number | الحد الأدنى |
| `maxPrice` | number | الحد الأقصى |
| `page` | integer | رقم الصفحة |

**Example:**
```http
GET /api/search?q=iPhone&category=electronics&city=casablanca
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "query": "iPhone",
    "results": {
      "listings": { ... },
      "users": { ... },
      "categories": { ... }
    },
    "totalResults": 45,
    "suggestions": ["iPhone 15", "iPhone 14", "iPhone case"]
  }
}
```

---

## ❌ الأخطاء | Errors

### تنسيق الخطأ | Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "بيانات غير صحيحة",
    "details": [
      {
        "field": "email",
        "message": "بريد إلكتروني غير صالح"
      }
    ]
  },
  "requestId": "req_abc123"
}
```

### أكواد الأخطاء | Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | بيانات غير صحيحة أو ناقصة |
| `UNAUTHORIZED` | 401 | غير مصرح (token غير صالح) |
| `FORBIDDEN` | 403 | ممنوع الوصول |
| `NOT_FOUND` | 404 | المورد غير موجود |
| `CONFLICT` | 409 | تعارض في البيانات |
| `RATE_LIMITED` | 429 | تجاوز حد الطلبات |
| `SERVER_ERROR` | 500 | خطأ داخلي في الخادم |
| `SERVICE_UNAVAILABLE` | 503 | الخدمة غير متاحة |

---

## 📊 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 10 requests | 15 minutes |
| Search | 60 requests | 15 minutes |
| Listings read | 120 requests | 15 minutes |
| Listings write | 30 requests | 15 minutes |
| Messages | 60 requests | 15 minutes |
| Payments | 10 requests | 15 minutes |

**Response Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312345
```

---

## 🌐 اللغة والدعم | i18n

جميع endpoints تدعم:

```http
Accept-Language: ar-MA
# أو
Accept-Language: fr-MA
```

الاستجابات ستكون باللغة المطلوبة عند التوفر.

---

## 📞 الدعم | Support

للمساعدة التقنية:
- **البريد**: api-support@mavora.ma
- **Documentation**: [docs.mavora.ma](https://docs.mavora.ma)
- **Status Page**: [status.mavora.ma](https://status.mavora.ma)

---

<div align="center">

**آخر تحديث**: 2025-01-15  
**إصدار API**: v1.0.0

[⬆️ العودة للأعلى](#--mavora-api-documentation)

</div>
