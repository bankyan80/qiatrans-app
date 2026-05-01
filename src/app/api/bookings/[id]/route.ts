import { NextRequest, NextResponse } from 'next/server'
import { getById, update, remove, removeWhere, getAll, getByField } from '@/lib/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await getById('bookings', id)
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking tidak ditemukan' }, { status: 404 })
    }

    const [customer, vehicle, payments, documents, reviews] = await Promise.all([
      getById('users', booking.customerId as string),
      getById('vehicles', booking.vehicleId as string),
      getAll('payments', { where: { bookingId: ['==', id] } }),
      getAll('documents', { where: { bookingId: ['==', id] } }),
      getByField('reviews', 'bookingId', id),
    ])

    let driver = null
    if (booking.driverId) {
      const driverDoc = await getById('drivers', booking.driverId as string)
      if (driverDoc) {
        const driverUser = await getById('users', driverDoc.userId as string)
        driver = { ...driverDoc, user: driverUser ? { name: driverUser.name, phone: driverUser.phone } : null }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...booking, customer, vehicle, driver, payments, documents, review: reviews },
    })
  } catch (error) {
    console.error('Booking detail error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat booking' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('bookings', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Booking tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    if (status && existing.vehicleId) {
      if (status === 'CONFIRMED' || status === 'ACTIVE') {
        await update('vehicles', existing.vehicleId as string, { status: 'RENTED' })
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        await update('vehicles', existing.vehicleId as string, { status: 'AVAILABLE' })
      }
    }

    delete body.customerId
    delete body.vehicleId
    await update('bookings', id, body)
    const booking = await getById('bookings', id)
    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate booking' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('bookings', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Booking tidak ditemukan' }, { status: 404 })
    }
    if (existing.status === 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Booking aktif tidak dapat dihapus' }, { status: 400 })
    }

    await removeWhere('payments', 'bookingId', id)
    await removeWhere('documents', 'bookingId', id)
    await removeWhere('reviews', 'bookingId', id)
    await remove('bookings', id)

    return NextResponse.json({ success: true, message: 'Booking berhasil dihapus' })
  } catch (error) {
    console.error('Booking delete error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus booking' }, { status: 500 })
  }
}