import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 🔒 schema للتحقق من المدخلات - حماية من XSS وحقن البيانات
const createPostSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(200, "العنوان طويل جداً").trim(),
  content: z.string().max(5000, "المحتوى طويل جداً").optional(),
  published: z.boolean().default(false),
  authorId: z.string().min(1, "معرف المستخدم مطلوب"),
});

const updatePostSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(200, "العنوان طويل جداً").trim().optional(),
  content: z.string().max(5000, "المحتوى طويل جداً").optional(),
  published: z.boolean().optional(),
});

// 🛡️ دالة تنظيف النصوص - حماية من XSS
function sanitizeString(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// 📝 GET - جلب المنشورات مع ترقيم الصفحات وحماية
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🔍 تحقق من معاملات الاستعلام
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
    const publishedOnly = searchParams.get("published") === "true";
    const authorId = searchParams.get("authorId");
    
    // 🏗️ بناء الاستعلام بشكل آمن
    const where: any = {};
    if (publishedOnly) where.published = true;
    if (authorId) where.authorId = authorId;
    
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          authorId: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ]);
    
    // 🛡️ تنظيف المخرجات - حماية XSS
    const sanitizedPosts = posts.map((post) => ({
      ...post,
      title: sanitizeString(post.title),
      content: post.content ? sanitizeString(post.content) : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: sanitizedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ خطأ في جلب المنشورات:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في جلب البيانات" },
      { status: 500 }
    );
  }
}

// ➕ POST - إنشاء منشور جديد مع تحقق كامل
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ✅ التحقق من المدخلات
    const validatedData = createPostSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "بيانات غير صالحة",
          details: validatedData.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    // 🔍 التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: validatedData.data.authorId },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }
    
    // 📝 إنشاء المنشور
    const post = await db.post.create({
      data: {
        title: sanitizeString(validatedData.data.title),
        content: validatedData.data.content ? sanitizeString(validatedData.data.content) : null,
        published: validatedData.data.published,
        authorId: validatedData.data.authorId,
      },
    });
    
    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ خطأ في إنشاء المنشور:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في إنشاء المنشور" },
      { status: 500 }
    );
  }
}

// ✏️ PUT - تحديث منشور مع التحقق من الملكية
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, authorId, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المنشور مطلوب" },
        { status: 400 }
      );
    }
    
    // ✅ التحقق من المدخلات
    const validatedData = updatePostSchema.safeParse(updateData);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "بيانات غير صالحة",
          details: validatedData.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    // 🔍 التحقق من وجود المنشور والصلاحيات
    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }
    
    // 🛡️ التحقق من أن المستخدم هو صاحب المنشور
    if (authorId && existingPost.authorId !== authorId) {
      return NextResponse.json(
        { success: false, error: "غير مصرح بتعديل هذا المنشور" },
        { status: 403 }
      );
    }
    
    // 📝 تحديث المنشور
    const updatePayload: any = {};
    if (validatedData.data.title !== undefined) {
      updatePayload.title = sanitizeString(validatedData.data.title);
    }
    if (validatedData.data.content !== undefined) {
      updatePayload.content = validatedData.data.content ? sanitizeString(validatedData.data.content) : null;
    }
    if (validatedData.data.published !== undefined) {
      updatePayload.published = validatedData.data.published;
    }
    
    const post = await db.post.update({
      where: { id },
      data: updatePayload,
    });
    
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("❌ خطأ في تحديث المنشور:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في تحديث المنشور" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - حذف منشور مع التحقق من الصلاحيات
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const authorId = searchParams.get("authorId");
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المنشور مطلوب" },
        { status: 400 }
      );
    }
    
    // 🔍 التحقق من وجود المنشور
    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }
    
    // 🛡️ التحقق من الصلاحيات
    if (authorId && existingPost.authorId !== authorId) {
      return NextResponse.json(
        { success: false, error: "غير مصرح بحذف هذا المنشور" },
        { status: 403 }
      );
    }
    
    // 🗑️ حذف المنشور
    await db.post.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true, 
      message: "تم حذف المنشور بنجاح" 
    });
  } catch (error) {
    console.error("❌ خطأ في حذف المنشور:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ في حذف المنشور" },
      { status: 500 }
    );
  }
}
