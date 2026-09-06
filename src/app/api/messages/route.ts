/**
 * API الرسائل والمحادثات
 * Messages & Conversations API
 * 
 * @endpoints
 * GET /api/messages - جلب جميع المحادثات
 * POST /api/messages - إنشاء محادثة جديدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserConversations, createConversation } from '@/lib/chat-service';

// ==================== GET - جلب المحادثات ====================

export async function GET(request: NextRequest) {
  try {
    // التحقق من المستخدم (في الإنتاج، استخدم JWT/session حقيقي)
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const conversations = await getUserConversations(userId);
    
    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error('خطأ في جلب المحادثات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المحادثات' },
      { status: 500 }
    );
  }
}

// ==================== POST - إنشاء محادثة ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant_id, listing_id, initial_message } = body;
    
    if (!participant_id) {
      return NextResponse.json(
        { error: 'معرف المشارك مطلوب' },
        { status: 400 }
      );
    }
    
    // التحقق من المستخدم
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const conversation = await createConversation(userId, {
      participant_id,
      listing_id,
      initial_message,
    });
    
    return NextResponse.json({
      conversation,
      message: 'تم إنشاء المحادثة بنجاح',
    }, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء المحادثة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المحادثة' },
      { status: 500 }
    );
  }
}
