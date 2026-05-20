import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, fmtDate } from '../lib/helpers'
import { IcTasks, IcAlert, IcClock, IcEdit, IcCheck } from '../components/Icons'

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

export default function TasksPage({ onOpenCase }) {
  const { user, profile } = useAuth()
  const [tasks,          setTasks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('case_assignments')
        .select('*, case:case_id(id, name, serial_number, status)')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
      setTasks(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  async function markDone(taskId) {
    const { error } = await supabase.from('case_assignments').update({ status: 'בוצע' }).eq('id', taskId)
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'בוצע' } : t))
  }

  const isOverdue = (dateStr) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  const open    = tasks.filter(t => t.status !== 'בוצע' && t.status !== 'סגור').length
  const overdue = tasks.filter(t => isOverdue(t.target_date) && t.status !== 'בוצע').length
  const urgent  = tasks.filter(t => t.priority === 'גבוהה' && t.status !== 'בוצע').length

  const statusOptions  = ['all', ...new Set(tasks.map(t => t.status).filter(Boolean))]
  const priorityOptions = ['all', 'גבוהה', 'בינונית', 'נמוכה']

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען משימות...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">שלום, {profile?.full_name || 'משתמש'}</div>
          <h1>המשימות שלי</h1>
          <div className="sub">משימות המשויכות אליך בלבד, מכל התיקים הפעילים במשרד.</div>
        </div>
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
                {filtered.map(t => {
                  const over = isOverdue(t.target_date) && t.status !== 'בוצע'
                  const cls  = STATUS_CLASS[t.status] || 'pending'
                  return (
                    <tr key={t.id} onClick={() => onOpenCase?.(t.case?.id)} className={over ? 'urgent-row' : ''}>
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
                            <button className="icon-btn" title="סמן כהושלם" onClick={() => markDone(t.id)}><IcCheck size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
