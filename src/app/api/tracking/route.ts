import { NextRequest, NextResponse } from 'next/server'
import { getAll, getById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (!vehicleId) {
      return NextResponse.json({ success: false, error: 'vehicleId wajib diisi' }, { status: 400 })
    }

    const vehicle = await getById('vehicles', vehicleId)
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })
    }

    const logs = await getAll('trackingLogs', { where: { vehicleId: ['==', vehicleId] }, orderBy: 'timestamp', orderDir: 'desc', limit: 100 })

    const speeds = logs.map((l: Record<string, unknown>) => Number(l.speed || 0))
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length : 0
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
    const latestPosition = logs.length > 0 ? { latitude: logs[0].latitude, longitude: logs[0].longitude, timestamp: logs[0].timestamp, speed: logs[0].speed } : null

    return NextResponse.json({
      success: true,
      data: { vehicleId, vehicle: { plateNumber: vehicle.plateNumber, brand: vehicle.brand, model: vehicle.model }, logs, stats: { totalPoints: logs.length, avgSpeed: Math.round(avgSpeed * 10) / 10, maxSpeed }, latestPosition },
    })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data tracking' }, { status: 500 })
  }
}