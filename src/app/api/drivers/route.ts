import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/drivers - List drivers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [drivers, total] = await Promise.all([
      db.driver.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              _count: { select: { driverBookings: true } },
            },
          },
        },
      }),
      db.driver.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Drivers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

// POST /api/drivers - Create driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if driver profile already exists
    const existingDriver = await db.driver.findUnique({
      where: { userId: body.userId },
    });

    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: 'Driver profile already exists for this user' },
        { status: 400 }
      );
    }

    const driver = await db.driver.create({
      data: {
        userId: body.userId,
        licenseNumber: body.licenseNumber,
        licenseExpiry: new Date(body.licenseExpiry),
        licenseImage: body.licenseImage || null,
        address: body.address || null,
        status: body.status || 'OFFLINE',
        rating: body.rating || 0.0,
        totalTrips: body.totalTrips || 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error) {
    console.error('Drivers POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
