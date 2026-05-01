import { NextRequest, NextResponse } from 'next/server'
import { getById, update, count, getAll } from '@/lib/firestore'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('maintenance', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Maintenance tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json()
    const { status, completedDate } = body

    const updates: Record<string, unknown> = {}
    if (body.type !== undefined) updates.type = body.type
    if (body.description !== undefined) updates.description = body.description
    if (body.cost !== undefined) updates.cost = body.cost
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate
    if (status !== undefined) updates.status = status
    if (completedDate !== undefined) updates.completedDate = completedDate

    await update('maintenance', id, updates)

    if (status && existing.vehicleId) {
      if (status === 'COMPLETED') {
        const remainingMaintenance = await getAll('maintenance', { where: { vehicleId: ['==', existing.vehicleId] } })
        const hasActive = remainingMaintenance.some((m: Record<string, unknown>) =>
          m.id !== id && (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED')
        )
        if (!hasActive) {
          await update('vehicles', existing.vehicleId as string, { status: 'AVAILABLE' })
        }
      } else if (status === 'IN_PROGRESS') {
        await update('vehicles', existing.vehicleId as string, { status: 'MAINTENANCE' })
      }
    }

    const record = await getById('maintenance', id)
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Maintenance update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate maintenance' }, { status: 500 })
  }
}