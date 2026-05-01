import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, create, getById } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let vehicles = await getAll('vehicles', {
      orderBy: 'createdAt',
      orderDir: 'desc',
    })

    if (status) vehicles = vehicles.filter((v: Record<string, unknown>) => v.status === status)
    if (category) vehicles = vehicles.filter((v: Record<string, unknown>) => v.category === category)
    if (search) {
      const q = search.toLowerCase()
      vehicles = vehicles.filter((v: Record<string, unknown>) =>
        String(v.brand || '').toLowerCase().includes(q) ||
        String(v.model || '').toLowerCase().includes(q) ||
        String(v.plateNumber || '').toLowerCase().includes(q)
      )
    }

    const total = vehicles.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginatedVehicles = vehicles.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginatedVehicles,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Vehicles list error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data kendaraan' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = await create('vehicles', body)
    const vehicle = await getById('vehicles', id)
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 })
  } catch (error) {
    console.error('Vehicle create error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan kendaraan' },
      { status: 500 }
    )
  }
}