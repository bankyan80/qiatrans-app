import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, create, getById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')
    const method = searchParams.get('method')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let payments = await getAll('payments', { orderBy: 'createdAt', orderDir: 'desc' })

    if (status) payments = payments.filter((p: Record<string, unknown>) => p.status === status)
    if (bookingId) payments = payments.filter((p: Record<string, unknown>) => p.bookingId === bookingId)
    if (method) payments = payments.filter((p: Record<string, unknown>) => p.method === method)

    const total = payments.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = payments.slice(start, start + limit)

    const enriched = await Promise.all(
      paginated.map(async (payment: Record<string, unknown>) => {
        const booking = await getById('bookings', payment.bookingId as string)
        let customer = null
        let vehicle = null
        if (booking) {
          customer = await getById('users', booking.customerId as string)
          vehicle = await getById('vehicles', booking.vehicleId as string)
        }
        return { ...payment, booking: booking ? { ...booking, customer, vehicle } : null }
      })
    )

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Payments list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data pembayaran' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, amount, method, status, isDownPayment, transactionId } = body

    const booking = await getById('bookings', bookingId)
    if (!booking) return NextResponse.json({ success: false, error: 'Booking tidak ditemukan' }, { status: 404 })

    const data: Record<string, unknown> = { bookingId, amount, method, status: status || 'PENDING', isDownPayment: isDownPayment || false, transactionId: transactionId || null }
    if (status === 'SUCCESS') data.paidAt = new Date().toISOString()

    const id = await create('payments', data)
    const payment = await getById('payments', id)
    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (error) {
    console.error('Payment create error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat pembayaran' }, { status: 500 })
  }
}