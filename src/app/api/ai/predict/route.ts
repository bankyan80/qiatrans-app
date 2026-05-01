import { NextResponse } from 'next/server'
import { getAll } from '@/lib/firestore'

export async function GET() {
  try {
    const [vehicles, bookings, maintenance] = await Promise.all([
      getAll('vehicles'),
      getAll('bookings'),
      getAll('maintenance'),
    ])

    const vehicleStats = vehicles.map((v: Record<string, unknown>) => {
      const vBookings = bookings.filter((b: Record<string, unknown>) => b.vehicleId === v.id)
      const revenue = vBookings
        .filter((b: Record<string, unknown>) => b.status === 'COMPLETED')
        .reduce((sum: number, b: Record<string, unknown>) => sum + Number(b.totalPrice || 0), 0)
      return { id: v.id, name: `${v.brand} ${v.model}`, status: v.status, category: v.category, totalBookings: vBookings.length, revenue }
    })

    const bookingSummary = {
      total: bookings.length,
      pending: bookings.filter((b: Record<string, unknown>) => b.status === 'PENDING').length,
      active: bookings.filter((b: Record<string, unknown>) => b.status === 'ACTIVE').length,
      completed: bookings.filter((b: Record<string, unknown>) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b: Record<string, unknown>) => b.status === 'CANCELLED').length,
    }

    const maintenanceSummary = {
      total: maintenance.length,
      scheduled: maintenance.filter((m: Record<string, unknown>) => m.status === 'SCHEDULED').length,
      inProgress: maintenance.filter((m: Record<string, unknown>) => m.status === 'IN_PROGRESS').length,
      overdue: maintenance.filter((m: Record<string, unknown>) => m.status === 'OVERDUE').length,
      totalCost: maintenance.filter((m: Record<string, unknown>) => m.status === 'COMPLETED').reduce((sum: number, m: Record<string, unknown>) => sum + Number(m.cost || 0), 0),
    }

    const { default: ZAI } = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Kamu adalah analis AI untuk Qia Trans Manajemen. Analisis data berikut dan berikan insight dalam format JSON dengan field: predictions (array of {type, title, description, confidence}), recommendations (array of {priority, title, action}), risks (array of {level, title, impact}). Jawab dalam bahasa Indonesia.' },
        { role: 'user', content: `Data kendaraan: ${JSON.stringify(vehicleStats.slice(0, 10))}. Booking: ${JSON.stringify(bookingSummary)}. Maintenance: ${JSON.stringify(maintenanceSummary)}. Berikan analisis prediksi dan rekomendasi.` },
      ],
    })

    const analysis = completion.choices[0]?.message?.content || '{}'

    return NextResponse.json({
      success: true,
      data: {
        vehicleStats,
        bookingSummary,
        maintenanceSummary,
        analysis,
      },
    })
  } catch (error) {
    console.error('AI predict error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menganalisis data' }, { status: 500 })
  }
}