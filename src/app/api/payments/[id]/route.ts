import { NextRequest, NextResponse } from 'next/server'
import { getById, update } from '@/lib/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payment = await getById('payments', id)
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    const booking = await getById('bookings', payment.bookingId as string)
    let customer = null
    let vehicle = null
    if (booking) {
      customer = await getById('users', booking.customerId as string)
      vehicle = await getById('vehicles', booking.vehicleId as string)
    }

    return NextResponse.json({
      success: true,
      data: { ...payment, booking: booking ? { ...booking, customer, vehicle } : null },
    })
  } catch (error) {
    console.error('Payment detail error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat pembayaran' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('payments', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    if (body.status === 'SUCCESS' && !existing.paidAt) {
      body.paidAt = new Date().toISOString()
    }

    await update('payments', id, body)
    const payment = await getById('payments', id)
    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate pembayaran' }, { status: 500 })
  }
}