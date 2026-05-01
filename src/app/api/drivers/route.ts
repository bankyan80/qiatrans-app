import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, create, getById, getByField } from '@/lib/firestore'

async function enrichDriver(driver: Record<string, unknown>) {
  const user = await getById('users', driver.userId as string)
  const bookingCount = await count('bookings', { driverId: ['==', driver.id] })
  return {
    ...driver,
    user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } : null,
    _count: { driverBookings: bookingCount },
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'rating'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let drivers = await getAll('drivers')

    if (status) drivers = drivers.filter((d: Record<string, unknown>) => d.status === status)

    drivers.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const va = Number(a[sortBy] || 0)
      const vb = Number(b[sortBy] || 0)
      return sortOrder === 'desc' ? vb - va : va - vb
    })

    const total = drivers.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = drivers.slice(start, start + limit)

    const enriched = await Promise.all(paginated.map((d: Record<string, unknown>) => enrichDriver(d)))

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Drivers list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data driver' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, licenseNumber, licenseExpiry, licenseImage, address, status } = body

    const user = await getById('users', userId)
    if (!user) return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 })

    const existing = await getByField('drivers', 'userId', userId)
    if (existing) return NextResponse.json({ success: false, error: 'Profil driver sudah ada untuk pengguna ini' }, { status: 400 })

    const id = await create('drivers', { userId, licenseNumber, licenseExpiry, licenseImage, address, status: status || 'OFFLINE', rating: 0, totalTrips: 0 })
    const driver = await getById('drivers', id)
    return NextResponse.json({ success: true, data: driver }, { status: 201 })
  } catch (error) {
    console.error('Driver create error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menambahkan driver' }, { status: 500 })
  }
}