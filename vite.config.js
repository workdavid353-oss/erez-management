import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Corporate SSL proxy — allow self-signed certs in Node.js dev middleware
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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

            if (action === 'startWork') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/case_assignments?id=eq.${payload.taskId}`, {
                method: 'PATCH', headers: hdrs(),
                body: JSON.stringify({ work_start: new Date().toISOString(), status: 'בטיפול', updated_at: new Date().toISOString() }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }
              return send({ success: true })
            }

            if (action === 'pauseWork') {
              const now          = new Date()
              const sessionHours = Math.round((now - new Date(payload.workStart)) / 36000) / 100
              const newTotal     = Math.round(((payload.prevHours || 0) + sessionHours) * 100) / 100
              const r = await fetch(`${SUPABASE_URL}/rest/v1/case_assignments?id=eq.${payload.taskId}`, {
                method: 'PATCH', headers: hdrs(),
                body: JSON.stringify({ work_start: null, work_hours: newTotal, updated_at: now.toISOString() }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }
              return send({ success: true, work_hours: newTotal })
            }

            if (action === 'finishWork') {
              const now      = new Date()
              let   newTotal = payload.prevHours || 0
              if (payload.workStart) {
                const sessionHours = Math.round((now - new Date(payload.workStart)) / 36000) / 100
                newTotal = Math.round((newTotal + sessionHours) * 100) / 100
              }
              await fetch(`${SUPABASE_URL}/rest/v1/case_assignments?id=eq.${payload.taskId}`, {
                method: 'PATCH', headers: hdrs(),
                body: JSON.stringify({ work_start: null, work_end: now.toISOString(), work_hours: newTotal, status: 'בוצע', updated_at: now.toISOString() }),
              })
              const tRes  = await fetch(`${SUPABASE_URL}/rest/v1/case_assignments?case_id=eq.${payload.caseId}&work_hours=not.is.null&select=work_hours`, { headers: hdrs() })
              const tasks = await tRes.json()
              const caseTotal = Math.round((tasks || []).reduce((s, t) => s + (t.work_hours || 0), 0) * 100) / 100
              await fetch(`${SUPABASE_URL}/rest/v1/cases?id=eq.${payload.caseId}`, {
                method: 'PATCH', headers: hdrs(), body: JSON.stringify({ work_hours: caseTotal }),
              })
              return send({ success: true, work_hours: newTotal })
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
                task_type:   payload.taskType ? `${payload.taskType} - בדיקה סופית` : 'בדיקה סופית',
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

            if (action === 'getFeedback') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/feedback?order=created_at.desc`, { headers: hdrs() })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }
              return send({ data: await r.json() })
            }

            if (action === 'getSetting') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.${payload.key}&select=value`, { headers: hdrs() })
              const d = await r.json()
              return send({ value: d?.[0]?.value || null })
            }

            if (action === 'saveSetting') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify({ key: payload.key, value: payload.value }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }
              return send({ success: true })
            }

            if (action === 'updateFeedbackStatus') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${payload.id}`, {
                method: 'PATCH',
                headers: hdrs(),
                body: JSON.stringify({ status: payload.status }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }
              return send({ success: true })
            }

            if (action === 'sendFeedbackEmail') {
              const sRes = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.feedback_email&select=value`, { headers: hdrs() })
              const sData = await sRes.json()
              const notifyEmail = sData?.[0]?.value
              const RESEND_KEY  = env.VITE_RESEND_API_KEY
              console.log('[sendFeedbackEmail] notifyEmail:', notifyEmail, '| hasKey:', !!RESEND_KEY)
              if (!notifyEmail || !RESEND_KEY) return send({ success: true })

              const typeLabel = payload.type === 'bug' ? '🐛 באג' : "✨ פיצ'ר"
              const emailRes  = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
                body: JSON.stringify({
                  from:    'Erez Legal <onboarding@resend.dev>',
                  to:      [notifyEmail],
                  subject: `[Erez Legal] פנייה חדשה: ${typeLabel} — ${payload.title}`,
                  html: `<div dir="rtl" style="font-family:sans-serif;max-width:500px"><h2>פנייה חדשה מ-${payload.userName || 'משתמש'}</h2><p><strong>סוג:</strong> ${typeLabel}</p><p><strong>כותרת:</strong> ${payload.title}</p>${payload.description ? `<p><strong>תיאור:</strong><br>${payload.description.replace(/\n/g, '<br>')}</p>` : ''}</div>`,
                }),
              })
              const emailData = await emailRes.json()
              console.log('[sendFeedbackEmail] Resend response:', emailRes.status, JSON.stringify(emailData))
              return send({ success: true })
            }

            if (action === 'submitFeedback') {
              const r = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'return=minimal' },
                body: JSON.stringify({
                  user_id:     payload.userId     || null,
                  user_name:   payload.userName   || null,
                  type:        payload.type,
                  title:       payload.title,
                  description: payload.description || null,
                }),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Failed' }, 400) }

              // send email notification if configured
              const sRes = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.feedback_email&select=value`, { headers: hdrs() })
              const sData = await sRes.json()
              const notifyEmail = sData?.[0]?.value
              const RESEND_KEY  = env.VITE_RESEND_API_KEY
              if (notifyEmail && RESEND_KEY) {
                const typeLabel = payload.type === 'bug' ? '🐛 באג' : "✨ פיצ'ר"
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
                  body: JSON.stringify({
                    from:    'Erez Legal <onboarding@resend.dev>',
                    to:      [notifyEmail],
                    subject: `[Erez Legal] פנייה חדשה: ${typeLabel} — ${payload.title}`,
                    html: `<div dir="rtl" style="font-family:sans-serif;max-width:500px"><h2>פנייה חדשה מ-${payload.userName || 'משתמש'}</h2><p><strong>סוג:</strong> ${typeLabel}</p><p><strong>כותרת:</strong> ${payload.title}</p>${payload.description ? `<p><strong>תיאור:</strong><br>${payload.description.replace(/\n/g, '<br>')}</p>` : ''}</div>`,
                  }),
                }).catch(() => {})
              }
              return send({ success: true })
            }

            if (action === 'updateCaseLocation') {
              const r = await fetch(
                `${SUPABASE_URL}/rest/v1/cases?id=eq.${payload.caseId}`,
                {
                  method: 'PATCH',
                  headers: hdrs(),
                  body: JSON.stringify({ physical_location: payload.physical_location ?? null }),
                }
              )
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'Update failed' }, 400) }
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

            if (action === 'restore') {
              const ALLOWED = ['cases', 'case_assignments', 'profiles']
              if (!ALLOWED.includes(payload.table)) return send({ error: 'טבלה לא מותרת' }, 400)
              const r = await fetch(`${SUPABASE_URL}/rest/v1/${payload.table}`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify(payload.old_data),
              })
              if (!r.ok) { const d = await r.json(); return send({ error: d.message || 'שחזור נכשל' }, 400) }
              await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
                method: 'POST',
                headers: { ...hdrs(), Prefer: 'return=minimal' },
                body: JSON.stringify({
                  table_name: payload.table,
                  operation:  'RESTORE',
                  row_id:     payload.row_id,
                  old_data:   payload.old_data,
                  changed_by: payload.restored_by || null,
                }),
              })
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
