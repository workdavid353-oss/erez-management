import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, STATUS_ORDER, fmtDate } from '../lib/helpers'
import { createFinalCheckTasks } from '../lib/taskUtils'
import { IcTasks, IcAlert, IcClock, IcCheck, IcPlus, IcX, IcEdit } from '../components/Icons'

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
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']).order('full_name'),
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
  const [form,     setForm]     = useState({ status: t.status || 'חדש', notes: t.notes || '', target_date: t.target_date || '' })
  const [saving,   setSaving]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const over = isOverdue(t.target_date) && t.status !== 'בוצע'
  const cls  = STATUS_CLASS[t.status] || 'pending'

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('case_assignments').update({
      status:      form.status,
      notes:       form.notes      || null,
      target_date: form.target_date || null,
      updated_at:  new Date().toISOString(),
    }).eq('id', t.id)
    setSaving(false)
    if (!error) {
      onUpdate({ ...t, ...form })
      setExpanded(false)
      if (form.status === 'בוצע' && t.status !== 'בוצע' && t.task_type !== 'בדיקה סופית') {
        await createFinalCheckTasks(t.case_id)
      }
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
        <td><span className={'due mono' + (over ? ' overdue' : '')}>{fmtDate(t.target_date)}</span></td>
        <td style={{ color: 'var(--text-dim)', fontSize: 12, maxWidth: 220 }}>{t.notes || '—'}</td>
        <td onClick={e => e.stopPropagation()}>
          <div className="row-actions">
            {t.status !== 'בוצע' && (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                <div className="field-input">
                  <label>הערות</label>
                  <input className="field-input-el" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות..." />
                </div>
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
      if (caseId && taskType !== 'בדיקה סופית') await createFinalCheckTasks(caseId)
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
