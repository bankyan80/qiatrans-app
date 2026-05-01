import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/maintenance - List maintenance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;
    if (type) where.type = type;

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [maintenanceRecords, total] = await Promise.all([
      db.maintenance.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        },
      }),
      db.maintenance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: maintenanceRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Maintenance GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance records' },
      { status: 500 }
    );
  }
}

// POST /api/maintenance - Create maintenance record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: body.vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const maintenance = await db.maintenance.create({
      data: {
        vehicleId: body.vehicleId,
        type: body.type,
        description: body.description || null,
        cost: body.cost || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        status: body.status || 'SCHEDULED',
      },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
      },
    });

    // Update vehicle status to MAINTENANCE if applicable
    if (body.status === 'IN_PROGRESS') {
      await db.vehicle.update({
        where: { id: body.vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    }

    return NextResponse.json({ success: true, data: maintenance }, { status: 201 });
  } catch (error) {
    console.error('Maintenance POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance record' },
      { status: 500 }
    );
  }
}
