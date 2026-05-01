import { NextRequest, NextResponse } from 'next/server'
import { getById, getAll } from '@/lib/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getById('users', id)
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 })
    }

    const [bookings, reviews, notifications] = await Promise.all([
      getAll('bookings', { where: { customerId: ['==', id] }, orderBy: 'createdAt', orderDir: 'desc' }),
      getAll('reviews', { where: { customerId: ['==', id] } }),
      getAll('notifications', { where: { userId: ['==', id] }, orderBy: 'createdAt', orderDir: 'desc' }),
    ])

    const totalSpent = bookings
      .filter((b: Record<string, unknown>) => b.status === 'COMPLETED')
      .reduce((sum: number, b: Record<string, unknown>) => sum + Number(b.totalPrice || 0), 0)

    const totalRentals = bookings.length
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0

    let loyaltyTier = 'Bronze'
    if (totalRentals > 20) loyaltyTier = 'Platinum'
    else if (totalRentals > 10) loyaltyTier = 'Gold'
    else if (totalRentals >= 5) loyaltyTier = 'Silver'

    return NextResponse.json({
      success: true,
      data: { ...user, bookings, reviews, notifications, totalSpent, totalRentals, avgRating: Math.round(avgRating * 10) / 10, loyaltyTier },
    })
  } catch (error) {
    console.error('Customer detail error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat pelanggan' }, { status: 500 })
  }
}