/**
 * API الإشعارات
 * Notifications API
 * 
 * @endpoints
 * GET /api/notifications - جلب إشعارات المستخدم
 * POST /api/notifications - إنشاء إشعار جديد (admin)
 * PUT /api/notifications/read-all - تحديد الكل كمقروء
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteReadNotifications,
} from '@/lib/notification-service';

// ==================== GET - جلب الإشعارات ====================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const searchParams = request.nextUrl.searchParams;
    
    const options = {
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
      unreadOnly: searchParams.get('unread_only') === 'true',
      type: searchParams.get('type') as any || undefined,
    };
    
    const { notifications, total } = await getUserNotifications(userId, options);
    const unreadCount = await getUnreadNotificationCount(userId);
    
    return NextResponse.json({
      notifications,
      total,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    );
  }
}

// ==================== POST - إنشاء إشعار ====================

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { user_id, type, title, body, ...rest } = requestBody;
    
    if (!user_id || !type || !title || !body) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: user_id, type, title, body' },
        { status: 400 }
      );
    }
    
    // التحقق من الصلاحيات (في الإنتاج)
    // const isAdmin = await checkAdminRole(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    // }
    
    const { createNotification } = await import('@/lib/notification-service');
    const notification = await createNotification({
      userId: user_id,
      type,
      title,
      body,
      ...rest,
    });
    
    return NextResponse.json({ 
      notification, 
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الإشعار' },
      { status: 500 }
    );
  }
}

// ==================== PUT - تحديث الإشعارات ====================

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'mark_all_read':
        await markAllNotificationsAsRead(userId);
        return NextResponse.json({ 
          success: true, 
          message: 'تم تحديد جميع الإشعارات كمقروءة' 
        });
        
      case 'delete_read':
        await deleteReadNotifications(userId);
        return NextResponse.json({ 
          success: true, 
          message: 'تم حذف الإشعارات المقروءة' 
        });
        
      default:
        return NextResponse.json(
          { error: 'إجراء غير معروف' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('خطأ في تحديث الإشعارات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}
