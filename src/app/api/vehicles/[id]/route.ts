import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/vehicles/[id] - Get single vehicle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        maintenance: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Vehicle GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if vehicle exists
    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        brand: body.brand ?? existing.brand,
        model: body.model ?? existing.model,
        year: body.year ?? existing.year,
        color: body.color ?? existing.color,
        plateNumber: body.plateNumber ?? existing.plateNumber,
        category: body.category ?? existing.category,
        dailyRate: body.dailyRate ?? existing.dailyRate,
        weeklyRate: body.weeklyRate ?? existing.weeklyRate,
        monthlyRate: body.monthlyRate ?? existing.monthlyRate,
        status: body.status ?? existing.status,
        fuelType: body.fuelType ?? existing.fuelType,
        transmission: body.transmission ?? existing.transmission,
        seats: body.seats ?? existing.seats,
        imageUrl: body.imageUrl ?? existing.imageUrl,
        notes: body.notes ?? existing.notes,
      },
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Vehicle PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Delete vehicle
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check for active bookings
    const activeBookings = await db.booking.count({
      where: {
        vehicleId: id,
        status: { in: ['ACTIVE', 'CONFIRMED', 'PENDING'] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete vehicle with active bookings' },
        { status: 400 }
      );
    }

    await db.vehicle.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Vehicle DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
