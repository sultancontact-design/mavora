# 📚 Mavora API Documentation

## نظرة عامة على API

مرحباً في وثائق API منصة **Mavora** للإعلانات المبوبة. هذا الدليل يشرح جميع نقاط النهاية المتاحة للمطورين الخارجيين.

### Base URL

```
Production: https://api.mavora.ma/v1
Staging: https://staging-api.mavora.ma/v1
Local: http://localhost:3000/api
```

### المصادقة (Authentication)

جميع الطلبات المحمية تتطلب **Bearer Token** في header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### الحصول على Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "xxx", "email": "..." },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 📋 جدول المحتويات

- [المصادقة](#-مصادقة-authentication)
- [الإعلانات](#-الإعلانات-listings)
- [الفئات](#-الفئات-categories)
- [الرسائل](#-الرسائل-messages)
- [المستخدمون](#-المستخدمون-users)
- [المحفظة والدفع](#-المحفظة-والدفع-wallet--payments)
- [الإشعارات](#-الإشعارات-notifications)
- [الإدارة](#-الإدارة-admin)
- [أكواد الأخطاء](#-أكواد-الأخطاء-error-codes)

---

## 🔐 المصادقة (Authentication)

### `POST /auth/login` - تسجيل الدخول

تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور.

**Request Body:**
| الحقل | نوع | مطلوب | الوصف |
|-------|------|--------|-------|
| email | string | ✅ | البريد الإلكتروني |
| password | string | ✅ | كلمة المرور |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xxx",
      "email": "user@example.com",
      "displayName": "اسم المستخدم",
      "avatar": "https://...",
      "role": "user",
      "isVerified": true,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
| Code | Status | الوصف |
|------|--------|-------|
| INVALID_CREDENTIALS | 401 | بيانات الدخول غير صحيحة |
| ACCOUNT_SUSPENDED | 403 | الحساب معلق |
| VALIDATION_ERROR | 400 | بيانات ناقصة أو غير صالحة |

---

### `POST /auth/signup` - إنشاء حساب جديد

**Request Body:**
| الحقل | نوع | مطلوب | الوصف |
|-------|------|--------|-------|
| email | string | ✅ | البريد الإلكتروني |
| password | string | ✅ | كلمة المرور (8+ أحرف) |
| displayName | string | ✅ | اسم العرض |
| phone | string | ❌ | رقم الهاتف |

**Password Requirements:**
- 8 أحرف على الأقل
- حرف كبير واحد على الأقل
- حرف صغير واحد على الأقل
- رقم واحد على الأقل
- رمز خاص واحد على الأقل

---

### `POST /auth/reset-password` - طلب إعادة تعيين كلمة المرور

**Request Body:**
| الحقل | نوع | مطلوب |
|-------|------|--------|
| email | string | ✅ |

**ملاحظة أمنية:** دائماً يعيد `{ success: true }` حتى إذا كان البريد غير مسجل (لمنع تعداد البريد).

---

### `PUT /auth/reset-password` - تأكيد كلمة المرور الجديدة

**Request Body:**
| الحقل | نوع | مطلوب |
|-------|------|--------|
| token | string | ✅ |
| password | string | ✅ |
| confirmPassword | string | ✅ |

---

### `GET /auth/session` - التحقق من الجلسة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "expiresAt": "2025-01-31T00:00:00Z"
  }
}
```

**Response 401:** غير مصدق (لا توجد جلسة صالحة)

---

### `POST /auth/logout` - تسجيل الخروج

**Response 200:**
```json
{ "success": true, "message": "تم تسجيل الخروج بنجاح" }
```

---

## 🏪 الإعلانات (Listings)

### `GET /listings` - قائمة الإعلانات

الحصول على قائمة الإعلانات مع دعم البحث والفلترة والترقيم.

**Query Parameters:**
| المعامل | نوع | افتراضي | الوصف |
|---------|------|---------|-------|
| page | number | 1 | رقم الصفحة |
| limit | number | 20 | عدد النتائج في الصفحة |
| search | string | - | البحث في العنوان والوصف |
| category | string | - | فلتر حسب الفئة |
| city | string | - | فلتر حسب المدينة |
| condition | string | - | new / used / like_new |
| min_price | number | - | الحد الأدنى للسعر |
| max_price | number | -د | الحد الأقصى للسعر |
| sort | string | created_at | ترتيب: price_asc, price_desc, created_at, views |
| lat | number | - | خط العرض (للبحث القريب) |
| lng | number | - | خط الطول (للبحث القريب) |
| radius | number | 50 | نصف القطر بالكيلومتر |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "lst_xxx",
        "title": "iPhone 15 Pro Max",
        "description": "...",
        "price": 12000,
        "currency": "MAD",
        "category": { "id": "cat_xxx", "name": "إلكترونيات", "slug": "electronics" },
        "condition": "like_new",
        "city": "الدار البيضاء",
        "location": { "lat": 33.5731, "lng": -7.5898 },
        "images": ["https://..."],
        "seller": {
          "id": "usr_xxx",
          "displayName": "محمد علي",
          "avatar": "https://...",
          "isVerified": true,
          "rating": 4.8
        },
        "stats": {
          "views": 567,
          "likes": 45,
          "messages": 12
        },
        "createdAt": "2025-01-10T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### `GET /listings/:id` - تفاصيل إعلان

**Response 200:**
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "lst_xxx",
      "title": "...",
      "description": "...",
      "price": 12000,
      "currency": "MAD",
      // ... جميع حقول الإعلان
      "customFields": [
        { "name": "اللون", "value": "أسود", "type": "select" },
        { "name": "سنة الصنع", "value": "2023", "type": "number" }
      ],
      "reviews": [...],
      "similarListings": [...]
    }
  }
}
```

**Errors:**
| Code | Status | الوصف |
|------|--------|-------|
| NOT_FOUND | 404 | الإعلان غير موجود |

---

### `POST /listings` - إنشاء إعلان جديد

**Requires Authentication:** ✅

**Request Body:**
```json
{
  "title": "iPhone 15 Pro Max",
  "description": "جديد في العلبة، ضمان سنة",
  "price": 12000,
  "currency": "MAD",
  "categoryId": "cat_xxx",
  "condition": "like_new",
  "city": "الدار البيضاء",
  "location": { "lat": 33.5731, "lng": -7.5898 },
  "images": ["base64..."],
  "customFields": { "color": "أسود" },
  "tags": ["iphone", "apple"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "listing": { "id": "lst_new", ... } },
  "message": "تم إنشاء الإعلان بنجاح"
}
```

---

### `PUT /listings/:id` - تحديث إعلان

**Requires Authentication:** ✅  
**Permission:** يجب أن يكون المستخدم هو البائع

---

### `DELETE /listings/:id` - حذف إعلان

**Requires Authentication:** ✅  
**Permission:** يجب أن يكون المستخدم هو البائع أو مشرف

**Response 200:**
```json
{ "success": true, "message": "تم حذف الإعلان" }
```

---

### `POST /listings/:id/favorite` - إضافة للمفضلة

**Requires Authentication:** ✅

**Response 200:**
```json
{ "success": true, "message": "تمت الإضافة إلى المفضلة" }
```

**Response 409:** مضاف بالفعل

---

### `DELETE /listings/:id/favorite` - إزالة من المفضلة

**Requires Authentication:** ✅

---

### `GET /listings/:id/reviews` - تقييمات الإعلان

**Query Parameters:**
| المعامل | نوع | الوصف |
|---------|------|-------|
| page | number | رقم الصفحة |
| limit | number | عدد النتائج |
| sort | new | ترتيب: new, helpful, rating |

---

### `POST /listings/:id/reviews` - إضافة تقييم

**Requires Authentication:** ✅

**Request Body:**
```json
{
  "rating": 5,
  "comment": "منتج رائع، البائع موثوق!",
  "pros": ["سرعة التوصيل", "جودة المنتج"],
  "cons": []
}
```

**Validation:**
- `rating`: 1-5 (مطلوب)
- `comment`: 10-2000 حرف

---

## 📂 الفئات (Categories)

### `GET /categories` - قائمة الفئات

**Response 200:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_xxx",
        "name": "إلكترونيات",
        "nameEn": "Electronics",
        "slug": "electronics",
        "icon": "smartphone",
        "image": "https://...",
        "parentId": null,
        "childrenCount": 5,
        "listingsCount": 1234
      }
    ]
  }
}
```

### `GET /categories/:slug` - تفاصيل فئة

يعرض الفئة مع الفئات الفرعية والإعلانات فيها.

### `GET /categories/:slug/fields` - حقول فئة مخصصة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "id": "field_xxx",
        "name": "اللون",
        "nameEn": "Color",
        "type": "select",
        "required": false,
        "options": ["أسود", "أبيض", "ذهبي", "أحمر"]
      }
    ]
  }
}
```

---

## 💬 الرسائل (Messages)

### `GET /conversations` - قائمة المحادثات

**Requires Authentication:** ✅

**Query Parameters:**
| المعامل | نوع | الوصف |
|---------|------|-------|
| page | number | رقم الصفحة |
| limit | number | عدد النتائج |
| search | بحث | بحث في المحادثات |
| sort | string | ترتيب: last_message, created_at |
| unread | boolean | فلتر غير المقروء فقط |

---

### `POST /conversations` - إنشاء محادثة جديدة

**Requires Authentication:** ✅

**Request Body:**
```json
{
  "recipientId": "usr_xxx",
  "listingId": "lst_xxx",
  "message": "مرحباً، هل المنتج لا يزال متاحاً؟"
}
```

---

### `GET /conversations/:id` - تفاصيل محادثة

**Response 200:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv_xxx",
      "participants": [
        { "id": "usr_1", "displayName": "أحمد", "avatar": "..." },
        { "id": "usr_2", "displayName": "محمد", "avatar": "..." }
      ],
      "listing": { "id": "lst_xxx", "title": "..." },
      "lastMessage": { "content": "...", "createdAt": "..." },
      "unreadCount": 2,
      "messages": [...]
    }
  }
}
```

---

### `GET /conversations/:id/messages` - رسائل المحادثة

**Query Parameters:** page, limit

---

### `POST /conversations/:id/messages` - إرسال رسالة

**Requires Authentication:** ✅

**Request Body:**
```json
{ "content": "شكراً على الرد!" }
```

**Validation:**
- `content`: 1-5000 حرف (مطلوب)

---

### `PUT /conversations/:id/read` - تعيين كمقروء

**Requires Authentication:** ✅

---

### `POST /conversations/:id/report` - الإبلاغ عن محادثة

**Requires Authentication:** ✅

**Request Body:**
```json
{
  "reason": "spam",
  "description": "يرسل رسائل spam بشكل متكرر"
}
```

---

### `DELETE /conversations/:id` - حذف/إخفاء محادثة

**Requires Authentication:** ✅

---

## 👤 المستخدمون (Users)

### `GET /users/:id` - بيانات مستخدم

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xxx",
      "displayName": "محمد علي",
      "email": "m***@example.com",
      "phone": "+2126XXXXXXXX",
      "avatar": "https://...",
      "bio": "بائع موثوق منذ 2020",
      "location": "الدار البيضاء، المغرب",
      "joinedAt": "2024-01-01",
      "isVerified": true,
      "rating": 4.8,
      "totalReviews": 125,
      "responseRate": 95,
      "responseTime": "خلال ساعة",
      "stats": {
        "totalListings": 24,
        "activeListings": 18,
        "totalSales": 156
      }
    }
  }
}
```

