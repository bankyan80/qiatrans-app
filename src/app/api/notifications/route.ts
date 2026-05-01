import { NextRequest, NextResponse } from 'next/server'
import { getAll, count, updateWhere } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const isRead = searchParams.get('isRead')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId wajib diisi' }, { status: 400 })
    }

    let notifications = await getAll('notifications', { where: { userId: ['==', userId] }, orderBy: 'createdAt', orderDir: 'desc' })

    if (type) notifications = notifications.filter((n: Record<string, unknown>) => n.type === type)
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      const val = isRead === 'true'
      notifications = notifications.filter((n: Record<string, unknown>) => n.isRead === val)
    }

    const unreadCount = notifications.filter((n: Record<string, unknown>) => n.isRead === false).length

    const total = notifications.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = notifications.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: { page, limit, total, totalPages },
      unreadCount,
    })
  } catch (error) {
    console.error('Notifications list error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat notifikasi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId wajib diisi' }, { status: 400 })
    }

    const updated = await updateWhere('notifications', 'userId', userId, { isRead: true })
    return NextResponse.json({ success: true, message: `${updated} notifikasi ditandai sudah dibaca` })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ success: false, error: 'Gagal mengupdate notifikasi' }, { status: 500 })
  }
}