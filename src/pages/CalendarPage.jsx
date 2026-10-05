import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { fmtDate, fmtTime, dateKey } from '../lib/helpers'
import { IcCalendar, IcChevron, IcPlus, IcX, IcTrash } from '../components/Icons'
import TimeSelect from '../components/TimeSelect'

const WEEKDAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const STATUS_OPTIONS   = ['חדש', 'בטיפול', 'בוצע', 'ממתין']
const PRIORITY_OPTIONS = ['גבוהה', 'בינונית', 'נמוכה']

function getMonthGrid(cursor) {
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

function getWeekDays(cursor) {
  const start = new Date(cursor)
  start.setDate(cursor.getDate() - cursor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function AddItemModal({ date, employees, cases, currentUser, isAdmin, onClose, onSaved }) {
  const [kind, setKind] = useState('task')
  const [taskForm, setTaskForm] = useState({
    case_id: '', employee_id: isAdmin ? '' : currentUser?.id,
    task_type: '', status: 'חדש', priority: 'בינונית',
    target_date: date, target_time: '', target_end_time: '', notes: '',
  })
  const [eventForm, setEventForm] = useState({
    title: '', description: '', case_id: '', event_date: date, event_time: '', end_time: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleSaveTask() {
    if (!taskForm.case_id)     { setError('יש לבחור תיק');  return }
    if (!taskForm.employee_id) { setError('יש לבחור עובד'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTask', ...taskForm }),
      })
      const result = await res.json()
      if (result.error) { setError(result.error); setSaving(false); return }
      onSaved(); onClose()
    } catch {
      setError('שגיאת חיבור לשרת — נסה שוב')
      setSaving(false)
    }
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim()) { setError('יש להזין כותרת'); return }
    setSaving(true); setError('')
    const { error } = await supabase.from('calendar_events').insert({
      title:       eventForm.title.trim(),
      description: eventForm.description || null,
      event_date:  eventForm.event_date,
      event_time:  eventForm.event_time || null,
      end_time:    eventForm.end_time || null,
      case_id:     eventForm.case_id || null,
      created_by:  currentUser?.id,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    onSaved(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>הוספה ליומן</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className={'chip' + (kind === 'task' ? ' active' : '')} onClick={() => { setKind('task'); setError('') }}>משימה</button>
            <button type="button" className={'chip' + (kind === 'event' ? ' active' : '')} onClick={() => { setKind('event'); setError('') }}>אירוע</button>
          </div>

          {kind === 'task' ? (
            <>
              <div className="field-input">
                <label>תיק <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                <select className="field-input-el" value={taskForm.case_id} onChange={e => setTaskForm(f => ({ ...f, case_id: e.target.value }))}>
                  <option value="">בחר תיק...</option>
                  {cases.map(c => <option key={c.id} value={c.id}>#{c.serial_number} — {c.name}</option>)}
                </select>
              </div>
              {isAdmin ? (
                <div className="field-input">
                  <label>עובד <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                  <select className="field-input-el" value={taskForm.employee_id} onChange={e => setTaskForm(f => ({ ...f, employee_id: e.target.value }))}>
                    <option value="">בחר עובד...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
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
              <div className="field-input">
                <label>סוג משימה</label>
                <input className="field-input-el" placeholder='נדל"ן, חוזים, בדיקה סופית...' value={taskForm.task_type} onChange={e => setTaskForm(f => ({ ...f, task_type: e.target.value }))} />
              </div>
              <div className="field-input">
                <label>תאריך <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                <input type="date" className="field-input-el" value={taskForm.target_date} onChange={e => setTaskForm(f => ({ ...f, target_date: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="field-input">
                  <label>משעה</label>
                  <TimeSelect value={taskForm.target_time} onChange={v => setTaskForm(f => ({ ...f, target_time: v }))} />
                </div>
                <div className="field-input">
                  <label>עד שעה (אופציונלי)</label>
                  <TimeSelect value={taskForm.target_end_time} onChange={v => setTaskForm(f => ({ ...f, target_end_time: v }))} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="field-input">
                  <label>סטטוס</label>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} type="button" className={'chip' + (taskForm.status === s ? ' active' : '')} onClick={() => setTaskForm(f => ({ ...f, status: s }))}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="field-input">
                  <label>עדיפות</label>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {PRIORITY_OPTIONS.map(p => (
                      <button key={p} type="button" className={'chip' + (taskForm.priority === p ? ' active' : '')} onClick={() => setTaskForm(f => ({ ...f, priority: p }))}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field-input">
                <label>הערות</label>
                <textarea className="field-input-el" rows={2} placeholder="הערות פנימיות..." value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </>
          ) : (
            <>
              <div className="field-input">
                <label>כותרת <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                <input className="field-input-el" placeholder="לדוגמה: דיון בבית משפט, פגישה עם לקוח..." value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="field-input">
                <label>תאריך <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                <input type="date" className="field-input-el" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="field-input">
                  <label>משעה</label>
                  <TimeSelect value={eventForm.event_time} onChange={v => setEventForm(f => ({ ...f, event_time: v }))} />
                </div>
                <div className="field-input">
                  <label>עד שעה (אופציונלי)</label>
                  <TimeSelect value={eventForm.end_time} onChange={v => setEventForm(f => ({ ...f, end_time: v }))} />
                </div>
              </div>
              <div className="field-input">
                <label>תיק מקושר (אופציונלי)</label>
                <select className="field-input-el" value={eventForm.case_id} onChange={e => setEventForm(f => ({ ...f, case_id: e.target.value }))}>
                  <option value="">ללא</option>
                  {cases.map(c => <option key={c.id} value={c.id}>#{c.serial_number} — {c.name}</option>)}
                </select>
              </div>
              <div className="field-input">
                <label>תיאור</label>
                <textarea className="field-input-el" rows={2} value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </>
          )}

          {error && (
            <div style={{ fontSize: 13, color: 'var(--status-urgent)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--status-urgent)' }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={kind === 'task' ? handleSaveTask : handleSaveEvent} disabled={saving}>
            {saving ? 'שומר...' : 'הוסף'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EventDetailModal({ event, canManage, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('calendar_events').delete().eq('id', event.id)
    setDeleting(false)
    if (!error) { onDeleted(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{event.title}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <span className="label">תאריך</span>
            <span className="value mono">
              {fmtDate(event.event_date)}
              {event.event_time ? ' · ' + fmtTime(event.event_time) + (event.end_time ? '–' + fmtTime(event.end_time) : '') : ''}
            </span>
          </div>
          {event.case && (
            <div className="field"><span className="label">תיק מקושר</span><span className="value">{event.case.name}</span></div>
          )}
          {event.description && (
            <div className="field"><span className="label">תיאור</span><span className="value">{event.description}</span></div>
          )}
          <div className="field"><span className="label">נוצר ע"י</span><span className="value">{event.creator?.full_name || '—'}</span></div>
        </div>
        <div className="modal-footer">
          {canManage && (
            <button className="btn" style={{ color: 'var(--status-urgent)' }} onClick={handleDelete} disabled={deleting}>
              <IcTrash size={13} /> {deleting ? 'מוחק...' : 'מחק אירוע'}
            </button>
          )}
          <button className="btn primary" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage({ onOpenCase }) {
  const { user, profile, isAdmin } = useAuth()
  const [view,       setView]       = useState('month')
  const [cursor,     setCursor]     = useState(new Date())
  const [tasks,      setTasks]      = useState([])
  const [events,     setEvents]     = useState([])
  const [employees,  setEmployees]  = useState([])
  const [cases,      setCases]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [addDate,    setAddDate]    = useState(null)
  const [detailId,   setDetailId]   = useState(null)

  async function load() {
    const [assignRes, eventsRes, empRes, casesRes] = await Promise.all([
      supabase.from('case_assignments')
        .select('id, target_date, target_time, target_end_time, task_type, status, priority, case:case_id(id, name, serial_number), employee:employee_id(id, full_name)')
        .not('target_date', 'is', null),
      supabase.from('calendar_events').select('*, case:case_id(id, name, serial_number), creator:created_by(id, full_name)'),
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']).order('full_name'),
      supabase.from('cases').select('id, name, serial_number').order('serial_number'),
    ])
    setTasks(assignRes.data || [])
    setEvents(eventsRes.data || [])
    setEmployees(empRes.data || [])
    setCases(casesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const itemsByDate = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!t.target_date) return
      ;(map[t.target_date] ||= []).push({
        id: 'task-' + t.id, kind: 'task', time: t.target_time, endTime: t.target_end_time,
        title: t.task_type || 'משימה', sub: t.case?.name, caseId: t.case?.id,
      })
    })
    events.forEach(e => {
      ;(map[e.event_date] ||= []).push({
        id: 'event-' + e.id, kind: 'event', time: e.event_time, endTime: e.end_time,
        title: e.title, sub: e.case?.name, caseId: e.case?.id, eventId: e.id,
      })
    })
    Object.values(map).forEach(list => list.sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return -1
      if (!b.time) return 1
      return a.time.localeCompare(b.time)
    }))
    return map
  }, [tasks, events])

  function handleItemClick(it) {
    if (it.kind === 'task') { if (it.caseId) onOpenCase?.(it.caseId); return }
    setDetailId(it.eventId)
  }

  function nav(delta) {
    setCursor(c => {
      const d = new Date(c)
      if (view === 'month') d.setMonth(d.getMonth() + delta)
      else d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  const days = view === 'month' ? getMonthGrid(cursor) : getWeekDays(cursor)
  const todayKey = dateKey(new Date())
  const detailEvent = detailId ? events.find(e => e.id === detailId) : null

  const title = view === 'month'
    ? cursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : (() => {
        const wd = getWeekDays(cursor)
        return `${wd[0].getDate()}/${wd[0].getMonth() + 1} – ${wd[6].getDate()}/${wd[6].getMonth() + 1}`
      })()

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען יומן...</div>

  return (
    <div className="page">
      {addDate && (
        <AddItemModal
          date={addDate}
          employees={employees}
          cases={cases}
          currentUser={profile}
          isAdmin={isAdmin}
          onClose={() => setAddDate(null)}
          onSaved={load}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          canManage={isAdmin || detailEvent.created_by === user?.id}
          onClose={() => setDetailId(null)}
          onDeleted={load}
        />
      )}

      <div className="page-header">
        <div>
          <div className="eyebrow">כל המשרד</div>
          <h1>יומן</h1>
          <div className="sub">משימות ואירועים לפי תאריך ושעה, לכל המשרד.</div>
        </div>
        <button className="btn primary" onClick={() => setAddDate(dateKey(new Date()))}>
          <IcPlus size={14} /> הוספה ליומן
        </button>
      </div>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => nav(-1)} title="הקודם"><IcChevron size={14} style={{ transform: 'scaleX(-1)' }} /></button>
          <button className="btn sm" onClick={() => setCursor(new Date())}>היום</button>
          <button className="icon-btn" onClick={() => nav(1)} title="הבא"><IcChevron size={14} /></button>
        </div>
        <div className="cal-title"><IcCalendar size={15} /> {title}</div>
        <div className="cal-view-toggle">
          <button className={'chip' + (view === 'month' ? ' active' : '')} onClick={() => setView('month')}>חודש</button>
          <button className={'chip' + (view === 'week' ? ' active' : '')} onClick={() => setView('week')}>שבוע</button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="cal-month-grid">
          {WEEKDAY_LABELS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
          {days.map(d => {
            const key = dateKey(d)
            const dayItems = itemsByDate[key] || []
            const inMonth  = d.getMonth() === cursor.getMonth()
            return (
              <div
                key={key}
                className={'cal-day-cell' + (inMonth ? '' : ' dim') + (key === todayKey ? ' today' : '')}
                onClick={() => setAddDate(key)}
              >
                <div className="cal-day-num">{d.getDate()}</div>
                <div className="cal-day-items">
                  {dayItems.slice(0, 3).map(it => (
                    <div key={it.id} className={'cal-chip ' + it.kind} onClick={e => { e.stopPropagation(); handleItemClick(it) }}>
                      {it.time && <span className="mono">{fmtTime(it.time)}{it.endTime ? '–' + fmtTime(it.endTime) : ''} </span>}{it.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && <div className="cal-more">+{dayItems.length - 3} נוספות</div>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="cal-week-grid">
          {days.map(d => {
            const key = dateKey(d)
            const dayItems = itemsByDate[key] || []
            return (
              <div key={key} className={'cal-week-col' + (key === todayKey ? ' today' : '')}>
                <div className="cal-week-head">
                  <div className="cal-week-dayname">{d.toLocaleDateString('he-IL', { weekday: 'long' })}</div>
                  <div className="cal-week-daynum">{d.getDate()}</div>
                </div>
                <div className="cal-week-body">
                  {dayItems.map(it => (
                    <div key={it.id} className={'cal-card ' + it.kind} onClick={() => handleItemClick(it)}>
                      {it.time && <div className="cal-card-time mono">{fmtTime(it.time)}{it.endTime ? '–' + fmtTime(it.endTime) : ''}</div>}
                      <div className="cal-card-title">{it.title}</div>
                      {it.sub && <div className="cal-card-sub">{it.sub}</div>}
                    </div>
                  ))}
                  <button className="btn sm cal-add-btn" onClick={() => setAddDate(key)}>+ הוסף</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