### `PUT /users/:id` - تحديث بيانات المستخدم

**Requires Authentication:** ✅ (الملك فقط)

**Request Body:**
```json
{
  "displayName": "اسم جديد",
  "phone": "+2126XXXXXXXX",
  "bio": "نص جديد",
  "avatar": "base64..."
}
```

---

### `GET /users/:id/listings` - إعلانات المستخدم

### `GET /users/:id/reviews` -> تقييمات المستخدم كبائع

---

## 💰 المحفظة والدفع (Wallet & Payments)

### `GET /wallet` - رصيد المحفظة

**Requires Authentication:** ✅

**Response 200:**
```json
{
  "success": true,
  "data": {
    "balance": 2500.00,
    "currency": "MAD",
    "pendingPayout": 750.00,
    "frozen": 0.00,
    "lastUpdated": "2025-01-11T12:00:00Z"
  }
}
```

---

### `GET /wallet/transactions` - سجل المعاملات

**Requires Authentication:** ✅

**Query Parameters:** page, limit, type (deposit, withdrawal, payment, refund), start_date, end_date

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_xxx",
        "type": "payment_received",
        "amount": 12000,
        "currency": "MAD",
        "balanceAfter": 2500,
        "description": "دفع مقابل iPhone 15 Pro Max",
        "referenceId": "ord_xxx",
        "status": "completed",
        "createdAt": "2025-01-10T14:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### `POST /payments/checkout` - إنشاء عملية دفع

