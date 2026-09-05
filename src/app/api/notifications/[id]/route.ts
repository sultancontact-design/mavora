/**
 * API إشعار محدد
 * Single Notification API
 * 
 * @endpoints
 * GET /api/notifications/[id] - جلب إشعار محدد
 * PUT /api/notifications/[id] - تحديث إشعار (قراءة/نقر)
 * DELETE /api/notifications/[id] - حذف إشعار
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  markNotificationAsRead,
  markNotificationAsClicked,
  deleteNotification,
} from '@/lib/notification-service';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ==================== GET - جلب إشعار محدد ====================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('خطأ في جلب الإشعار:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعار' },
      { status: 500 }
    );
  }
}

// ==================== PUT - تحديث إشعار ====================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'mark_read':
        await markNotificationAsRead(id);
        return NextResponse.json({ 
          success: true, 
          message: 'تم تحديد الإشعار كمقروء' 
        });
        
      case 'mark_clicked':
        await markNotificationAsClicked(id);
        return NextResponse.json({ 
          success: true, 
          message: 'تم تحديث حالة النقر' 
        });
        
      default:
        return NextResponse.json(
          { error: 'إجراء غير معروف. استخدم mark_read أو mark_clicked' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('خطأ في تحديث الإشعار:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

// ==================== DELETE - حذف إشعار ====================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    await deleteNotification(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الإشعار بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الإشعار' },
      { status: 500 }
    );
  }
}
