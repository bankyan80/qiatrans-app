import { NextResponse } from 'next/server'
import { count, getAll } from '@/lib/firestore'

export async function GET() {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString()

    const [
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      activeBookings,
      pendingBookings,
      todayBookingsList,
      allPayments,
      maintenanceAlerts,
      totalCustomers,
      totalDrivers,
    ] = await Promise.all([
      count('vehicles'),
      count('vehicles', { status: ['==', 'AVAILABLE'] }),
      count('vehicles', { status: ['==', 'RENTED'] }),
      count('bookings', { status: ['==', 'ACTIVE'] }),
      count('bookings', { status: ['==', 'PENDING'] }),
      getAll('bookings'),
      getAll('payments', { where: { status: ['==', 'SUCCESS'] } }),
      count('maintenance', { status: ['==', 'OVERDUE'] }),
      count('users', { role: ['==', 'CUSTOMER'] }),
      count('drivers'),
    ])

    const todayBookings = todayBookingsList.filter(
      (b: Record<string, unknown>) => String(b.startDate).startsWith(todayStr)
    ).length

    const totalRevenue = allPayments.reduce(
      (sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0),
      0
    )
    const dailyRevenue = allPayments
      .filter((p: Record<string, unknown>) => String(p.paidAt).startsWith(todayStr))
      .reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0)
    const weeklyRevenue = allPayments
      .filter((p: Record<string, unknown>) => p.paidAt >= weekAgo)
      .reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0)
    const monthlyRevenue = allPayments
      .filter((p: Record<string, unknown>) => p.paidAt >= monthAgo)
      .reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalVehicles,
          availableVehicles,
          rentedVehicles,
          activeBookings,
          pendingBookings,
          todayBookings,
          totalRevenue,
          monthlyRevenue,
          weeklyRevenue,
          dailyRevenue,
          maintenanceAlerts,
          totalCustomers,
          totalDrivers,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data dashboard' },
      { status: 500 }
    )
  }
}