**Requires Authentication:** ✅

**Request Body:**
```json
{
  "amount": 12000,
  "currency": "MAD",
  "paymentMethod": "card",
  "listingId": "lst_xxx",
  "description": "دفع مقابل iPhone 15 Pro Max"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "amount": 12000,
    "currency": "MAD",
    "status": "pending",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

### `GET /payments/:id` - حالة دفع

---

### `POST /payments/webhook/stripe` - Webhook Stripe

**Internal endpoint** - يستقبل إشعارات Stripe.

---

## 🔔 الإشعارات (Notifications)

### `GET /notifications` - قائمة الإشعارات

**Requires Authentication:** ✅

**Query Parameters:** page, limit, type, is_read

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_xxx",
        "type": "new_message",
        "title": "رسالة جديدة",
        "body": "أحمد أرسل لك رسالة",
        "data": { "conversationId": "conv_xxx" },
        "isRead": false,
        "actionUrl": "/messages/conv_xxx",
        "createdAt": "2025-01-11T15:30:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### `GET /notifications/unread` - عدد الإشعارات غير المقروءة

**Response 200:**
```json
{ "success": true, "data": { "count": 5 } }
```

---

### `PUT /notifications/:id` - تعيين كمقروء

### `POST /notifications/read-all` - تعيين الكل كمقروء

### `DELETE /notifications/:id` - حذف إشعار

---

### `GET /notifications/stream` - stream الإشعارات الفورية (SSE)

**Requires Authentication:** ✅

**Response:** Server-Sent Events stream

```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { 'Authorization': 'Bearer TOKEN' }
});

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
};
```

---

## ⚙️ الإدارة (Admin)

> **Note:** جميع نقاط النهاية هذه تتطلب دور **admin** أو **moderator**

### `GET /admin/stats` - إحصائيات النظام

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 15420,
    "activeUsersToday": 1234,
    "totalListings": 45678,
    "activeListings": 38765,
    "totalOrders": 8934,
    "revenue": { "monthly": 234000, "today": 8500 },
    "pendingReviews": 45,
    "reportedContent": 12
  }
}
```

