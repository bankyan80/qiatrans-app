import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payments/[id] - Get single payment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Payment GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = await db.payment.update({
      where: { id },
      data: {
        amount: body.amount ?? existing.amount,
        method: body.method ?? existing.method,
        status: body.status ?? existing.status,
        isDownPayment: body.isDownPayment !== undefined ? body.isDownPayment : existing.isDownPayment,
        transactionId: body.transactionId !== undefined ? body.transactionId : existing.transactionId,
        paidAt: body.status === 'SUCCESS' && !existing.paidAt ? new Date() : existing.paidAt,
      },
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Payment PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
