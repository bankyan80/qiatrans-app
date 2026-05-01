import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tracking - Get tracking data for a vehicle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'vehicleId is required' },
        { status: 400 }
      );
    }

    // Check vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, brand: true, model: true, plateNumber: true, status: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '50');
    const lastHours = parseInt(searchParams.get('lastHours') || '24');

    const sinceDate = new Date(Date.now() - lastHours * 3600000);

    const trackingLogs = await db.trackingLog.findMany({
      where: {
        vehicleId,
        timestamp: { gte: sinceDate },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Get the latest position
    const latestLog = trackingLogs.length > 0 ? trackingLogs[0] : null;

    // Calculate average speed
    const avgSpeed = trackingLogs.length > 0
      ? trackingLogs.reduce((sum, log) => sum + log.speed, 0) / trackingLogs.length
      : 0;

    // Get max speed
    const maxSpeed = trackingLogs.length > 0
      ? Math.max(...trackingLogs.map((log) => log.speed))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        vehicle,
        current: latestLog
          ? {
              latitude: latestLog.latitude,
              longitude: latestLog.longitude,
              speed: latestLog.speed,
              timestamp: latestLog.timestamp,
            }
          : null,
        stats: {
          totalPoints: trackingLogs.length,
          averageSpeed: Math.round(avgSpeed * 10) / 10,
          maxSpeed,
          period: `Last ${lastHours} hours`,
        },
        history: trackingLogs,
      },
    });
  } catch (error) {
    console.error('Tracking GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
