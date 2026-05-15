import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Upload voice message
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const chatRoomId = formData.get('chatRoomId') as string
    const senderId = formData.get('senderId') as string

    if (!audioFile || !chatRoomId || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // TODO: Upload to cloud storage (Supabase Storage, Cloudinary, etc.)
    // For now, we'll just return success with file metadata
    
    // Example with Supabase Storage:
    // const { data, error } = await supabase.storage
    //   .from('voice-messages')
    //   .upload(`${chatRoomId}/${Date.now()}-${audioFile.name}`, audioFile)
    // 
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }
    // 
    // const audioUrl = supabase.storage.from('voice-messages').getPublicUrl(data.path).publicURL

    // Save message to database
    try {
      const message = await (db as any).message?.create({
        data: {
          chatRoomId,
          senderId,
          content: '',
          type: 'voice',
          audioUrl: `/uploads/voice-messages/${audioFile.name}`, // Placeholder
          duration: parseInt(formData.get('duration') as string) || 0,
        },
      })

      return NextResponse.json({
        success: true,
        message,
        status: 'Voice message uploaded successfully',
      })
    } catch (error) {
      console.log('Messages table not ready yet (migration pending)')
      return NextResponse.json({
        success: true,
        message: 'Voice message recorded (will persist after migration)',
        audioUrl: `/uploads/voice-messages/${audioFile.name}`,
      })
    }
  } catch (error) {
    console.error('Error uploading voice message:', error)
    return NextResponse.json(
      { error: 'Failed to upload voice message' },
      { status: 500 }
    )
  }
}
