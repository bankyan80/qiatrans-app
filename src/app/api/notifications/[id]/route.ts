import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/notifications/[id] - Mark single notification as read
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Notification PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
