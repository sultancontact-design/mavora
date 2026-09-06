# 📚 Mavora API Documentation

## نظرة عامة

مرحباً بك في وثائق API منصة **مافورة**. هذا الدليل يشرح جميع نقاط النهاية (Endpoints) المتاحة، كيفية استخدامها، والأمثلة العملية.

**Base URL**: `https://mavora.ma/api`

**الإصدار الحالي**: v1.0.0

---

## جدول المحتويات

1. [المصادقة](#المصادقة)
2. [المستخدمين](#المستخدمين)
3. [الإعلانات](#الإعلانات)
4. [الفئات](#الفئات)
5. [الرسائل](#الرسائل)
6. [الإشعارات](#الإشعارات)
7. [المحفظة](#المحفظة)
8. [الدفع](#الدفع)
9. [الطلبات](#الطلبات)
10. [لوحة التحكم](#لوحة-التحكم)

---

## المصادقة

جميع الـ APIs المحمية تتطلب **Bearer Token** في header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### الحصول على Token:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## المستخدمين

### GET /api/users/:id

الحصول على معلومات مستخدم.

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://mavora.ma/api/users/user-id
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "أحمد محمد",
  "avatar_url": "https://...",
  "city": "الدار البيضاء",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### PUT /api/users/:id

تحديث بيانات المستخدم.

```http
PUT /api/users/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "اسم جديد",
  "phone": "+212600000000",
  "bio": "نبذة عن المستخدم"
}
```

---

## الإعلانات

### GET /api/listings

قائمة جميع الإعلانات مع دعم الفلترة والترقيم.

**Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category` | string | فلترة حسب الفئة | `electronics` |
| `city` | string | فلترة حسب المدينة | `casablanca` |
| `min_price` | number | السعر الأدنى | `1000` |
| `max_price` | number | السعر الأقصى | `5000` |
| `search` | string | بحث في العنوان والوصف | `iPhone` |
| `sort` | string | ترتيب: `price_asc`, `price_desc`, `newest`, `popular` | `newest` |
| `page` | number | رقم الصفحة | `1` |
| `limit` | عدد النتائج | `20` |

**Example:**
```bash
curl "https://mavora.ma/api/listings?category=electronics&city=casablanca&min_price=1000&sort=newest&page=1&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "iPhone 15 Pro Max",
      "description": "بحالة ممتازة...",
      "price": 12500,
      "currency": "MAD",
      "images": ["url1", "url2"],
      "category": { "id": "uuid", "name": "إلكترونيات", "slug": "electronics" },
      "seller": { "id": "uuid", "name": "أحمد" },
      "location": { "city": "الدار البيضاء", "lat": 33.57, "lng": -7.59 },
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "total_pages": 15
  }
}
```

### POST /api/listings

إنشاء إعلان جديد.

```http
POST /api/listings
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max للبيع",
  "description": "جهاز بحالة ممتازة...",
  "price": 12500,
  "currency": "MAD",
  "category_id": "uuid",
  "city": "casablanca",
  "images": ["base64_or_url..."],
  "custom_fields": {
    "condition": "like_new",
    "brand": "Apple",
    "model": "iPhone 15 Pro Max"
  }
}
```

### GET /api/listings/:id

الحصول على تفاصيل إعلان.

```bash
curl https://mavora.ma/api/listings/listing-id
```

### PUT /api/listings/:id

تحديث إعلان (للبائع فقط).

```http
PUT /api/listings/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "عنوان محدث",
  "price": 12000
}
```

### DELETE /api/listings/:id

حذف إعلان (للبائع أو الأدمن).

```http
DELETE /api/listings/:id
Authorization: Bearer TOKEN
```

### POST /api/listings/:id/favorite

إضافة/إزالة من المفضلة.

```http
POST /api/listings/:id/favorite
Authorization: Bearer TOKEN
```

### GET /api/listings/:id/reviews

الحصول على تقييمات إعلان.

```bash
curl https://mavora.ma/api/listings/listing-id/reviews
```

---

## الفئات

### GET /api/categories

قائمة جميع الفئات.

```bash
curl https://mavora.ma/api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "إلكترونيات",
      "name_en": "Electronics",
      "slug": "electronics",
      "icon": "📱",
      "listing_count": 1250
    }
  ]
}
```

### GET /api/category-fields/:id

الحصول على حقول مخصصة لفئة.

```bash
curl https://mavora.ma/api/category-fields/category-id
```

---

## الرسائل

### GET /api/conversations

قائمة محادثات المستخدم.

```http
GET /api/conversations
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participant": { "id": "...", "name": "محمد" },
      "last_message": "مرحباً، هل المنتج متاح؟",
      "unread_count": 2,
      "updated_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

### POST /api/conversations

إنشاء محادثة جديدة.

```http
POST /api/conversations
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "recipient_id": "user-uuid",
  "listing_id": "listing-uuid",
  "message": "مرحباً، أريد الاستفسار عن المنتج"
}
```

### GET /api/conversations/:id/messages

رسائل محادثة محددة.

```http
GET /api/conversations/:id/messages?page=1&limit=50
Authorization: Bearer TOKEN
```

### POST /api/conversations/:id/messages

إرسال رسالة جديدة.

```http
POST /api/conversations/:id/messages
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "content": "شكراً على ردك!"
}
```

### PUT /api/conversations/:id/read

تعيين المحادثة كمقروءة.

```http
PUT /api/conversations/:id/read
Authorization: Bearer TOKEN
```

---

## الإشعارات

### GET /api/notifications

قائمة إشعارات المستخدم.

```http
GET /api/notifications?type=all&unreadOnly=false&page=1&limit=20
Authorization: Bearer TOKEN
```

**Types:** `message`, `like`, `order`, `review`, `system`, `warning`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "message",
      "title": "رسالة جديدة",
      "body": "أرسل لك محمد رسالة",
      "read": false,
      "data": { "conversation_id": "..." },
      "created_at": "2024-01-15T12:00:00Z"
    }
  ],
  "unread_count": 5
}
```

### GET /api/notifications/unread

عدد الإشعارات غير المقروءة.

```http
GET /api/notifications/unread
Authorization: Bearer TOKEN
```

### PUT /api/notifications/[id]/read

تعيين إشعار كمقروء.

```http
PUT /api/notifications/notification-id/read
Authorization: Bearer TOKEN
```

### PUT /api/notifications/read-all

قراءة جميع الإشعارات.

```http
PUT /api/notifications/read-all
Authorization: Bearer TOKEN
```

---

## المحفظة

### GET /api/wallet

رصيد ومعلومات المحفظة.

```http
GET /api/wallet
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 2500.00,
    "currency": "MAD",
    "frozen_balance": 500.00,
    "available_balance": 2000.00,
    "stats": {
      "total_earned": 15000,
      "total_spent": 12500
    }
  }
}
```

### GET /api/wallet/transactions

سجل المعاملات.

```http
GET /api/wallet/transactions?type=credit&from_date=2024-01-01&to_date=2024-01-31&page=1
Authorization: Bearer TOKEN
```

**Types:** `credit`, `debit`, `freeze`, `unfreeze`, `payout`

---

## الدفع

### POST /api/payments/checkout

إنشاء جلسة دفع.

```http
POST /api/payments/checkout
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "amount": 12500,
  "currency": "MAD",
  "description": "شراء iPhone 15 Pro Max",
  "returnUrl": "https://mavora.ma/payment/success",
  "cancelUrl": "https://mavora.ma/payment/cancel",
  "metadata": {
    "listing_id": "uuid",
    "seller_id": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://checkout.paypal.com/...",
  "paymentId": "pay_xxx",
  "provider": "paypal"
}
```

### POST /api/payments/paypal

إنشاء طلب PayPal.

```http
POST /api/payments/paypal
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "amount": 12500,
  "currency": "MAD",
  "orderId": "order-uuid",
  "description": "Payment for order"
}
```

### POST /api/payments/paypal/webhook

Webhook PayPal (Server-to-Server).

```http
POST /api/payments/paypal/webhook
Content-Type: application/json

