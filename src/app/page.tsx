'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  FileText,
  Users
} from 'lucide-react'

// 📊 أنواع البيانات
interface Post {
  id: string
  title: string
  content: string | null
  published: boolean
  authorId: string
  author?: {
    id: string
    name: string | null
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  pagination?: Pagination
  error?: string
  details?: any
  message?: string
}

// 🎨 مكون حالة التحميل
function PostSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// 🎨 مكون الحالة الفارغة
function EmptyState() {
  return (
    <Card className="w-full text-center py-12">
      <CardContent>
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا توجد منشورات</h3>
        <p className="text-muted-foreground">قم بإنشاء أول منشور الآن!</p>
      </CardContent>
    </Card>
  )
}

// 🎨 مكون حالة الخطأ
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>حدث خطأ!</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة المحاولة
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// 🏠 الصفحة الرئيسية
export default function Home() {
  // 📊 حالة البيانات
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  
  // 🔧 حالة واجهة المستخدم
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  
  // 📝 حالة النموذج
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  })
  
  // 👤 بيانات المستخدم التجريبية (في الإنتاج: تأتي من نظام المصادقة)
  const [currentUserId] = useState('demo-user-id')
  const [userName] = useState('مستخدم تجريبي')

  // 📥 جلب المنشورات
  const fetchPosts = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/route?page=${page}&limit=10`)
      const result: ApiResponse<Post[]> = await response.json()
      
      if (result.success && result.data) {
        setPosts(result.data)
        if (result.pagination) {
          setPagination(result.pagination)
        }
      } else {
        setError(result.error || 'فشل في جلب البيانات')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔄 تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // ➕ إنشاء/تحديث منشور
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const url = editingId ? '/api/route' : '/api/route'
      const method = editingId ? 'PUT' : 'POST'
      
      const body = editingId
        ? { id: editingId, authorId: currentUserId, ...formData }
        : { ...formData, authorId: currentUserId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result: ApiResponse<Post> = await response.json()

      if (result.success) {
        // إعادة تعيين النموذج
        setFormData({ title: '', content: '', published: false })
        setShowForm(false)
        setEditingId(null)
        // إعادة جلب البيانات
        await fetchPosts(pagination.page)
      } else {
        setError(result.error || 'فشل في حفظ المنشور')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
      console.error('Submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ✏️ بدء التعديل
  const startEdit = (post: Post) => {
    setEditingId(post.id)
    setFormData({
      title: post.title,
      content: post.content || '',
      published: post.published,
    })
    setShowForm(true)
  }

  // 🗑️ حذف منشور
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return

    try {
      const response = await fetch(`/api/route?id=${id}&authorId=${currentUserId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()

      if (result.success) {
        await fetchPosts(pagination.page)
      } else {
        setError(result.error || 'فشل في حذف المنشور')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
      console.error('Delete error:', err)
    }
  }

  // 📄 تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 🎯 الهيدر */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                نظام إدارة المنشورات
              </h1>
              <p className="text-muted-foreground mt-2">منصة آمنة لإدارة المحتوى</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {userName}
              </Badge>
              <Button 
                onClick={() => {
                  setShowForm(!showForm)
                  setEditingId(null)
                  setFormData({ title: '', content: '', published: false })
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">منشور جديد</span>
                <span sm:hidden>+</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 📝 نموذج إنشاء/تعديل */}
      {showForm && (
        <section className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'تعديل المنشور' : 'إنشاء منشور جديد'}</CardTitle>
              <CardDescription>
                {editingId ? 'قم بتعديل بيانات المنشور أدناه' : 'أدخل بيانات المنشور الجديد'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    العنوان <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="أدخل عنوان المنشور..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={200}
                    disabled={submitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    المحتوى
                  </label>
                  <Textarea
                    id="content"
                    placeholder="أدخل محتوى المنشور..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                    maxLength={5000}
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    disabled={submitting}
                    className="rounded"
                  />
                  <label htmlFor="published" className="text-sm font-medium">
                    نشر فوراً
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جارِ الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {editingId ? 'تحديث' : 'إنشاء'}
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                      setFormData({ title: '', content: '', published: false })
                    }}
                    disabled={submitting}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ⚠️ عرض الأخطاء */}
      {error && (
        <section className="container mx-auto px-4 py-4">
          <ErrorState error={error} onRetry={() => fetchPosts(pagination.page)} />
        </section>
      )}

      {/* 📋 قائمة المنشورات */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          // 💭 حالة التحميل
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          // 📭 حالة فارغة
          <EmptyState />
        ) : (
          // ✅ قائمة المنشورات
          <>
            <div className="mb-4 text-muted-foreground text-sm">
              إجمالي المنشورات: {pagination.total}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? 'منشور' : 'مسودة'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <span>بواسطة: {post.author?.name || post.author?.email || 'مجهول'}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {post.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {post.content}
                      </p>
                    )}
                    <div className="flex gap-2 mt-auto pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(post)}
                        className="gap-1 flex-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(post.id)}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 📄 ترقيم الصفحات */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchPosts(pagination.page - 1)}
                >
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {pagination.page} من {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchPosts(pagination.page + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 🦶 الفوتر */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2026 نظام إدارة المنشورات - جميع الحقوق محفوظة</p>
          <p className="mt-1 text-xs">مبني بأمان عالي وحماية متقدمة</p>
        </div>
      </footer>
    </div>
  )
}
