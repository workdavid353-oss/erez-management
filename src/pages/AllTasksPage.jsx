import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_CLASS, STATUS_ORDER, fmtDate } from '../lib/helpers'
import { IcTable, IcAlert, IcClock, IcTasks, IcSearch } from '../components/Icons'
import Avatar from '../components/Avatar'

const PRIORITY_ORDER = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2 }

function SortTh({ label, field, sortBy, sortDir, onSort, style }) {
  const active = sortBy === field
  return (
    <th style={{ cursor: 'pointer', userSelect: 'none', ...style }} onClick={() => onSort(field)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>{active && sortDir === 'desc' ? '▼' : '▲'}</span>
      </span>
    </th>
  )
}

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

export default function AllTasksPage({ onOpenCase }) {
  const [tasks,          setTasks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [empFilter,      setEmpFilter]      = useState('all')
  const [sortBy,         setSortBy]         = useState('status')
  const [sortDir,        setSortDir]        = useState('asc')

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(field); setSortDir('asc') }
  }

  async function load() {
    const { data } = await supabase
      .from('case_assignments')
      .select('*, case:case_id(id, name, serial_number), employee:employee_id(id, full_name)')
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const isOverdue = (dateStr) => dateStr && new Date(dateStr) < new Date()

  const employees = [...new Map(
    tasks.filter(t => t.employee).map(t => [t.employee.id, t.employee])
  ).values()].sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'))

  const filtered = tasks
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (empFilter !== 'all' && t.employee_id !== empFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          t.case?.name?.toLowerCase().includes(q) ||
          t.task_type?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.employee?.full_name?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      let av, bv
      if (sortBy === 'case') {
        av = a.case?.name || ''; bv = b.case?.name || ''
        const cmp = av.localeCompare(bv, 'he')
        return sortDir === 'asc' ? cmp : -cmp
      }
      if (sortBy === 'date') {
        av = a.target_date ? new Date(a.target_date).getTime() : Infinity
        bv = b.target_date ? new Date(b.target_date).getTime() : Infinity
      } else if (sortBy === 'priority') {
        av = PRIORITY_ORDER[a.priority] ?? 99
        bv = PRIORITY_ORDER[b.priority] ?? 99
      } else {
        av = STATUS_ORDER[a.status] ?? 99
        bv = STATUS_ORDER[b.status] ?? 99
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })

  const open    = tasks.filter(t => t.status !== 'בוצע' && t.status !== 'סגור').length
  const overdue = tasks.filter(t => isOverdue(t.target_date) && t.status !== 'בוצע').length
  const urgent  = tasks.filter(t => t.priority === 'גבוהה' && t.status !== 'בוצע').length

  const statusOptions   = ['all', ...new Set(tasks.map(t => t.status).filter(Boolean))]
  const priorityOptions = ['all', 'גבוהה', 'בינונית', 'נמוכה']

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען משימות...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">כל המשרד</div>
          <h1>כל המשימות</h1>
          <div className="sub">תצוגת קריאה של כל המשימות, לכל העובדים, מכל התיקים הפעילים במשרד.</div>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard icon={IcTasks} label="פתוחות"       value={open}    delta={`מתוך ${tasks.length} משימות`} />
        <StatCard icon={IcAlert} label="באיחור"        value={overdue} delta="עברו תאריך יעד" down={overdue > 0} />
        <StatCard icon={IcClock} label="עדיפות גבוהה" value={urgent}  delta="נדרש טיפול מיידי" />
      </div>

      <div className="toolbar">
        <div className="search" style={{ minWidth: 220 }}>
          <input
            placeholder="חיפוש לפי תיק, סוג משימה, עובד, הערות..."
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>עדיפות:</span>
          {priorityOptions.map(p => (
            <button key={p} className={'chip' + (priorityFilter === p ? ' active' : '')} onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'הכל' : p}
            </button>
          ))}
        </div>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>עובד:</span>
          <select className="field-input-el" value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ minWidth: 140 }}>
            <option value="all">הכל</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="table-wrap" style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          אין משימות במערכת עדיין
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="cases">
              <thead>
                <tr>
                  <SortTh label="תיק" field="case" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} style={{ minWidth: 240 }} />
                  <th>עובד</th>
                  <th>סוג המשימה</th>
                  <SortTh label="סטטוס" field="status" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh label="עדיפות" field="priority" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>שעות עבודה</th>
                  <SortTh label="תאריך יעד" field="date" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>הערות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>לא נמצאו משימות</td></tr>
                ) : filtered.map(t => {
                  const over = isOverdue(t.target_date) && t.status !== 'בוצע'
                  const cls  = STATUS_CLASS[t.status] || 'pending'
                  return (
                    <tr key={t.id} className={over ? 'urgent-row' : ''} onClick={() => onOpenCase?.(t.case?.id)}>
                      <td>
                        <div className="case-name">{t.case?.name || '—'}</div>
                        <div className="case-meta mono">#{t.case?.serial_number}</div>
                      </td>
                      <td>
                        {t.employee ? (
                          <span className="user-cell">
                            <Avatar id={t.employee.id} name={t.employee.full_name} />
                            {t.employee.full_name.split(' ')[0]}
                          </span>
                        ) : <span className="empty-cell">— לא מוקצה</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{t.task_type || '—'}</td>
                      <td><span className={'status-cell ' + cls}><span className="dot" />{t.status || 'חדש'}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{t.priority || '—'}</td>
                      <td>
                        {t.work_hours != null
                          ? <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.work_hours} שע׳</span>
                          : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td><span className={'due mono' + (over ? ' overdue' : '')}>{fmtDate(t.target_date)}</span></td>
                      <td style={{ color: 'var(--text-dim)', fontSize: 12, maxWidth: 220 }}>{t.notes || '—'}</td>
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