// PayPal sends event data automatically
```

---

## الطلبات

### GET /api/orders

قائمة طلبات المستخدم.

```http
GET /api/orders?status=active&page=1
Authorization: Bearer TOKEN
```

### POST /api/orders

إنشاء طلب جديد.

```http
POST /api/orders
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "listing_id": "uuid",
  "quantity": 1,
  "shipping_address": {
    "full_name": "أحمد محمد",
    "phone": "+212600000000",
    "address": "شارع محمد الخامس",
    "city": "الدار البيضاء",
    "postal_code": "20000"
  }
}
```

### GET /api/orders/:id

تفاصيل طلب.

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://mavora.ma/api/orders/order-id
```

---

## لوحة التحكم (Admin)

> ⚠️ تتطلب صلاحيات **Admin**

### GET /api/admin/stats

إحصائيات لوحة التحكم.

```http
GET /api/admin/stats?period=30d
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 15234,
    "total_listings": 45678,
    "total_orders": 12345,
    "revenue": 234567.89,
    "active_users_today": 567,
    "new_listings_today": 89
  }
}
```

### GET /api/admin/users

إدارة المستخدمين.

```http
GET /api/admin/users?status=active&search=ahmed&page=1
Authorization: Bearer ADMIN_TOKEN
```

### PUT /api/admin/users/:id

