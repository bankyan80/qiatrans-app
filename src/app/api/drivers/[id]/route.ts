import { NextRequest, NextResponse } from 'next/server'
import { getById, update, remove, count, getAll } from '@/lib/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const driver = await getById('drivers', id)
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver tidak ditemukan' }, { status: 404 })
    }

    const user = await getById('users', driver.userId as string)
    const bookings = await getAll('bookings', { where: { driverId: ['==', id] }, orderBy: 'createdAt', orderDir: 'desc', limit: 10 })

    const enrichedBookings = await Promise.all(
      bookings.map(async (b: Record<string, unknown>) => {
        const customer = await getById('users', b.customerId as string)
        const vehicle = await getById('vehicles', b.vehicleId as string)
        return { ...b, customer, vehicle }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        ...driver,
        user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } : null,
        driverBookings: enrichedBookings,
      },
    })
  } catch (error) {
    console.error('Driver detail error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat driver' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('drivers', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Driver tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.licenseNumber !== undefined) updates.licenseNumber = body.licenseNumber
    if (body.licenseExpiry !== undefined) updates.licenseExpiry = body.licenseExpiry
    if (body.licenseImage !== undefined) updates.licenseImage = body.licenseImage
    if (body.address !== undefined) updates.address = body.address
    if (body.status !== undefined) updates.status = body.status
    if (body.rating !== undefined) updates.rating = body.rating
    if (body.totalTrips !== undefined) updates.totalTrips = body.totalTrips

    await update('drivers', id, updates)
    const driver = await getById('drivers', id)
    return NextResponse.json({ success: true, data: driver })
  } catch (error) {
    console.error('Driver update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate driver' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('drivers', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Driver tidak ditemukan' }, { status: 404 })
    }

    const activeBookings = await count('bookings', { driverId: ['==', id], status: ['in', ['ACTIVE', 'CONFIRMED']] })
    if (activeBookings > 0) {
      return NextResponse.json({ success: false, error: 'Driver tidak dapat dihapus karena memiliki booking aktif' }, { status: 400 })
    }

    await remove('drivers', id)
    return NextResponse.json({ success: true, message: 'Driver berhasil dihapus' })
  } catch (error) {
    console.error('Driver delete error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus driver' }, { status: 500 })
  }
}