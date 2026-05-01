import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    const method = searchParams.get('method');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (bookingId) where.bookingId = bookingId;
    if (method) where.method = method;

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          booking: {
            select: {
              id: true,
              totalPrice: true,
              status: true,
              customer: { select: { id: true, name: true, email: true } },
              vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check booking exists
    const booking = await db.booking.findUnique({
      where: { id: body.bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const payment = await db.payment.create({
      data: {
        bookingId: body.bookingId,
        amount: body.amount,
        method: body.method,
        status: body.status || 'PENDING',
        isDownPayment: body.isDownPayment || false,
        transactionId: body.transactionId || null,
        paidAt: body.status === 'SUCCESS' ? new Date() : null,
      },
      include: {
        booking: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
