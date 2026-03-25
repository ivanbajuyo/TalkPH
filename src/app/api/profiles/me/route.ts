import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// PATCH /api/profiles/me - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    const displayName = formData.get('displayName') as string
    const bio = formData.get('bio') as string
    const region = formData.get('region') as string
    const province = formData.get('province') as string
    const city = formData.get('city') as string
    const barangay = formData.get('barangay') as string
    const avatarFile = formData.get('avatar') as File | null

    let avatarUrl: string | undefined = undefined

    // Handle avatar upload
    if (avatarFile && avatarFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      if (avatarFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 5MB.' },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      await mkdir(uploadsDir, { recursive: true })

      // Generate unique filename
      const fileExtension = avatarFile.name.split('.').pop() || 'jpg'
      const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`
      const filePath = path.join(uploadsDir, fileName)

      // Write file
      const bytes = await avatarFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Set avatar URL
      avatarUrl = `/uploads/avatars/${fileName}`
    }

    // Build update data
    const updateData: any = {}
    
    if (displayName) updateData.displayName = displayName
    if (bio !== null) updateData.bio = bio || null
    if (region !== null) updateData.region = region || null
    if (province !== null) updateData.province = province || null
    if (city !== null) updateData.city = city || null
    if (barangay !== null) updateData.barangay = barangay || null
    if (avatarUrl) updateData.avatarUrl = avatarUrl

    // Update profile
    const updatedProfile = await db.profile.update({
      where: { id: session.user.id },
      data: updateData
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// GET /api/profiles/me - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await db.profile.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
