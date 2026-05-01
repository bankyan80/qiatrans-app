import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookings - List bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const withDriver = searchParams.get('withDriver');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (withDriver !== null && withDriver !== '') {
      where.withDriver = withDriver === 'true';
    }

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, imageUrl: true } },
          driver: { select: { id: true, name: true, phone: true } },
          payments: true,
        },
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check vehicle availability
    const vehicle = await db.vehicle.findUnique({
      where: { id: body.vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (vehicle.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Vehicle is not available for booking' },
        { status: 400 }
      );
    }

    // Check for date conflicts
    const conflictingBooking = await db.booking.findFirst({
      where: {
        vehicleId: body.vehicleId,
        status: { in: ['ACTIVE', 'CONFIRMED', 'PENDING'] },
        OR: [
          { startDate: { lte: new Date(body.endDate) }, endDate: { gte: new Date(body.startDate) } },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'Vehicle is already booked for the selected dates' },
        { status: 400 }
      );
    }

    // Calculate total price
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const totalPrice = body.totalPrice || days * vehicle.dailyRate;

    const booking = await db.booking.create({
      data: {
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        driverId: body.driverId || null,
        startDate: start,
        endDate: end,
        totalPrice,
        status: body.status || 'PENDING',
        withDriver: body.withDriver || false,
        pickupLocation: body.pickupLocation || null,
        returnLocation: body.returnLocation || null,
        notes: body.notes || null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Bookings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
