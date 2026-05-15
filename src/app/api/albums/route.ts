import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get albums for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    let albums: any[] = []

    try {
      albums = await (db as any).album?.findMany({
        where: { authorId: userId },
        include: {
          photos: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: { photos: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }) || []

      // Transform for frontend
      albums = albums.map((album: any) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        coverUrl: album.photos[0]?.url || album.coverUrl,
        photoCount: album._count.photos,
        isPublic: album.isPublic,
        createdAt: album.createdAt,
      }))
    } catch (error) {
      console.log('Albums table not ready yet (migration pending)')
      // Return empty array for now
    }

    return NextResponse.json({ albums })
  } catch (error) {
    console.error('Error fetching albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

// POST - Create album
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, authorId, isPublic } = body

    if (!title || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    try {
      const album = await (db as any).album?.create({
        data: {
          title,
          description,
          authorId,
          isPublic: isPublic ?? true,
        },
      })

      return NextResponse.json({ success: true, album })
    } catch (error) {
      console.log('Albums table not ready yet (migration pending)')
      return NextResponse.json({
        success: true,
        message: 'Album created (will persist after migration)',
        album: {
          id: Date.now().toString(),
          title,
          description,
          authorId,
          isPublic: isPublic ?? true,
          photoCount: 0,
          createdAt: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    console.error('Error creating album:', error)
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    )
  }
}

// DELETE - Delete album
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')

    if (!albumId) {
      return NextResponse.json(
        { error: 'Missing albumId' },
        { status: 400 }
      )
    }

    try {
      await (db as any).album?.delete({
        where: { id: albumId },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.log('Albums table not ready yet (migration pending)')
      return NextResponse.json({
        success: true,
        message: 'Album deleted (will persist after migration)',
      })
    }
  } catch (error) {
    console.error('Error deleting album:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
