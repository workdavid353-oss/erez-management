export async function onRequestPost(context) {
  const { action, ...payload } = await context.request.json()
  const url = context.env.VITE_SUPABASE_URL
  const key = context.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }

  try {
    if (action === 'create') {
      const authRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: payload.email, password: payload.password, email_confirm: true }),
      })
      const authData = await authRes.json()
      if (!authRes.ok) return Response.json({ error: authData.msg || authData.message }, { status: 400 })

      await fetch(`${url}/rest/v1/profiles`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: authData.id, full_name: payload.full_name, role: payload.role }),
      })

      return Response.json({ user: authData })
    }

    if (action === 'delete') {
      const res = await fetch(`${url}/auth/v1/admin/users/${payload.userId}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const data = await res.json()
        return Response.json({ error: data.msg || data.message }, { status: 400 })
      }
      return Response.json({ success: true })
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