تحديث مستخدم (تغيير الحالة، إلخ).

```http
PUT /api/admin/users/:id
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "status": "suspended",
  "reason": "انتهاك شروط الاستخدام"
}
```

### GET /api/admin/listings

إدارة الإعلانات.

```http
GET /api/admin/listings?status=pending&reported=true
Authorization: Bearer ADMIN_TOKEN
```

### POST /api/admin/listings/bulk

إجراء جماعي على الإعلانات.

```http
POST /api/admin/listings/bulk
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "action": "approve", // أو reject, delete
  "ids": ["uuid1", "uuid2", "uuid3"],
  "reason": "غير مطابق للشروط"
}
```

### GET /api/admin/reports

تقارير الإبلاغات.

```http
GET /api/admin/reports?status=open&type=spam
Authorization: Bearer ADMIN_TOKEN
```

### GET /api/admin/audit-log

سجل التدقيق.

```http
GET /api/admin/audit-log?action=user_update&from_date=2024-01-01
Authorization: Bearer ADMIN_TOKEN
```

---

## أخطاء شائعة

### Error Response Format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes:

| Code | Description |
|------|-------------|
| 200 | نجاح |
| 201 | تم الإنشاء بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح (مطلوب تسجيل دخول) |
| 403 | ممنوع (صلاحيات غير كافية) |
| 404 | غير موجود |
| 409 | تعارض في البيانات |
| 422 | فشل في التحقق |
| 429 | الكثير من الطلبات (Rate Limited) |
| 500 | خطأ داخلي في الخادم |

### Rate Limiting:

- **العادي**: 100 طلب/دقيقة
- **المصادق**: 200 طلب/دقيقة  
- **Admin**: 300 طلب/دقيقة

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## SDKs والمكتبات

### JavaScript/TypeScript:

```typescript
import { MavoraClient } from '@mavora/sdk';

const client = new MavoraClient({
  baseUrl: 'https://mavora.ma/api',
  token: 'YOUR_TOKEN'
});

// البحث عن إعلانات
const listings = await client.listings.list({
  category: 'electronics',
  city: 'casablanca',
  minPrice: 1000
});

// إنشاء إعلان
const newListing = await client.listings.create({
  title: 'iPhone للبيع',
  price: 12000,
  categoryId: 'uuid'
});
```

### Python:

```python
from mavora import MavoraClient

client = MavoraClient(
    base_url="https://mavora.ma/api",
    token="YOUR_TOKEN"
)

# البحث
listings = client.listings.list(
    category="electronics",
    search="iPhone"
)

# الحصول على مستخدم
user = client.users.get("user-id")
```

---

## Webhooks

### Payment Webhooks:

**PayPal:**
```
POST /api/payments/paypal/webhook
```

**Payoneer:**
```
POST /api/payments/payoneer/webhook
```

**Morocco Payments:**
```
POST /api/payments/webhook/morocco
```

### Event Types:

| Event | Description |
|-------|-------------|
| `payment.completed` | اكتمل الدفع بنجاح |
| `payment.failed` | فشل الدفع |
| `payment.refunded` | تم استرداد المبلغ |
| `order.created` | إنشاء طلب جديد |
| `order.status_changed` | تغيير حالة الطلب |

---

## دعم اللغات

API يدعم لغات متعددة عبر header:

```http
Accept-Language: ar-MA  # العربية (المغرب)
Accept-Language: en     # English
Accept-Language: fr     # Français
```

---

## 📞 المساعدة

- **Documentation**: [docs.mavora.ma](https://docs.mavora.ma)
- **Support Email**: api-support@mavora.ma
- **Status Page**: [status.mavora.ma](https://status.mavora.ma)
- **GitHub Issues**: [github.com/mavora/issues](https://github.com/mavora/issues)

---

**آخر تحديث**: 2026-01-09  
**API Version**: 1.0.0
