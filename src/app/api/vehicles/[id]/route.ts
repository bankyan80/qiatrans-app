import { NextRequest, NextResponse } from 'next/server'
import { getById, update, remove, count, getAll } from '@/lib/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const vehicle = await getById('vehicles', id)
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })
    }

    const [maintenance, bookingCount] = await Promise.all([
      getAll('maintenance', { where: { vehicleId: ['==', id] }, orderBy: 'createdAt', orderDir: 'desc', limit: 5 }),
      count('bookings', { vehicleId: ['==', id] }),
    ])

    return NextResponse.json({
      success: true,
      data: { ...vehicle, maintenance, _count: { bookings: bookingCount } },
    })
  } catch (error) {
    console.error('Vehicle detail error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat kendaraan' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('vehicles', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    await update('vehicles', id, body)
    const vehicle = await getById('vehicles', id)
    return NextResponse.json({ success: true, data: vehicle })
  } catch (error) {
    console.error('Vehicle update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate kendaraan' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('vehicles', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })
    }

    const bookings = await getAll('bookings', { where: { vehicleId: ['==', id] } })
    const hasActive = bookings.some(
      (b: Record<string, unknown>) =>
        b.status === 'ACTIVE' || b.status === 'CONFIRMED' || b.status === 'PENDING'
    )
    if (hasActive) {
      return NextResponse.json(
        { success: false, error: 'Kendaraan tidak dapat dihapus karena memiliki booking aktif' },
        { status: 400 }
      )
    }

    await remove('vehicles', id)
    return NextResponse.json({ success: true, message: 'Kendaraan berhasil dihapus' })
  } catch (error) {
    console.error('Vehicle delete error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus kendaraan' }, { status: 500 })
  }
}