import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/helpers'
import { IcCalendar, IcDownload } from '../components/Icons'

const CATEGORIES = ['אזרחי', 'פלילי', 'מסחרי', 'משפחה', 'נדל"ן', 'עבודה']
const PERIOD_LABEL = { week: '7 ימים אחרונים', month: 'חודש אחרון', quarter: 'רבעון אחרון', year: 'שנה אחרונה' }

function BarChart({ data, max }) {
  const w = 540, h = 220, padL = 50, padR = 12, padT = 14, padB = 36
  const innerW = w - padL - padR, innerH = h - padT - padB
  const bw = innerW / (data.length || 1), ticks = 4
  return (
    <svg className="bar-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (innerH / ticks) * i
        const val = Math.round(max - (max / ticks) * i)
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--line)" strokeDasharray={i === ticks ? '' : '2 3'} />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-dim)" fontFamily="JetBrains Mono">{val}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const barH = Math.max((d.count / (max || 1)) * innerH, d.count > 0 ? 2 : 0)
        const x = padL + i * bw + bw * 0.18
        const y = padT + innerH - barH
        const bwActual = bw * 0.64
        return (
          <g key={d.name}>
            <rect x={x} y={y} width={bwActual} height={barH} rx="2" fill="var(--brass)" opacity="0.85" />
            {barH > 0 && <rect x={x} y={y} width={bwActual} height={3} rx="1" fill="var(--ink)" />}
            <text x={x + bwActual / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--text)" fontFamily="Frank Ruhl Libre" fontWeight="600">{d.count}</text>
            <text x={x + bwActual / 2} y={h - 14} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{d.name}</text>
          </g>
        )
      })}
    </svg>
  )
}

function PieChart({ data, total }) {
  const size = 220, r = 80, cx = size / 2, cy = size / 2
  let acc = 0
  const slices = data.map(d => {
    const start = acc / (total || 1) * Math.PI * 2
    acc += d.count
    return { ...d, start, end: acc / (total || 1) * Math.PI * 2 }
  })
  const arc = (start, end, R) => {
    const x1 = cx + Math.sin(start) * R, y1 = cy - Math.cos(start) * R
    const x2 = cx + Math.sin(end) * R,   y2 = cy - Math.cos(end) * R
    return `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${end - start > Math.PI ? 1 : 0} 1 ${x2},${y2} Z`
  }
  return (
    <svg className="pie-chart" viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, width: 220, height: 220 }}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s.start, s.end, r)} fill={s.color} stroke="var(--surface)" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--surface)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Frank Ruhl Libre" fontSize="28" fontWeight="700" fill="var(--text)">{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--text-dim)">תיקים</text>
    </svg>
  )
}

function getPeriodFrom(period) {
  const d = new Date()
  if (period === 'week')    d.setDate(d.getDate() - 7)
  if (period === 'month')   d.setMonth(d.getMonth() - 1)
  if (period === 'quarter') d.setMonth(d.getMonth() - 3)
  if (period === 'year')    d.setFullYear(d.getFullYear() - 1)
  return d.toISOString()
}

