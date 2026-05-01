import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, create, getById, update } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let records = await getAll('maintenance', { orderBy: 'createdAt', orderDir: 'desc' })

    if (vehicleId) records = records.filter((m: Record<string, unknown>) => m.vehicleId === vehicleId)
    if (status) records = records.filter((m: Record<string, unknown>) => m.status === status)
    if (type) records = records.filter((m: Record<string, unknown>) => m.type === type)

    const total = records.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = records.slice(start, start + limit)

    const enriched = await Promise.all(
      paginated.map(async (record: Record<string, unknown>) => {
        const vehicle = await getById('vehicles', record.vehicleId as string)
        return { ...record, vehicle }
      })
    )

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Maintenance list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data maintenance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, type, description, cost, dueDate, status } = body

    const vehicle = await getById('vehicles', vehicleId)
    if (!vehicle) return NextResponse.json({ success: false, error: 'Kendaraan tidak ditemukan' }, { status: 404 })

    const id = await create('maintenance', { vehicleId, type, description, cost: cost || 0, dueDate: dueDate || null, completedDate: null, status: status || 'SCHEDULED' })

    if (status === 'IN_PROGRESS') {
      await update('vehicles', vehicleId, { status: 'MAINTENANCE' })
    }

    const record = await getById('maintenance', id)
    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error) {
    console.error('Maintenance create error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat maintenance' }, { status: 500 })
  }
}