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

    if (action === 'startWork') {
      const { error } = await supabase.from('case_assignments').update({
        work_start: new Date().toISOString(),
        status:     'בטיפול',
        updated_at: new Date().toISOString(),
      }).eq('id', payload.taskId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'pauseWork') {
      const now          = new Date()
      const sessionHours = Math.round((now - new Date(payload.workStart)) / 36000) / 100
      const newTotal     = Math.round(((payload.prevHours || 0) + sessionHours) * 100) / 100
      const { error } = await supabase.from('case_assignments').update({
        work_start:  null,
        work_hours:  newTotal,
        updated_at:  now.toISOString(),
      }).eq('id', payload.taskId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true, work_hours: newTotal }), { headers: json })
    }

    if (action === 'finishWork') {
      const now      = new Date()
      let   newTotal = payload.prevHours || 0
      if (payload.workStart) {
        const sessionHours = Math.round((now - new Date(payload.workStart)) / 36000) / 100
        newTotal = Math.round((newTotal + sessionHours) * 100) / 100
      }
      const { error } = await supabase.from('case_assignments').update({
        work_start:  null,
        work_end:    now.toISOString(),
        work_hours:  newTotal,
        status:      'בוצע',
        updated_at:  now.toISOString(),
      }).eq('id', payload.taskId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })

      const { data: tasks } = await supabase.from('case_assignments')
        .select('work_hours').eq('case_id', payload.caseId).not('work_hours', 'is', null)
      const caseTotal = Math.round((tasks || []).reduce((s, t) => s + (t.work_hours || 0), 0) * 100) / 100
      await supabase.from('cases').update({ work_hours: caseTotal }).eq('id', payload.caseId)

      return new Response(JSON.stringify({ success: true, work_hours: newTotal }), { headers: json })
    }

    if (action === 'createFinalCheckTasks') {
      const { data: owners } = await supabase
        .from('profiles').select('id').eq('role', 'owner')
      if (!owners?.length) return new Response(JSON.stringify({ success: true }), { headers: json })

      const rows = owners.map(o => ({
        case_id:     payload.caseId,
        employee_id: o.id,
        task_type:   payload.taskType ? `${payload.taskType} - בדיקה סופית` : 'בדיקה סופית',
        status:      'חדש',
        priority:    'גבוהה',
        updated_at:  new Date().toISOString(),
      }))
      const { error } = await supabase.from('case_assignments').insert(rows)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'addTask') {
      const { error } = await supabase.from('case_assignments').insert({
        case_id:     payload.case_id,
        employee_id: payload.employee_id,
        task_type:   payload.task_type   || null,
        status:      payload.status      || 'חדש',
        priority:    payload.priority    || null,
        target_date: payload.target_date || null,
        notes:       payload.notes       || null,
        updated_at:  new Date().toISOString(),
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'sendFeedbackEmail') {
      const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'feedback_email').single()
      const notifyEmail = setting?.value
      if (!notifyEmail || !env.RESEND_API_KEY) return new Response(JSON.stringify({ success: true }), { headers: json })

      const typeLabel = payload.type === 'bug' ? '🐛 באג' : "✨ פיצ'ר"
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from:    'Erez Legal <onboarding@resend.dev>',
          to:      [notifyEmail],
          subject: `[Erez Legal] פנייה חדשה: ${typeLabel} — ${payload.title}`,
          html: `<div dir="rtl" style="font-family:sans-serif;max-width:500px">
            <h2>פנייה חדשה מ-${payload.userName || 'משתמש'}</h2>
            <p><strong>סוג:</strong> ${typeLabel}</p>
            <p><strong>כותרת:</strong> ${payload.title}</p>
            ${payload.description ? `<p><strong>תיאור:</strong><br>${payload.description.replace(/\n/g, '<br>')}</p>` : ''}
          </div>`,
        }),
      })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'getFeedback') {
      const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ data }), { headers: json })
    }

    if (action === 'getSetting') {
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', payload.key).single()
      if (error && error.code !== 'PGRST116') return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ value: data?.value || null }), { headers: json })
    }

    if (action === 'saveSetting') {
      const { error } = await supabase.from('app_settings').upsert({ key: payload.key, value: payload.value })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'updateFeedbackStatus') {
      const { error } = await supabase.from('feedback').update({ status: payload.status }).eq('id', payload.id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'submitFeedback') {
      const { error } = await supabase.from('feedback').insert({
        user_id:     payload.userId     || null,
        user_name:   payload.userName   || null,
        type:        payload.type,
        title:       payload.title,
        description: payload.description || null,
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })

      // send email notification if configured
      const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'feedback_email').single()
      const notifyEmail = setting?.value
      if (notifyEmail && env.RESEND_API_KEY) {
        const typeLabel = payload.type === 'bug' ? '🐛 באג' : "✨ פיצ'ר"
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from:    'Erez Legal <onboarding@resend.dev>',
            to:      [notifyEmail],
            subject: `[Erez Legal] פנייה חדשה: ${typeLabel} — ${payload.title}`,
            html: `
              <div dir="rtl" style="font-family:sans-serif;max-width:500px">
                <h2>פנייה חדשה מ-${payload.userName || 'משתמש'}</h2>
                <p><strong>סוג:</strong> ${typeLabel}</p>
                <p><strong>כותרת:</strong> ${payload.title}</p>
                ${payload.description ? `<p><strong>תיאור:</strong><br>${payload.description.replace(/\n/g, '<br>')}</p>` : ''}
              </div>`,
          }),
        }).catch(() => {})
      }

      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'updateCaseLocation') {
      const { error } = await supabase.from('cases')
        .update({ physical_location: payload.physical_location ?? null })
        .eq('id', payload.caseId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'updateProfile') {
      const { error } = await supabase.from('profiles').update({
        full_name: payload.full_name,
        role:      payload.role,
      }).eq('id', payload.userId)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: json })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    if (action === 'restore') {
      const ALLOWED = ['cases', 'case_assignments', 'profiles']
      if (!ALLOWED.includes(payload.table))
        return new Response(JSON.stringify({ error: 'טבלה לא מותרת' }), { status: 400, headers: json })
      const { error: upsertErr } = await supabase.from(payload.table).upsert(payload.old_data)
      if (upsertErr)
        return new Response(JSON.stringify({ error: upsertErr.message }), { status: 400, headers: json })
      await supabase.from('audit_log').insert({
        table_name: payload.table,
        operation:  'RESTORE',
        row_id:     payload.row_id,
        old_data:   payload.old_data,
        changed_by: payload.restored_by || null,
      })
      return new Response(JSON.stringify({ success: true }), { headers: json })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: json })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: json })
  }
}