---

### `GET /admin/users` - إدارة المستخدمين

**Query Parameters:** page, limit, search, status (active, suspended, banned), role, sort, start_date, end_date

### `PUT /admin/users/:id` - تحديث مستخدم (تعليق/حظر/إلغاء حظر)

---

### `GET /admin/listings` - إدارة الإعلانات

**Query Parameters:** page, limit, search, status (pending, active, rejected, sold, expired), category, sort

### `PUT /admin/listings/bulk` - عمليات جماعية على الإعلانات

**Request Body:**
```json
{
  "action": "approve", // approve, reject, delete, feature
  "ids": ["lst_1", "lst_2", "lst_3"],
  "reason": "سبب الرفض (للرفض فقط)"
}
```

---

### `GET /admin/reports` - تقارير المحتوى المبلغ عنه

### `GET /admin/audit-logs` - سجل التدقيق

---

## 🌐 موارد أخرى

### `GET /cities` - قائمة المدن المدعومة

### `GET /countries` - قائمة الدول

### `GET /currencies` - العملات المدعومة

### `GET /plans` - خطط الاشتراك

### `GET /token-packages` - باقات الرموز

### `GET /health` - فحص صحة الخادم

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T16:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "database": "connected",
  "cache": "connected"
}
```

---

## ❌ أكواد الأخطاء (Error Codes)

| الكود | HTTP Status | الوصف |
|-------|------------|-------|
| SUCCESS | 200 | العملية نجحت |
| CREATED | 201 | تم الإنشاء بنجاح |
| NO_CONTENT | 204 | تم الحذف/التحديث بنجاح |
| BAD_REQUEST | 400 | بيانات غير صالحة أو ناقصة |
| UNAUTHORIZED | 401 | غير مصدق (مطلوب تسجيل الدخول) |
| FORBIDDEN | 403 | ممنوع (عدم وجود صلاحية) |
| NOT_FOUND | 404 | المورد غير موجود |
| CONFLICT | 409 | تعارض (موجود بالفعل) |
| RATE_LIMITED | 429 | تجاوز حد الطلبات |
| INTERNAL_ERROR | 500 | خطأ داخلي في الخادم |
| SERVICE_UNAVAILABLE | 503 | الخادم غير مت مؤقتياً |

**تنسيق الخطأ:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رسالة خطأ واضحة للمستخدم",
    "details": [...] // اختياري: تفاصيل إضافية للتطويرين
  }
}
```

---

## 📊 Rate Limiting (تقييد المعدل)

| Endpoint | Limit | Window |
|---------|-------|--------|
| `/auth/login` | 5 requests | per hour |
| `/auth/signup` | 3 requests | per hour |
| `/auth/reset-password` | 5 requests | per hour |
| `/listings` | 100 requests | per minute |
| `/api/*` (general) | 60 requests | per minute |

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

---

## 🔄 Pagination

جميع endpoints التي تدعم pagination تستخدم نفس التنسيق:

**Request:**
```
GET /listings?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

## 🌍 التدويل (i18n)

استخدم header `Accept-Language` لتحديد لغة الاستجابة:

```
Accept-Language: ar,fr,en;q=0.9
```

اللغات المدعومة:
- `ar` - العربية (افتراضي)
- `en` - الإنجليزية
- `fr` - الفرنسية

---

## 📞 الدعم والمساعدة

- **الوثائق**: https://docs.mavora.ma
- **البريد الإلكتروني**: api-support@mavora.ma
- **GitHub Issues**: https://github.com/sultancontact-design/mavora/issues
- **Status Page**: https://status.mavora.ma

---

**آخر تحديث**: 2025-01-11  
**إصدار API**: v1.0.0
