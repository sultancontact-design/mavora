/**
 * API رسائل محادثة محددة
 * Specific Conversation Messages API
 * 
 * @endpoints
 * GET /api/messages/[conversationId] - جلب رسائل المحادثة
 * POST /api/messages/[conversationId] - إرسال رسالة جديدة
 * PUT /api/messages/[conversationId]/read - تحديد كمقروءة
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
} from '@/lib/chat-service';

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

// ==================== GET - جلب الرسائل ====================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { conversationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before') || undefined;
    
    const messages = await getConversationMessages(conversationId, limit, before);
    
    return NextResponse.json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('خطأ في جلب الرسائل:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الرسائل' },
      { status: 500 }
    );
  }
}

// ==================== POST - إرسال رسالة ====================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { content, message_type, attachment_url, reply_to_id, listing_id } = body;
    
    if (!content && !attachment_url) {
      return NextResponse.json(
        { error: 'محتوى الرسالة أو المرفق مطلوب' },
        { status: 400 }
      );
    }
    
    // التحقق من المستخدم
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const message = await sendMessage(userId, {
      conversation_id: conversationId,
      content: content || '',
      message_type: message_type || 'text',
      attachment_url,
      reply_to_id,
      listing_id,
    });
    
    return NextResponse.json({
      message,
      success: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error('خطأ في إرسال الرسالة:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}

// ==================== PUT - تحديث حالة القراءة ====================

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { conversationId } = await params;
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    await markConversationAsRead(conversationId, userId);
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة القراءة',
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة القراءة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الحالة' },
      { status: 500 }
    );
  }
}
