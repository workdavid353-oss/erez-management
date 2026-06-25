import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, STATUS_ORDER, fmtDate } from '../lib/helpers'
import { createFinalCheckTasks } from '../lib/taskUtils'
import { IcTasks, IcAlert, IcClock, IcCheck, IcPlus, IcX, IcEdit, IcSearch } from '../components/Icons'

const STATUS_OPTIONS   = ['חדש', 'בטיפול', 'בוצע', 'ממתין']
const PRIORITY_OPTIONS = ['גבוהה', 'בינונית', 'נמוכה']

function StatCard({ icon: I, label, value, delta, down }) {
  return (
    <div className="stat-card">
      <div className="accent-bar" />
      <div className="label"><I size={13} /> {label}</div>
      <div className="value">{value}</div>
      <div className={'delta' + (down ? ' down' : '')}>{delta}</div>
    </div>
  )
}

function AddTaskModal({ onClose, onSaved, currentUser, isAdmin }) {
  const [cases,     setCases]     = useState([])
  const [employees, setEmployees] = useState([])
  const [form,      setForm]      = useState({
    case_id:     '',
    employee_id: isAdmin ? '' : currentUser?.id,
    task_type:   '',
    status:      'חדש',
    priority:    'בינונית',
    target_date: '',
    notes:       '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      supabase.from('cases').select('id, name, serial_number').order('serial_number'),
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'sysadmin', 'owner']).order('full_name'),
    ]).then(([cRes, eRes]) => {
      setCases(cRes.data || [])
      setEmployees(eRes.data || [])
    })
  }, [])

  async function handleSubmit() {
    if (!form.case_id)     { setError('יש לבחור תיק');  return }
    if (!form.employee_id) { setError('יש לבחור עובד'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTask', ...form }),
      })
      const result = await res.json()
      if (result.error) { setError(result.error); setSaving(false); return }
      onSaved()
      onClose()
    } catch {
      setError('שגיאת חיבור לשרת — נסה שוב')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>הוספת משימה</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* תיק */}
          <div className="field-input">
            <label>תיק <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
            <select className="field-input-el" value={form.case_id} onChange={e => set('case_id', e.target.value)}>
              <option value="">בחר תיק...</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>#{c.serial_number} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* עובד */}
          {isAdmin ? (
            <div className="field-input">
              <label>עובד <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
              <select className="field-input-el" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
                <option value="">בחר עובד...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field-input">
              <label>עובד</label>
              <div className="field-input-el" style={{ background: 'var(--bg-2)', color: 'var(--text-muted)', cursor: 'default' }}>
                {currentUser?.full_name || 'אני'}
              </div>
            </div>
          )}

          {/* סוג משימה */}
          <div className="field-input">
            <label>סוג משימה</label>
            <input className="field-input-el" placeholder='נדל"ן, חוזים, בדיקה סופית...' value={form.task_type} onChange={e => set('task_type', e.target.value)} />
          </div>

          {/* סטטוס + עדיפות */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-input">
              <label>סטטוס</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} type="button" className={'chip' + (form.status === s ? ' active' : '')} onClick={() => set('status', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="field-input">
              <label>עדיפות</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p} type="button" className={'chip' + (form.priority === p ? ' active' : '')} onClick={() => set('priority', p)}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* תאריך יעד */}
          <div className="field-input">
            <label>תאריך יעד</label>
            <input
              className="field-input-el"
              type="date"
              value={form.target_date}
              onChange={e => set('target_date', e.target.value)}
              style={{ colorScheme: 'var(--color-scheme, light)' }}
            />
          </div>

          {/* הערות */}
          <div className="field-input">
            <label>הערות</label>
            <textarea className="field-input-el" rows={2} placeholder="הערות פנימיות..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--status-urgent)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--status-urgent)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'שומר...' : 'הוסף משימה'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ t, isOverdue, onMarkDone, onUpdate, onOpenCase }) {
  const [expanded, setExpanded] = useState(false)
  const toLocal = (iso) => iso ? iso.slice(0, 16) : ''
  const calcHours = (from, to) => {
    if (!from || !to) return null
    const diff = new Date(to) - new Date(from)
    return diff > 0 ? Math.round(diff / 36000) / 100 : null
  }

  const [form,     setForm]     = useState({
    status:      t.status      || 'חדש',
    notes:       t.notes       || '',
    target_date: t.target_date || '',
    work_start:  toLocal(t.work_start),
    work_end:    toLocal(t.work_end),
  })
  const [saving,   setSaving]   = useState(false)
  const [rowError, setRowError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const calculatedHours = calcHours(form.work_start, form.work_end)

  const over = isOverdue(t.target_date) && t.status !== 'בוצע'
  const cls  = STATUS_CLASS[t.status] || 'pending'

  const isWorking = t.work_start && !t.work_end

  async function handleStartWork() {
    setSaving(true); setRowError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startWork', taskId: t.id }),
      })
      const result = await res.json()
      if (result.error) { setRowError(result.error); setSaving(false); return }
      onUpdate({ ...t, work_start: new Date().toISOString(), status: 'בטיפול' })
    } catch { setRowError('שגיאת חיבור — נסה לרענן את הדף') }
    setSaving(false)
  }

  async function handlePauseWork() {
    setSaving(true); setRowError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pauseWork', taskId: t.id, workStart: t.work_start, prevHours: t.work_hours || 0 }),
      })
      const result = await res.json()
      if (result.error) { setRowError(result.error); setSaving(false); return }
      onUpdate({ ...t, work_start: null, work_hours: result.work_hours })
    } catch { setRowError('שגיאת חיבור — נסה לרענן את הדף') }
    setSaving(false)
  }

  async function handleFinishWork() {
    setSaving(true); setRowError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finishWork', taskId: t.id, caseId: t.case_id, workStart: t.work_start, prevHours: t.work_hours || 0 }),
      })
      const result = await res.json()
      if (result.error) { setRowError(result.error); setSaving(false); return }
      onUpdate({ ...t, work_start: null, work_end: new Date().toISOString(), work_hours: result.work_hours, status: 'בוצע' })
      if (t.task_type !== 'בדיקה סופית') await createFinalCheckTasks(t.case_id, t.task_type)
    } catch { setRowError('שגיאת חיבור — נסה לרענן את הדף') }
    setSaving(false)
  }

  async function handleSave() {
    setSaving(true)
    setRowError('')
    const hours = calcHours(form.work_start, form.work_end) ?? t.work_hours ?? null
    const { error } = await supabase.from('case_assignments').update({
      status:      form.status,
      notes:       form.notes       || null,
      target_date: form.target_date || null,
      work_start:  form.work_start  || null,
      work_end:    form.work_end    || null,
      work_hours:  hours,
      updated_at:  new Date().toISOString(),
    }).eq('id', t.id)
    setSaving(false)
    if (error) { setRowError(error.message); return }
    onUpdate({ ...t, ...form, work_hours: hours })
    setExpanded(false)
    if (form.status === 'בוצע' && t.status !== 'בוצע' && t.task_type !== 'בדיקה סופית') {
      await createFinalCheckTasks(t.case_id, t.task_type)
    }
  }

  return (
    <>
      <tr className={over ? 'urgent-row' : ''} onClick={() => onOpenCase?.(t.case?.id)}>
        <td>
          <div className="case-name">{t.case?.name || '—'}</div>
          <div className="case-meta mono">#{t.case?.serial_number}</div>
        </td>
        <td style={{ color: 'var(--text-muted)' }}>{t.task_type || '—'}</td>
        <td><span className={'status-cell ' + cls}><span className="dot" />{t.status || 'חדש'}</span></td>
        <td style={{ color: 'var(--text-muted)' }}>{t.priority || '—'}</td>
        <td>
          {t.work_hours != null
            ? <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.work_hours} שע׳</span>
            : isWorking
              ? <span style={{ fontSize: 11, color: 'var(--status-progress)', fontWeight: 600 }}>⏱ בעבודה מ-{new Date(t.work_start).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
              : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
          }
        </td>
        <td><span className={'due mono' + (over ? ' overdue' : '')}>{fmtDate(t.target_date)}</span></td>
        <td style={{ color: 'var(--text-dim)', fontSize: 12, maxWidth: 220 }}>{t.notes || '—'}</td>
        <td onClick={e => e.stopPropagation()}>
          <div className="row-actions">
            {t.status !== 'בוצע' && !isWorking && (
              <button className="icon-btn" title={t.work_hours ? 'המשך עבודה' : 'התחל עבודה'} style={{ color: 'var(--status-progress)' }} onClick={handleStartWork} disabled={saving}>
                <IcClock size={13} />
              </button>
            )}
            {isWorking && (
              <button className="icon-btn" title="עצור — המשך מאוחר יותר" style={{ color: 'var(--text-muted)' }} onClick={handlePauseWork} disabled={saving}>
                ⏸
              </button>
            )}
            {isWorking && (
              <button className="icon-btn" title="סיים וסמן כהושלם" style={{ color: 'var(--brass)' }} onClick={handleFinishWork} disabled={saving}>
                <IcCheck size={13} />
              </button>
            )}
            {t.status !== 'בוצע' && !isWorking && (
              <button className="icon-btn" title="סמן כהושלם" onClick={() => onMarkDone(t.id, t.case?.id, t.task_type)}>
                <IcCheck size={13} />
              </button>
            )}
            <button
              className="icon-btn"
              title={expanded ? 'סגור עריכה' : 'ערוך'}
              style={expanded ? { color: 'var(--brass)' } : {}}
              onClick={() => setExpanded(e => !e)}
            >
              <IcEdit size={13} />
            </button>
          </div>
        </td>
      </tr>

      {rowError && (
        <tr>
          <td colSpan={8} style={{ padding: '4px 20px', background: 'var(--bg-2)', fontSize: 12, color: 'var(--status-urgent)' }}>
            {rowError}
          </td>
        </tr>
      )}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '14px 20px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="field-input">
                <label>סטטוס</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} type="button" className={'chip' + (form.status === s ? ' active' : '')} onClick={() => set('status', s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div className="field-input">
                  <label>תאריך יעד</label>
                  <input className="field-input-el" type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} style={{ colorScheme: 'var(--color-scheme, light)' }} />
                </div>
                <div className="field-input">
                  <label>התחלת עבודה</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input className="field-input-el" type="date" style={{ flex: 1, colorScheme: 'var(--color-scheme, light)' }}
                      value={form.work_start?.slice(0, 10) || ''}
                      onChange={e => set('work_start', e.target.value + 'T' + (form.work_start?.slice(11, 16) || '00:00'))} />
                    <input className="field-input-el" type="time" style={{ width: 90, colorScheme: 'var(--color-scheme, light)' }}
                      value={form.work_start?.slice(11, 16) || ''}
                      onChange={e => set('work_start', (form.work_start?.slice(0, 10) || new Date().toISOString().slice(0, 10)) + 'T' + e.target.value)} />
                  </div>
                </div>
                <div className="field-input">
                  <label>סיום עבודה</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input className="field-input-el" type="date" style={{ flex: 1, colorScheme: 'var(--color-scheme, light)' }}
                      value={form.work_end?.slice(0, 10) || ''}
                      onChange={e => set('work_end', e.target.value + 'T' + (form.work_end?.slice(11, 16) || '00:00'))} />
                    <input className="field-input-el" type="time" style={{ width: 90, colorScheme: 'var(--color-scheme, light)' }}
                      value={form.work_end?.slice(11, 16) || ''}
                      onChange={e => set('work_end', (form.work_end?.slice(0, 10) || new Date().toISOString().slice(0, 10)) + 'T' + e.target.value)} />
                  </div>
                </div>
                <div className="field-input">
                  <label>סה"כ שעות</label>
                  <div className="field-input-el" style={{ background: 'var(--bg-2)', color: calculatedHours != null ? 'var(--text)' : 'var(--text-dim)', cursor: 'default' }}>
                    {calculatedHours != null ? `${calculatedHours} שע׳` : '—'}
                  </div>
                </div>
              </div>
              <div className="field-input">
                <label>הערות</label>
                <input className="field-input-el" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn sm" onClick={() => setExpanded(false)}>ביטול</button>
                <button className="btn sm primary" onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function TasksPage({ onOpenCase }) {
  const { user, profile, isAdmin } = useAuth()
  const [tasks,          setTasks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [addTaskOpen,    setAddTaskOpen]    = useState(false)
  const [search,         setSearch]         = useState('')

  async function load() {
    const { data } = await supabase
      .from('case_assignments')
      .select('*, case:case_id(id, name, serial_number, status)')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function markDone(taskId, caseId, taskType) {
    const { error } = await supabase.from('case_assignments').update({ status: 'בוצע' }).eq('id', taskId)
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'בוצע' } : t))
      if (caseId && taskType !== 'בדיקה סופית') await createFinalCheckTasks(caseId, taskType)
    }
  }

  const isOverdue = (dateStr) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const filtered = tasks
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          t.case?.name?.toLowerCase().includes(q) ||
          t.task_type?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

  const open    = tasks.filter(t => t.status !== 'בוצע' && t.status !== 'סגור').length
  const overdue = tasks.filter(t => isOverdue(t.target_date) && t.status !== 'בוצע').length
  const urgent  = tasks.filter(t => t.priority === 'גבוהה' && t.status !== 'בוצע').length

  const statusOptions   = ['all', ...new Set(tasks.map(t => t.status).filter(Boolean))]
  const priorityOptions = ['all', 'גבוהה', 'בינונית', 'נמוכה']

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען משימות...</div>

  return (
    <div className="page">
      {addTaskOpen && (
        <AddTaskModal
          onClose={() => setAddTaskOpen(false)}
          onSaved={() => { setLoading(true); load() }}
          currentUser={profile}
          isAdmin={isAdmin}
        />
      )}

      <div className="page-header">
        <div>
          <div className="eyebrow">שלום, {profile?.full_name || 'משתמש'}</div>
          <h1>המשימות שלי</h1>
          <div className="sub">משימות המשויכות אליך בלבד, מכל התיקים הפעילים במשרד.</div>
        </div>
        <button className="btn primary" onClick={() => setAddTaskOpen(true)}>
          <IcPlus size={14} /> הוסף משימה
        </button>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard icon={IcTasks} label="פתוחות"       value={open}    delta={`מתוך ${tasks.length} משימות`} />
        <StatCard icon={IcAlert} label="באיחור"        value={overdue} delta="עברו תאריך יעד" down={overdue > 0} />
        <StatCard icon={IcClock} label="עדיפות גבוהה" value={urgent}  delta="נדרש טיפול מיידי" />
      </div>

      <div className="toolbar">
        <div className="search" style={{ minWidth: 220 }}>
          <input
            placeholder="חיפוש לפי תיק, סוג משימה, הערות..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <IcSearch className="search-icon" size={15} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>סטטוס:</span>
          {statusOptions.map(s => (
            <button key={s} className={'chip' + (statusFilter === s ? ' active' : '')} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'הכל' : s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginRight: 'auto' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>עדיפות:</span>
          {priorityOptions.map(p => (
            <button key={p} className={'chip' + (priorityFilter === p ? ' active' : '')} onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'הכל' : p}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="table-wrap" style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          אין משימות משויכות אליך עדיין
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="cases">
              <thead>
                <tr>
                  <th style={{ minWidth: 240 }}>תיק</th>
                  <th>סוג המשימה</th>
                  <th>סטטוס</th>
                  <th>עדיפות</th>
                  <th>שעות עבודה</th>
                  <th>תאריך יעד</th>
                  <th>הערות</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <TaskRow
                    key={t.id}
                    t={t}
                    isOverdue={isOverdue}
                    onMarkDone={markDone}
                    onUpdate={updated => setTasks(prev => prev.map(x => x.id === updated.id ? updated : x))}
                    onOpenCase={onOpenCase}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
