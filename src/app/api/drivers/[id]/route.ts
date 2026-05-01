import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/drivers/[id] - Get single driver
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await db.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isVerified: true } },
        bookings: {
          include: {
            customer: { select: { id: true, name: true } },
            vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Driver GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch driver' },
      { status: 500 }
    );
  }
}

// PUT /api/drivers/[id] - Update driver
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.driver.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    const driver = await db.driver.update({
      where: { id },
      data: {
        licenseNumber: body.licenseNumber ?? existing.licenseNumber,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : existing.licenseExpiry,
        licenseImage: body.licenseImage !== undefined ? body.licenseImage : existing.licenseImage,
        address: body.address !== undefined ? body.address : existing.address,
        status: body.status ?? existing.status,
        rating: body.rating ?? existing.rating,
        totalTrips: body.totalTrips ?? existing.totalTrips,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Driver PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update driver' },
      { status: 500 }
    );
  }
}

// DELETE /api/drivers/[id] - Delete driver
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.driver.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Check for active bookings
    const activeBookings = await db.booking.count({
      where: {
        driverId: existing.userId,
        status: { in: ['ACTIVE', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete driver with active bookings' },
        { status: 400 }
      );
    }

    await db.driver.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Driver DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete driver' },
      { status: 500 }
    );
  }
}
