import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, create, update, getById, getByField } from '@/lib/firestore'

async function enrichBooking(booking: Record<string, unknown>) {
  const [customer, vehicle, payments] = await Promise.all([
    getById('users', booking.customerId as string),
    getById('vehicles', booking.vehicleId as string),
    getAll('payments', { where: { bookingId: ['==', booking.id] } }),
  ])

  let driver: Record<string, unknown> | null = null
  if (booking.driverId) {
    const driverDoc = await getById('drivers', booking.driverId as string)
    if (driverDoc) {
      const driverUser = await getById('users', driverDoc.userId as string)
      driver = { ...driverDoc, user: driverUser ? { name: driverUser.name, phone: driverUser.phone } : null }
    }
  }

  return { ...booking, customer, vehicle, driver, payments }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const vehicleId = searchParams.get('vehicleId')
    const withDriver = searchParams.get('withDriver')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let bookings = await getAll('bookings', { orderBy: 'createdAt', orderDir: 'desc' })

    if (status) bookings = bookings.filter((b: Record<string, unknown>) => b.status === status)
    if (customerId) bookings = bookings.filter((b: Record<string, unknown>) => b.customerId === customerId)
    if (vehicleId) bookings = bookings.filter((b: Record<string, unknown>) => b.vehicleId === vehicleId)
    if (withDriver !== null) {
      const val = withDriver === 'true'
      bookings = bookings.filter((b: Record<string, unknown>) => b.withDriver === val)
    }

    const total = bookings.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = bookings.slice(start, start + limit)

    const enriched = await Promise.all(paginated.map((b: Record<string, unknown>) => enrichBooking(b)))

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Bookings list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data booking' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, vehicleId, driverId, startDate, endDate, withDriver, pickupLocation, returnLocation, notes } = body

    const vehicle = await getById('vehicles', vehicleId)
    if (!vehicle) return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })
    if (vehicle.status !== 'AVAILABLE') return NextResponse.json({ success: false, error: 'Kendaraan tidak tersedia' }, { status: 400 })

    const existingBookings = await getAll('bookings', { where: { vehicleId: ['==', vehicleId] } })
    const start = new Date(startDate)
    const end = new Date(endDate)
    const hasConflict = existingBookings.some((b: Record<string, unknown>) => {
      if (b.status === 'CANCELLED') return false
      const bs = new Date(b.startDate as string)
      const be = new Date(b.endDate as string)
      return start < be && end > bs
    })
    if (hasConflict) return NextResponse.json({ success: false, error: 'Kendaraan sudah dibooking di tanggal tersebut' }, { status: 400 })

    let finalCustomerId = customerId
    if (!finalCustomerId) {
      const existingUser = await getByField('users', 'phone', body.customerPhone)
      if (existingUser) {
        finalCustomerId = existingUser.id
      } else {
        finalCustomerId = await create('users', {
          name: body.customerName || 'Pelanggan',
          email: body.customerEmail || '',
          phone: body.customerPhone || '',
          password: 'password123',
          role: 'CUSTOMER',
        })
      }
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = days * Number(vehicle.dailyRate || 0)

    const bookingId = await create('bookings', {
      customerId: finalCustomerId,
      vehicleId,
      driverId: driverId || null,
      startDate,
      endDate,
      totalPrice,
      status: 'PENDING',
      withDriver: withDriver || false,
      pickupLocation: pickupLocation || null,
      returnLocation: returnLocation || null,
      notes: notes || null,
    })

    const booking = await getById('bookings', bookingId)
    return NextResponse.json({ success: true, data: booking }, { status: 201 })
  } catch (error) {
    console.error('Booking create error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat booking' }, { status: 500 })
  }
}