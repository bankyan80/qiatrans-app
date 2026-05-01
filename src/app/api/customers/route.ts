import { NextRequest, NextResponse } from 'next/server'
import { getAll, count } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let users = await getAll('users', { orderBy: 'createdAt', orderDir: 'desc' })
    let customers = users.filter((u: Record<string, unknown>) => u.role === 'CUSTOMER')

    if (search) {
      const q = search.toLowerCase()
      customers = customers.filter((c: Record<string, unknown>) =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q)
      )
    }

    const allBookings = await getAll('bookings')
    const allReviews = await getAll('reviews')

    const enriched = await Promise.all(
      customers.map(async (customer: Record<string, unknown>) => {
        const customerBookings = allBookings.filter((b: Record<string, unknown>) => b.customerId === customer.id)
        const customerReviews = allReviews.filter((r: Record<string, unknown>) => r.customerId === customer.id)

        const totalSpent = customerBookings
          .filter((b: Record<string, unknown>) => b.status === 'COMPLETED')
          .reduce((sum: number, b: Record<string, unknown>) => sum + Number(b.totalPrice || 0), 0)

        const totalRentals = customerBookings.length
        const avgRating = customerReviews.length > 0
          ? customerReviews.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.rating || 0), 0) / customerReviews.length
          : 0

        let loyaltyTier = 'Bronze'
        if (totalRentals > 20) loyaltyTier = 'Platinum'
        else if (totalRentals > 10) loyaltyTier = 'Gold'
        else if (totalRentals >= 5) loyaltyTier = 'Silver'

        return { ...customer, totalSpent, totalRentals, avgRating: Math.round(avgRating * 10) / 10, loyaltyTier }
      })
    )

    const total = enriched.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = enriched.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Customers list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data pelanggan' }, { status: 500 })
  }
}