import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CaseModal from '../components/CaseModal'
import TaskModal from '../components/TaskModal'

const STATUS_OPTIONS = ['חדש', 'בטיפול', 'בוצע', 'ממתין', 'סגור']

const STATUS_COLORS = {
  'בטיפול': 'bg-yellow-100 text-yellow-800',
  'בוצע':   'bg-green-100 text-green-800',
  'חדש':    'bg-blue-100 text-blue-800',
  'ממתין':  'bg-orange-100 text-orange-800',
  'סגור':   'bg-gray-100 text-gray-500',
}

function fmt(n) {
  if (!n && n !== 0) return '—'
  return Number(n).toLocaleString('he-IL') + ' ₪'
}

export default function CasesPage() {
  const { isAdmin } = useAuth()
  const [cases, setCases] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [taskModalCase, setTaskModalCase] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [casesRes, empRes] = await Promise.all([
      supabase.from('cases').select('*').order('serial_number', { ascending: true }),
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'owner']).order('full_name'),
    ])
    setCases(casesRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('האם למחוק תיק זה?')) return
    await supabase.from('case_assignments').delete().eq('case_id', id)
    await supabase.from('cases').delete().eq('id', id)
    setCases(prev => prev.filter(c => c.id !== id))
  }

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.name?.includes(search) || c.court_case_number?.includes(search)
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <div className="text-center py-16 text-gray-400">טוען נתונים...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול תיקים</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cases.length} תיקים</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            + תיק חדש
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="חיפוש לפי שם / מס׳ תיק..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-right">
                <th className="px-4 py-3.5 font-semibold text-gray-700">#</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">מס׳ בית משפט</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">שם תיק</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">נושא</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">עובד מוקצה</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">הצעה ראשונית</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">שווי כולל</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">הצעת לקוח</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">סה"כ נוצל</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">סטטוס</th>
                <th className="px-4 py-3.5 font-semibold text-gray-700">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-400">לא נמצאו תיקים</td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 table-row-hover">
                    <td className="px-4 py-3 text-gray-500">{c.serial_number}</td>
                    <td className="px-4 py-3 text-gray-600">{c.court_case_number || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.subject || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {employees.find(e => e.id === c.assigned_employee_id)?.full_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmt(c.initial_price)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(c.total_case_value)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(c.client_offer)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(c.total_used)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTaskModalCase(c)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            + משימה
                          </button>
                          <button
                            onClick={() => { setEditing(c); setModalOpen(true) }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            עריכה
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            מחיקה
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <CaseModal
          caseData={editing}
          employees={employees}
          onClose={() => setModalOpen(false)}
          onSaved={fetchData}
        />
      )}

      {taskModalCase && (
        <TaskModal
          caseItem={taskModalCase}
          employees={employees}
          onClose={() => setTaskModalCase(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
