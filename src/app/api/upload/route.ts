import { NextResponse, NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'
import { authenticateUser } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user before allowing upload
    const auth = await authenticateUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please login to upload files.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    // Verify user can only upload for their own account
    if (userId && userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden. You can only upload files for your own account.' }, { status: 403 })
    }

    // Use authenticated user ID
    const authenticatedUserId = userId || auth.userId

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
    const filename = `${authenticatedUserId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

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
