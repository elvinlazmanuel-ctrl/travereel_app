import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Use Cloudinary if configured, otherwise use local storage
    if (isCloudinaryConfigured()) {
      // Upload to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToCloudinary(buffer, `travereel/${userId}`)
      
      return NextResponse.json({ 
        url: result.url, 
        filename: result.publicId,
        storage: 'cloudinary'
      }, { status: 201 })
    } else {
      // Local storage (development)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buffer)

      const url = `/uploads/${filename}`
      return NextResponse.json({ url, filename, storage: 'local' }, { status: 201 })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