export default function ReportsPage() {
  const [cases,       setCases]       = useState([])
  const [employees,   setEmployees]   = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [period,      setPeriod]      = useState('quarter')
  const [customRange, setCustomRange] = useState(false)
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')

  useEffect(() => {
    async function load() {
      let casesQ = supabase.from('cases').select('id, category, status, created_at')
      if (customRange && dateFrom) casesQ = casesQ.gte('created_at', new Date(dateFrom).toISOString())
      if (customRange && dateTo)   casesQ = casesQ.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())
      if (!customRange)            casesQ = casesQ.gte('created_at', getPeriodFrom(period))

      const [casesRes, empRes, assignRes] = await Promise.all([
        casesQ,
        supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']),
        supabase.from('case_assignments').select('employee_id, status'),
      ])
      setCases(casesRes.data || [])
      setEmployees(empRes.data || [])
      setAssignments(assignRes.data || [])
      setLoading(false)
    }
    load()
  }, [period, customRange, dateFrom, dateTo])

  function exportCSV() {
    const rows = [['עובד', 'משימות פתוחות', 'סה"כ משימות']]
    workload.forEach(w => rows.push([w.emp.full_name, w.open, w.total]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'workload.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען דוחות...</div>

  const catCounts = CATEGORIES.map(c => ({ name: c, count: cases.filter(x => x.category === c).length }))
  const maxCat    = Math.max(...catCounts.map(c => c.count), 1)

  const statusGroups = [
    { key: 'בטיפול', count: cases.filter(c => c.status === 'בטיפול').length, color: 'var(--status-progress)' },
    { key: 'דחוף',   count: cases.filter(c => c.status === 'דחוף').length,   color: 'var(--status-urgent)'   },
    { key: 'ממתין',  count: cases.filter(c => c.status === 'ממתין').length,  color: 'var(--status-pending)'  },
    { key: 'הושלם',  count: cases.filter(c => c.status === 'הושלם' || c.status === 'סגור').length, color: 'var(--status-done)' },
    { key: 'חדש',    count: cases.filter(c => c.status === 'חדש').length,    color: 'var(--brass)'           },
  ].filter(g => g.count > 0)
  const totalStatus = statusGroups.reduce((s, g) => s + g.count, 0)

  const workload = employees.map(emp => {
    const empAssign = assignments.filter(a => a.employee_id === emp.id)
    const open  = empAssign.filter(a => a.status !== 'בוצע' && a.status !== 'סגור').length
    const total = empAssign.length
    return { emp, open, total }
  }).sort((a, b) => b.open - a.open)
  const maxWl = Math.max(...workload.map(w => w.open), 1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">דוחות וניתוחים · {customRange ? 'טווח מותאם' : PERIOD_LABEL[period]}</div>
          <h1>דוחות וסטטיסטיקות</h1>
          <div className="sub">תמונת מצב של פעילות המשרד — לפי קטגוריות, סטטוסים ועומס עובדים.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['week', 'שבוע'], ['month', 'חודש'], ['quarter', 'רבעון'], ['year', 'שנה']].map(([k, l]) => (
            <button key={k} className={'chip' + (!customRange && period === k ? ' active' : '')}
              onClick={() => { setPeriod(k); setCustomRange(false) }}>{l}</button>
          ))}
          <button className={'btn' + (customRange ? ' primary' : '')} onClick={() => setCustomRange(r => !r)}>
            <IcCalendar size={14} /> טווח מותאם
          </button>
          {customRange && (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="field-input-el"
                style={{ fontSize: 12, padding: '4px 10px', width: 'auto', colorScheme: 'var(--color-scheme, light)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>עד</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="field-input-el"
                style={{ fontSize: 12, padding: '4px 10px', width: 'auto', colorScheme: 'var(--color-scheme, light)' }}
              />
            </>
          )}
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-head">
            <h3>תיקים לפי קטגוריה</h3>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>סה"כ {cases.length} תיקים</span>
          </div>
          <div className="card-body"><BarChart data={catCounts} max={maxCat} /></div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>התפלגות סטטוסים</h3>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{totalStatus} תיקים</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <PieChart data={statusGroups} total={totalStatus} />
            <div className="legend" style={{ flexDirection: 'column', flex: 1 }}>
              {statusGroups.map(g => (
                <div className="legend-item" key={g.key} style={{ justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="sw" style={{ background: g.color }} />{g.key}
                  </div>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>עומס עובדים — משימות פתוחות</h3>
          <button className="btn sm" onClick={exportCSV}><IcDownload size={12} /> ייצוא CSV</button>
        </div>
        <div className="card-body">
          {workload.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 24 }}>אין עובדים עם משימות</div>
          ) : workload.map(w => (
            <div className="workload-row" key={w.emp.id}>
              <div className="who">
                <span className="avatar">{initials(w.emp.full_name)}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{w.emp.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>סה"כ {w.total} משימות</div>
                </div>
              </div>
              <div className="workload-bar">
                <div className="fill" style={{ width: (w.open / maxWl * 100) + '%' }} />
              </div>
              <div className="num">{w.open}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
