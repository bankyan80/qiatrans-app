import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notifications - List notifications for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (isRead !== null && isRead !== '') {
      where.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark all notifications as read for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    await db.notification.updateMany({
      where: { userId: body.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
