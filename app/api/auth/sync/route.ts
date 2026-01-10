import { NextRequest, NextResponse } from 'next/server'
import { syncUserWithDatabase } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await syncUserWithDatabase()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ 
      id: user.id,
      clerk_user_id: user.clerk_user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      image_url: user.image_url,
      email_verified: user.email_verified,
      phone_number: user.phone_number,
      phone_verified: user.phone_verified,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
