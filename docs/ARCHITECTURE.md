# MAVORA Architecture

## 🏗️ البنية العامة

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare CDN                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                          │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────┐  │
│  │ Marketplace│  │  Vendor  │  │       Admin Panel       │  │
│  │   (SSR)   │  │  Portal  │  │        (SSR)            │  │
│  └───────────┘  └───────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes                      │   │
│  │  /api/auth  /api/listings  /api/users  /api/payments│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │   Prisma     │  │    Auth      │  │    Storage     │    │
│  │    ORM       │  │ NextAuth.js  │  │  Local / R2    │    │
│  └──────────────┘  └──────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              SQLite (Dev) / PostgreSQL (Prod)      │    │
│  │         RLS Enabled | Migrations | Seeds           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📁 هيكل الملفات التفصيلي

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (marketplace)/
│   │   ├── page.tsx                 # الصفحة الرئيسية
│   │   ├── listing/[id]/page.tsx    # تفاصيل الإعلان
│   │   ├── category/[slug]/page.tsx # تصنيف محدد
│   │   ├── search/page.tsx          # صفحة البحث
│   │   └── layout.tsx              # Layout السوق
│   │
│   ├── vendor/
│   │   ├── dashboard/page.tsx      # لوحة البائع
│   │   ├── listings/page.tsx       # إعلاناتي
│   │   ├── messages/page.tsx       # الرسائل
│   │   ├── settings/page.tsx       # الإعدادات
│   │   └── layout.tsx             # Layout البائع
│   │
│   ├── admin/
│   │   ├── dashboard/page.tsx      # لوحة Admin
│   │   ├── users/page.tsx          # إدارة المستخدمين
│   │   ├── listings/page.tsx       # إدارة الإعلانات
│   │   ├── moderation/page.tsx     # المراجعة
│   │   ├── payments/page.tsx       # المدفوعات
│   │   └── settings/page.tsx       # إعدادات النظام
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── listings/route.ts
│   │   ├── listings/[id]/route.ts
│   │   ├── users/route.ts
│   │   ├── categories/route.ts
│   │   ├── messages/route.ts
│   │   ├── payments/route.ts
│   │   └── upload/route.ts
│   │
│   ├── layout.tsx                  # Root Layout
│   ├── page.tsx                    # Redirect to marketplace
│   └── globals.css                 # Global Styles
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── marketplace/
│   │   ├── ListingCard.tsx
│   │   ├── ListingForm.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── ImageGallery.tsx
│   ├── vendor/
│   │   ├── VendorSidebar.tsx
│   │   ├── StatsCard.tsx
│   │   └── ListingTable.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── UsersTable.tsx
│   │   └── ModerationQueue.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Navigation.tsx
│       ├── LanguageSwitcher.tsx
│       └── ThemeProvider.tsx
│
├── lib/
│   ├── db.ts                       # Prisma Client
│   ├── auth.ts                     # NextAuth config
│   ├── utils.ts                    # Utility functions
│   ├── validations/                # Zod schemas
│   │   ├── listing.ts
│   │   ├── user.ts
│   │   └── auth.ts
│   └── constants/
│       ├── countries.ts
│       ├── categories.ts
│       └── currencies.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
│
└── types/
    ├── index.ts
    ├── listing.ts
    ├── user.ts
    └── api.ts
```

## 🔄 تدفق البيانات

### تدفق إنشاء إعلان جديد
```
المستخدم → Form (Client) → Validation (Zod) → API Route 
→ Auth Check → Prisma Create → Database → Response 
→ UI Update (Optimistic)
```

### تدفق المصادقة
```
Login Page → Credentials → NextAuth → Database Compare 
→ JWT Session → Redirect → Protected Route → Dashboard
```

## 🎨 Design System

### Components Hierarchy
```
Base Components (shadcn/ui)
    ↓
Domain Components (marketplace, vendor, admin)
    ↓
Page Components (pages)
    ↓
Layout Components
```

### Theme Tokens
```typescript
const theme = {
  colors: {
    primary: '#102A43',
    emerald: '#0E9F6E',
    gold: '#F2B84B',
    background: '#F6F8FB',
    text: '#172B4D',
    danger: '#D64545',
    border: '#D9E2EC',
  },
  fonts: {
    arabic: 'IBM Plex Sans Arabic',
    latin: 'Inter',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}
```

## 🔒 Security Architecture

### Layers
1. **Network**: Cloudflare DDoS Protection
2. **Application**: CSRF, Rate Limiting, CORS
3. **API**: Input Validation, Authorization
4. **Data**: RLS, Encryption, Backups

### Auth Flow
```
Client → Login → NextAuth → Verify Credentials 
→ Create Session → Set Cookies → Redirect
→ Subsequent Requests → Validate Session → Access Resources
```

## 📊 Scalability Considerations

### Current (Phase 1-2)
- Single server
- SQLite database
- Local storage
- Basic caching

### Future (Phase 5+)
- Horizontal scaling
- PostgreSQL + Read Replicas
- Cloudflare R2 + CDN
- Redis caching
- Queue system for jobs

---

**آخر تحديث**: 2026-09-03
