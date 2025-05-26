import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupInitialUser() {
  try {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'clemens@internal.local',
      password: '12345678',
      email_confirm: true,
      user_metadata: {
        name: 'Clemens'
      }
    })

    if (error) {
      throw error
    }

    if (!user) {
      throw new Error('User creation failed: no user returned')
    }

    console.log('Initial user created successfully:', user.user_metadata?.name)
  } catch (error) {
    console.error('Error creating initial user:', error)
  }
}

setupInitialUser() 