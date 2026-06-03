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
    const base = env.VITE_SUPABASE_URL
    const key  = env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const h    = { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` }

    if (action === 'create') {
      const authRes  = await fetch(`${base}/auth/v1/admin/users`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ email: payload.email, password: payload.password, email_confirm: true }),
      })
      const authData = await authRes.json()
      if (!authRes.ok) return new Response(JSON.stringify({ error: authData.msg || authData.message }), { status: 400, headers: json })

      await fetch(`${base}/rest/v1/profiles`, {
        method: 'POST',
        headers: { ...h, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: authData.id, full_name: payload.full_name, role: payload.role }),
      })
      return new Response(JSON.stringify({ user: authData }), { headers: json })
    }

    if (action === 'delete') {
      const res = await fetch(`${base}/auth/v1/admin/users/${payload.userId}`, { method: 'DELETE', headers: h })
      if (!res.ok) {
        const d = await res.json()
        return new Response(JSON.stringify({ error: d.msg || d.message }), { status: 400, headers: json })
      }
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: json })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: json })
  }
}
