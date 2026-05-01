import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/maintenance/[id] - Update maintenance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.maintenance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Maintenance record not found' },
        { status: 404 }
      );
    }

    const maintenance = await db.maintenance.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        description: body.description !== undefined ? body.description : existing.description,
        cost: body.cost ?? existing.cost,
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
        completedDate: body.completedDate ? new Date(body.completedDate) : existing.completedDate,
        status: body.status ?? existing.status,
      },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, status: true } },
      },
    });

    // If completed, check if vehicle can be set back to available
    if (body.status === 'COMPLETED') {
      const pendingMaintenance = await db.maintenance.count({
        where: {
          vehicleId: existing.vehicleId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          id: { not: id },
        },
      });

      if (pendingMaintenance === 0) {
        await db.vehicle.update({
          where: { id: existing.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // If in progress, set vehicle to maintenance
    if (body.status === 'IN_PROGRESS') {
      await db.vehicle.update({
        where: { id: existing.vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    }

    return NextResponse.json({ success: true, data: maintenance });
  } catch (error) {
    console.error('Maintenance PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance record' },
      { status: 500 }
    );
  }
}
