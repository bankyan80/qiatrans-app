import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/vehicles - List vehicles with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { plateNumber: { contains: search } },
      ];
    }

    // Build orderBy
    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Vehicles GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const vehicle = await db.vehicle.create({
      data: {
        brand: body.brand,
        model: body.model,
        year: body.year,
        color: body.color || null,
        plateNumber: body.plateNumber,
        category: body.category,
        dailyRate: body.dailyRate,
        weeklyRate: body.weeklyRate || null,
        monthlyRate: body.monthlyRate || null,
        fuelType: body.fuelType || null,
        transmission: body.transmission || null,
        seats: body.seats || 5,
        imageUrl: body.imageUrl || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error) {
    console.error('Vehicles POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}
