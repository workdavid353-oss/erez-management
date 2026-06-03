import { createClient } from '@supabase/supabase-js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/admin-user' && request.method === 'POST') {
      return handleAdminUser(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleAdminUser(request, env) {
  const json = { 'Content-Type': 'application/json' }
  try {
    const { action, ...payload } = await request.json()

    const supabase = createClient(
      env.VITE_SUPABASE_URL,
      env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (action === 'create') {
      const { data, error } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: payload.full_name,
        role: payload.role,
      })
      return new Response(JSON.stringify({ user: data.user }), { headers: json })
    }

    if (action === 'delete') {
      const { error } = await supabase.auth.admin.deleteUser(payload.userId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: json })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: json })
  }
}
