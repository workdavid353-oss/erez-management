import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function adminApiDevPlugin(env) {
  const SUPABASE_URL = env.VITE_SUPABASE_URL
  const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const hdrs = () => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  })

  return {
    name: 'admin-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/admin-user', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        let body = ''
        req.on('data', d => { body += d })
        req.on('end', async () => {
          const send = (data, status = 200) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(data))
          }
          try {
            const { action, ...payload } = JSON.parse(body)

            if (action === 'create') {
              const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
                method: 'POST',
                headers: hdrs(),
                body: JSON.stringify({ email: payload.email, password: payload.password, email_confirm: true }),
              })
              const d = await r.json()
              if (!r.ok) return send({ error: d.msg || d.message || 'Create failed' }, 400)

              await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'resolution=merge-duplicates' },
                body: JSON.stringify({ id: d.id, full_name: payload.full_name, role: payload.role }),
              })
              return send({ user: d })
            }

            if (action === 'delete') {
              const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${payload.userId}`, {
                method: 'DELETE',
                headers: hdrs(),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.msg || d.message }, 400) }
              return send({ success: true })
            }

            if (action === 'createFinalCheckTasks') {
              const ownersRes = await fetch(
                `${SUPABASE_URL}/rest/v1/profiles?role=eq.owner&select=id`,
                { headers: hdrs() }
              )
              const owners = await ownersRes.json()
              if (!owners?.length) return send({ success: true })

              const rows = owners.map(o => ({
                case_id:     payload.caseId,
                employee_id: o.id,
                task_type:   'בדיקה סופית',
                status:      'חדש',
                priority:    'גבוהה',
                updated_at:  new Date().toISOString(),
              }))
              const r = await fetch(`${SUPABASE_URL}/rest/v1/case_assignments`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'return=minimal' },
                body: JSON.stringify(rows),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Insert failed' }, 400) }
              return send({ success: true })
            }

            if (action === 'addTask') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/case_assignments`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'return=minimal' },
                body: JSON.stringify({
                  case_id:     payload.case_id,
                  employee_id: payload.employee_id,
                  task_type:   payload.task_type   || null,
                  status:      payload.status      || 'חדש',
                  priority:    payload.priority    || null,
                  target_date: payload.target_date || null,
                  notes:       payload.notes       || null,
                  updated_at:  new Date().toISOString(),
                }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Insert failed' }, 400) }
              return send({ success: true })
            }

            if (action === 'updateProfile') {
              const r = await fetch(
                `${SUPABASE_URL}/rest/v1/profiles?id=eq.${payload.userId}`,
                {
                  method: 'PATCH',
                  headers: hdrs(),
                  body: JSON.stringify({ full_name: payload.full_name, role: payload.role }),
                }
              )
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Update failed' }, 400) }
              return send({ success: true })
            }

            send({ error: 'Unknown action' }, 400)
          } catch (e) {
            send({ error: e.message }, 500)
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), adminApiDevPlugin(env)],
    server: {
      host: true,
      port: 5173,
    },
  }
})
