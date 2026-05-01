import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookings/[id] - Get single booking
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true } },
        payments: true,
        documents: true,
        reviews: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Booking GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = await db.booking.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        driverId: body.driverId !== undefined ? body.driverId : existing.driverId,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
        totalPrice: body.totalPrice ?? existing.totalPrice,
        withDriver: body.withDriver !== undefined ? body.withDriver : existing.withDriver,
        pickupLocation: body.pickupLocation !== undefined ? body.pickupLocation : existing.pickupLocation,
        returnLocation: body.returnLocation !== undefined ? body.returnLocation : existing.returnLocation,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    // If booking is confirmed or active, update vehicle status
    if (body.status === 'CONFIRMED' || body.status === 'ACTIVE') {
      await db.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: 'RENTED' },
      });
    }

    // If booking is completed or cancelled, update vehicle status
    if (body.status === 'COMPLETED' || body.status === 'CANCELLED') {
      await db.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Booking PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Delete booking
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an active booking' },
        { status: 400 }
      );
    }

    await db.booking.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Booking DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
