import { NextRequest, NextResponse } from 'next/server'
import { getById, update } from '@/lib/firestore'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await getById('notifications', id)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Notifikasi tidak ditemukan' }, { status: 404 })
    }

    await update('notifications', id, { isRead: true })
    const notification = await getById('notifications', id)
    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate notifikasi' }, { status: 500 })
  }
}