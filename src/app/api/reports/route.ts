import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, getById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'

    const [allPayments, allBookings, allMaintenance, allVehicles, allUsers] = await Promise.all([
      getAll('payments', { where: { status: ['==', 'SUCCESS'] } }),
      getAll('bookings'),
      getAll('maintenance'),
      getAll('vehicles'),
      getAll('users'),
    ])

    const now = new Date()

    let startDate: Date
    if (period === 'daily') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'weekly') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1)
    else startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const startIso = startDate.toISOString()

    const filteredPayments = allPayments.filter((p: Record<string, unknown>) => p.paidAt >= startIso)
    const filteredBookings = allBookings.filter((b: Record<string, unknown>) => b.createdAt >= startIso)

    const totalRevenue = filteredPayments.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0)
    const totalBookings = filteredBookings.length
    const completedBookings = filteredBookings.filter((b: Record<string, unknown>) => b.status === 'COMPLETED').length
    const cancelledBookings = filteredBookings.filter((b: Record<string, unknown>) => b.status === 'CANCELLED').length

    const monthlyRevenue: Record<string, number> = {}
    filteredPayments.forEach((p: Record<string, unknown>) => {
      const date = String(p.paidAt).substring(0, 7)
      monthlyRevenue[date] = (monthlyRevenue[date] || 0) + Number(p.amount || 0)
    })

    const vehicleBookingCount: Record<string, number> = {}
    filteredBookings.forEach((b: Record<string, unknown>) => {
      vehicleBookingCount[b.vehicleId as string] = (vehicleBookingCount[b.vehicleId as string] || 0) + 1
    })

    const topVehicleIds = Object.entries(vehicleBookingCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topVehicles = await Promise.all(
      topVehicleIds.map(async ([vid, cnt]) => {
        const v = await getById('vehicles', vid)
        return v ? { ...v, bookingCount: cnt } : null
      })
    )
    const popularVehicles = topVehicles.filter(Boolean)

    const customerSpending: Record<string, number> = {}
    filteredPayments.forEach((p: Record<string, unknown>) => {
      const booking = allBookings.find((b: Record<string, unknown>) => b.id === p.bookingId)
      if (booking) {
        customerSpending[booking.customerId as string] = (customerSpending[booking.customerId as string] || 0) + Number(p.amount || 0)
      }
    })
    const topCustomerIds = Object.entries(customerSpending).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topCustomers = await Promise.all(
      topCustomerIds.map(async ([uid, spent]) => {
        const u = await getById('users', uid)
        return u ? { ...u, totalSpent: spent } : null
      })
    )
    const topSpendingCustomers = topCustomers.filter(Boolean)

    const paymentByMethod: Record<string, number> = {}
    filteredPayments.forEach((p: Record<string, unknown>) => {
      const method = p.method as string || 'Unknown'
      paymentByMethod[method] = (paymentByMethod[method] || 0) + 1
    })

    const bookingByStatus: Record<string, number> = {}
    filteredBookings.forEach((b: Record<string, unknown>) => {
      const s = b.status as string || 'Unknown'
      bookingByStatus[s] = (bookingByStatus[s] || 0) + 1
    })

    const totalMaintenanceCost = allMaintenance
      .filter((m: Record<string, unknown>) => m.status === 'COMPLETED')
      .reduce((sum: number, m: Record<string, unknown>) => sum + Number(m.cost || 0), 0)

    const activeVehicles = allVehicles.filter((v: Record<string, unknown>) => v.status === 'AVAILABLE').length
    const utilizationRate = allVehicles.length > 0 ? Math.round((1 - activeVehicles / allVehicles.length) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: { start: startIso, end: now.toISOString() },
        revenue: { total: totalRevenue, monthlyBreakdown: monthlyRevenue },
        bookings: { total: totalBookings, completed: completedBookings, cancelled: cancelledBookings, byStatus: bookingByStatus },
        payments: { total: filteredPayments.length, byMethod: paymentByMethod, averageAmount: filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0 },
        vehicles: { total: allVehicles.length, active: activeVehicles, utilizationRate, popular: popularVehicles },
        customers: { total: allUsers.filter((u: Record<string, unknown>) => u.role === 'CUSTOMER').length, topSpending: topSpendingCustomers },
        maintenance: { totalCost: totalMaintenanceCost, totalRecords: allMaintenance.length },
      },
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat laporan' }, { status: 500 })
  }
}