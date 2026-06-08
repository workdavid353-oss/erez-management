import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, STATUS_ORDER, fmtDate, fmtDateTime, initials } from '../lib/helpers'
import { createFinalCheckTasks } from '../lib/taskUtils'
import { IcChevron, IcEdit, IcPlus, IcCheck, IcX, IcTrash } from '../components/Icons'

const CATEGORIES = ['אזרחי', 'פלילי', 'מסחרי', 'משפחה', 'נדל"ן', 'עבודה']
const STATUS_OPTIONS = ['חדש', 'בטיפול', 'דחוף', 'ממתין', 'הושלם', 'סגור']
const PRIORITY_OPTIONS = ['גבוהה', 'בינונית', 'נמוכה']

function ConfirmModal({ title, message, confirmLabel = 'אישור', danger = false, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button
            className="btn primary"
            style={danger ? { background: 'var(--status-urgent)', borderColor: 'var(--status-urgent)' } : {}}
            onClick={onConfirm}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function EditCaseModal({ caseData, onSave, onClose }) {
  const [form, setForm] = useState({ ...caseData })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    const { error } = await supabase.from('cases').update({
      name: form.name, court_case_number: form.court_case_number,
      category: form.category, status: form.status,
      subject: form.subject, additional_info: form.additional_info,
    }).eq('id', form.id)
    if (!error) onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>עריכת תיק</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field-grid">
            <div className="field">
              <span className="label">שם התיק</span>
              <input className="field-input-el" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">מספר בית משפט</span>
              <input className="field-input-el" value={form.court_case_number || ''} onChange={e => set('court_case_number', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">קטגוריה</span>
              <select className="field-input-el" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">— בחר —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">סטטוס</span>
              <select className="field-input-el" value={form.status || ''} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">נושא</span>
              <input className="field-input-el" value={form.subject || ''} onChange={e => set('subject', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">מידע נוסף / הערות</span>
              <textarea className="field-input-el" rows={3} value={form.additional_info || ''} onChange={e => set('additional_info', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={handleSave}>שמור שינויים</button>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ caseId, onClose, onSaved }) {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employee_id: '', task_type: '', status: 'חדש', priority: '', target_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']).order('full_name')
      .then(({ data }) => setEmployees(data || []))
  }, [])

  async function handleSave() {
    if (!form.employee_id) return
    setSaving(true)
    const { data, error } = await supabase.from('case_assignments').insert({
      case_id: caseId,
      employee_id: form.employee_id,
      task_type: form.task_type || null,
      status: form.status,
      priority: form.priority || null,
      target_date: form.target_date || null,
      notes: form.notes || null,
    }).select('*, employee:employee_id(id, full_name)').single()
    setSaving(false)
    if (!error) { onSaved(data); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>הוסף משימה לתיק</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body">
          <div className="field-grid">
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">עובד אחראי *</span>
              <select className="field-input-el" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                <option value="">— בחר עובד —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">סוג / תיאור המשימה</span>
              <input className="field-input-el" placeholder="לדוגמה: ייצוג בדיון, הכנת כתב תביעה..." value={form.task_type} onChange={e => set('task_type', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">סטטוס</span>
              <select className="field-input-el" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">עדיפות</span>
              <select className="field-input-el" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="">— בחר —</option>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">תאריך יעד</span>
              <input type="date" className="field-input-el" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">הערות</span>
              <textarea className="field-input-el" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={handleSave} disabled={saving || !form.employee_id}>
            {saving ? 'שומר...' : 'הוסף משימה'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ assignment, canEdit, onUpdate, onDelete, onNewTasks }) {
  const [expanded,  setExpanded]  = useState(false)
  const [employees, setEmployees] = useState([])
  const toLocal   = (iso) => iso ? iso.slice(0, 16) : ''
  const calcHours = (from, to) => {
    if (!from || !to) return null
    const diff = new Date(to) - new Date(from)
    return diff > 0 ? Math.round(diff / 36000) / 100 : null
  }

  const [form, setForm] = useState({
    employee_id: assignment.employee_id || '',
    status:      assignment.status      || 'חדש',
    priority:    assignment.priority    || '',
    notes:       assignment.notes       || '',
    target_date: assignment.target_date || '',
    task_type:   assignment.task_type   || '',
    work_start:  toLocal(assignment.work_start),
    work_end:    toLocal(assignment.work_end),
  })

  const calculatedHours = calcHours(form.work_start, form.work_end)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openEdit() {
    if (employees.length === 0) {
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']).order('full_name')
        .then(({ data }) => setEmployees(data || []))
    }
    setExpanded(e => !e)
  }

  const isOverdue = assignment.target_date && new Date(assignment.target_date) < new Date() && assignment.status !== 'בוצע'

  async function handleSave() {
    const hours   = calcHours(form.work_start, form.work_end) ?? assignment.work_hours ?? null
    const payload = {
      ...form,
      work_start: form.work_start || null,
      work_end:   form.work_end   || null,
      work_hours: hours,
    }
    const { error } = await supabase.from('case_assignments').update(payload).eq('id', assignment.id)
    if (!error) {
      const updatedEmployee = employees.find(e => e.id === form.employee_id) || assignment.employee
      onUpdate({ ...assignment, ...form, work_hours: hours, employee: updatedEmployee })
      setExpanded(false)
      if (form.status === 'בוצע' && assignment.status !== 'בוצע' && assignment.task_type !== 'בדיקה סופית') {
        const newTasks = await createFinalCheckTasks(assignment.case_id, assignment.task_type)
        if (newTasks.length > 0) onNewTasks?.(newTasks)
      }
    }
  }

  async function markDone() {
    const { error } = await supabase.from('case_assignments').update({ status: 'בוצע' }).eq('id', assignment.id)
    if (!error) {
      onUpdate({ ...assignment, status: 'בוצע' })
      if (assignment.task_type !== 'בדיקה סופית') {
        const newTasks = await createFinalCheckTasks(assignment.case_id, assignment.task_type)
        if (newTasks.length > 0) onNewTasks?.(newTasks)
      }
    }
  }

  const cls = STATUS_CLASS[assignment.status] || 'pending'

  return (
    <>
      <tr className={isOverdue ? 'urgent-row' : ''}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="avatar">{initials(assignment.employee?.full_name || '?')}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{assignment.employee?.full_name || '—'}</span>
          </div>
        </td>
        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{assignment.task_type || '—'}</td>
        <td><span className={'status-cell ' + cls}><span className="dot" />{assignment.status || 'חדש'}</span></td>
        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{assignment.priority || '—'}</td>
        <td>
          {assignment.work_hours != null
            ? <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assignment.work_hours} שע׳</span>
            : assignment.work_start && !assignment.work_end
              ? <span style={{ fontSize: 11, color: 'var(--status-progress)', fontWeight: 600 }}>⏱ בעבודה</span>
              : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
          }
        </td>
        <td>
          <span className={'due mono' + (isOverdue ? ' overdue' : '')} style={{ fontSize: 12 }}>
            {fmtDate(assignment.target_date) || '—'}
          </span>
        </td>
        <td onClick={e => e.stopPropagation()}>
          <div className="row-actions">
            {canEdit && assignment.status !== 'בוצע' && (
              <button className="icon-btn" title="סמן כהושלם" onClick={markDone}><IcCheck size={13} /></button>
            )}
            {canEdit && (
              <button
                className="icon-btn"
                title={expanded ? 'סגור עריכה' : 'ערוך'}
                style={expanded ? { color: 'var(--brass)' } : {}}
                onClick={openEdit}
              ><IcEdit size={13} /></button>
            )}
            {canEdit && (
              <button className="icon-btn" title="מחק משימה" style={{ color: 'var(--status-urgent)' }} onClick={onDelete}>
                <IcTrash size={13} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '14px 20px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
            <div className="field-grid">
              <div className="field">
                <span className="label">עובד אחראי</span>
                <select className="field-input-el" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="label">סוג / תיאור המשימה</span>
                <input className="field-input-el" value={form.task_type} onChange={e => set('task_type', e.target.value)} />
              </div>
              <div className="field">
                <span className="label">סטטוס</span>
                <select className="field-input-el" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="label">עדיפות</span>
                <select className="field-input-el" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="">— בחר —</option>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="label">תאריך יעד</span>
                <input type="date" className="field-input-el" value={form.target_date || ''} onChange={e => set('target_date', e.target.value)} />
              </div>
              <div className="field">
                <span className="label">התחלת עבודה</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input className="field-input-el" type="date" style={{ flex: 1, colorScheme: 'var(--color-scheme, light)' }}
                    value={form.work_start?.slice(0, 10) || ''}
                    onChange={e => set('work_start', e.target.value + 'T' + (form.work_start?.slice(11, 16) || '00:00'))} />
                  <input className="field-input-el" type="time" style={{ width: 90, colorScheme: 'var(--color-scheme, light)' }}
                    value={form.work_start?.slice(11, 16) || ''}
                    onChange={e => set('work_start', (form.work_start?.slice(0, 10) || new Date().toISOString().slice(0, 10)) + 'T' + e.target.value)} />
                </div>
              </div>
              <div className="field">
                <span className="label">סיום עבודה</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input className="field-input-el" type="date" style={{ flex: 1, colorScheme: 'var(--color-scheme, light)' }}
                    value={form.work_end?.slice(0, 10) || ''}
                    onChange={e => set('work_end', e.target.value + 'T' + (form.work_end?.slice(11, 16) || '00:00'))} />
                  <input className="field-input-el" type="time" style={{ width: 90, colorScheme: 'var(--color-scheme, light)' }}
                    value={form.work_end?.slice(11, 16) || ''}
                    onChange={e => set('work_end', (form.work_end?.slice(0, 10) || new Date().toISOString().slice(0, 10)) + 'T' + e.target.value)} />
                </div>
              </div>
              <div className="field">
                <span className="label">סה"כ שעות</span>
                <div className="field-input-el" style={{ background: 'var(--bg-2)', color: calculatedHours != null ? 'var(--text)' : 'var(--text-dim)', cursor: 'default' }}>
                  {calculatedHours != null ? `${calculatedHours} שע׳` : '—'}
                </div>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <span className="label">הערות</span>
                <textarea className="field-input-el" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn sm" onClick={() => setExpanded(false)}>ביטול</button>
                <button className="btn sm primary" onClick={handleSave}>שמור</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function PhysicalLocationCard({ caseId, value }) {
  const [editing,  setEditing]  = useState(false)
  const [location, setLocation] = useState(value || '')
  const [saved,    setSaved]    = useState(value || '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateCaseLocation', caseId, physical_location: location || null }),
      })
      const result = await res.json()
      if (result.error) { setError(result.error); setSaving(false); return }
      setSaved(location)
      setEditing(false)
    } catch {
      setError('שגיאת חיבור לשרת')
    }
    setSaving(false)
  }

  function handleCancel() {
    setLocation(saved)
    setEditing(false)
    setError('')
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>מיקום פיזי</h3>
        {!editing && (
          <button className="btn sm" onClick={() => setEditing(true)}>
            <IcEdit size={12} /> ערוך
          </button>
        )}
      </div>
      <div className="card-body">
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="field-input-el"
              placeholder="לדוגמה: ארון 3, מדף עליון, תיקיה כחולה"
              value={location}
              onChange={e => setLocation(e.target.value)}
              autoFocus
            />
            {error && (
              <div style={{ fontSize: 12, color: 'var(--status-urgent)' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn sm" onClick={handleCancel}>ביטול</button>
              <button className="btn sm primary" onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📁</span>
            <span style={{ color: saved ? 'var(--text)' : 'var(--text-dim)', fontSize: 13 }}>
              {saved || 'לא הוגדר מיקום פיזי'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CaseDetailPage({ caseId, onBack }) {
  const { isAdmin, user } = useAuth()
  const [c,                 setC]              = useState(null)
  const [assignments,       setAssign]         = useState([])
  const [editOpen,          setEdit]           = useState(false)
  const [addTaskOpen,       setAddTaskOpen]    = useState(false)
  const [confirmDeleteCase, setConfirmDeleteCase] = useState(false)
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null)
  const [loading,           setLoading]        = useState(true)

  useEffect(() => {
    if (!caseId) return
    async function load() {
      const [caseRes, assignRes] = await Promise.all([
        supabase.from('cases').select('*, updater:updated_by(id, full_name)').eq('id', caseId).single(),
        supabase.from('case_assignments').select('*, employee:employee_id(id, full_name)').eq('case_id', caseId).order('created_at'),
      ])
      setC(caseRes.data)
      setAssign(assignRes.data || [])
      setLoading(false)
    }
    load()
  }, [caseId])

  async function handleDeleteCase() {
    await supabase.from('cases').delete().eq('id', caseId)
    onBack()
  }

  async function handleDeleteTask(taskId) {
    const { error } = await supabase.from('case_assignments').delete().eq('id', taskId)
    if (!error) setAssign(prev => prev.filter(a => a.id !== taskId))
    setConfirmDeleteTask(null)
  }

  function handleAssignUpdate(updated) {
    setAssign(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
  }

  function handleNewTasks(newTasks) {
    setAssign(prev => [...prev, ...newTasks])
  }

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען תיק...</div>
  if (!c) return <div className="page"><button className="btn ghost sm" onClick={onBack}><IcChevron size={13} /> חזרה</button><p>תיק לא נמצא</p></div>

  const cls = STATUS_CLASS[c.status] || 'pending'

  return (
    <div className="page">
      {editOpen && <EditCaseModal caseData={c} onSave={updated => { setC(updated); setEdit(false) }} onClose={() => setEdit(false)} />}
      {addTaskOpen && (
        <AddTaskModal
          caseId={caseId}
          onClose={() => setAddTaskOpen(false)}
          onSaved={newTask => setAssign(prev => [...prev, newTask])}
        />
      )}
      {confirmDeleteCase && (
        <ConfirmModal
          title="מחיקת תיק"
          message={`האם למחוק את התיק "${c.name}"? פעולה זו תמחק גם את כל המשימות המשויכות ואינה ניתנת לביטול.`}
          confirmLabel="מחק תיק"
          danger
          onConfirm={handleDeleteCase}
          onClose={() => setConfirmDeleteCase(false)}
        />
      )}
      {confirmDeleteTask && (
        <ConfirmModal
          title="מחיקת משימה"
          message="האם למחוק את המשימה? פעולה זו אינה ניתנת לביטול."
          confirmLabel="מחק משימה"
          danger
          onConfirm={() => handleDeleteTask(confirmDeleteTask)}
          onClose={() => setConfirmDeleteTask(null)}
        />
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <button className="btn ghost sm" onClick={onBack}><IcChevron size={13} /> חזרה ללוח הבקרה</button>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span>תיק <span className="mono">{c.serial_number}</span></span>
      </div>

      <div className="page-header">
        <div>
          <div className="eyebrow">{c.category || 'ללא קטגוריה'} · נפתח {fmtDate(c.created_at)}</div>
          <h1>{c.name}</h1>
          <div className="sub">{c.subject || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={'status-cell ' + cls}><span className="dot" />{c.status}</span>
          {isAdmin && <button className="btn" onClick={() => setEdit(true)}><IcEdit size={14} /> ערוך פרטים</button>}
          {isAdmin && (
            <button className="btn" style={{ color: 'var(--status-urgent)' }} onClick={() => setConfirmDeleteCase(true)}>
              <IcTrash size={14} /> מחק תיק
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <div className="card">
            <div className="card-head">
              <h3>פרטי תיק</h3>
              {isAdmin && <button className="btn sm" onClick={() => setEdit(true)}><IcEdit size={12} /> ערוך</button>}
            </div>
            <div className="card-body">
              <div className="field-grid">
                <div className="field"><span className="label">שם התיק</span><span className="value">{c.name}</span></div>
                <div className="field"><span className="label">מספר בית משפט</span><span className="value mono">{c.court_case_number || '—'}</span></div>
                <div className="field"><span className="label">קטגוריה</span><span className="value">{c.category || '—'}</span></div>
                <div className="field"><span className="label">תאריך פתיחה</span><span className="value mono">{fmtDate(c.created_at)}</span></div>
                <div className="field" style={{ gridColumn: '1/-1' }}><span className="label">נושא</span><span className="value">{c.subject || '—'}</span></div>
                <div className="field" style={{ gridColumn: '1/-1' }}><span className="label">מידע נוסף</span><span className="value">{c.additional_info || '—'}</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>
                משימות
                {assignments.length > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400, marginRight: 6 }}>({assignments.length})</span>
                )}
              </h3>
              {isAdmin && (
                <button className="btn sm" onClick={() => setAddTaskOpen(true)}>
                  <IcPlus size={12} /> הוסף משימה
                </button>
              )}
            </div>
            {assignments.length === 0 ? (
              <div className="card-body" style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 32 }}>
                אין משימות לתיק זה עדיין
              </div>
            ) : (
              <div className="table-wrap" style={{ marginTop: 0, borderRadius: 0, border: 'none', borderTop: '1px solid var(--line)' }}>
                <table className="cases" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 160 }}>עובד</th>
                      <th>משימה</th>
                      <th>סטטוס</th>
                      <th>עדיפות</th>
                      <th>שעות עבודה</th>
                      <th>תאריך יעד</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...assignments].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)).map(a => (
                      <TaskRow
                        key={a.id}
                        assignment={a}
                        canEdit={isAdmin || a.employee_id === user?.id}
                        onUpdate={handleAssignUpdate}
                        onDelete={() => setConfirmDeleteTask(a.id)}
                        onNewTasks={handleNewTasks}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="card-head">
              <h3>לוג עדכונים</h3>
            </div>
            <ul className="timeline">
              <li>
                <span className="tl-dot" />
                <div className="content">
                  <div className="head"><strong>{c.updater?.full_name || 'מערכת'}</strong> עדכן את התיק לאחרונה</div>
                  <div className="meta mono">{fmtDateTime(c.updated_at)}</div>
                </div>
              </li>
              <li>
                <span className="tl-dot" />
                <div className="content">
                  <div className="head">התיק נפתח במערכת</div>
                  <div className="meta mono">{fmtDateTime(c.created_at)}</div>
                </div>
              </li>
            </ul>
          </div>

          <PhysicalLocationCard caseId={c.id} value={c.physical_location} />
        </div>
      </div>
    </div>
  )
}
