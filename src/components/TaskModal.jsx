import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS = ['חדש', 'בטיפול', 'בוצע', 'ממתין']
const PRIORITY_OPTIONS = ['גבוהה', 'בינונית', 'נמוכה']

export default function TaskModal({ caseItem, employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: '',
    task_type: '',
    general_info: '',
    charges: '',
    status: 'חדש',
    priority: 'בינונית',
    target_date: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.employee_id) { setError('יש לבחור עובד'); return }
    setSaving(true)
    setError('')

    const { error } = await supabase.from('case_assignments').upsert({
      case_id: caseItem.id,
      employee_id: form.employee_id,
      task_type: form.task_type || null,
      general_info: form.general_info || null,
      charges: form.charges ? Number(form.charges) : null,
      status: form.status,
      priority: form.priority || null,
      target_date: form.target_date || null,
      notes: form.notes || null,
      assigned_by_note: `הוקצה ע"י מנהל – ${new Date().toLocaleDateString('he-IL')}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'case_id,employee_id' })

    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">הוספת משימה</h2>
            <p className="text-sm text-gray-500 mt-0.5">תיק: {caseItem.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">עובד <span className="text-red-500">*</span></label>
            <select
              value={form.employee_id}
              onChange={e => handleChange('employee_id', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">בחר עובד...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג משימה</label>
              <input
                type="text"
                value={form.task_type}
                onChange={e => handleChange('task_type', e.target.value)}
                placeholder="נדל״ן, חוזים..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">חיובים (₪)</label>
              <input
                type="number"
                value={form.charges}
                onChange={e => handleChange('charges', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
              <select
                value={form.priority}
                onChange={e => handleChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מועד יעד</label>
              <input
                type="date"
                value={form.target_date}
                onChange={e => handleChange('target_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מידע כללי</label>
            <textarea
              value={form.general_info}
              onChange={e => handleChange('general_info', e.target.value)}
              rows={2}
              placeholder="פרטים נוספים על המשימה..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="הערות פנימיות..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'הוסף משימה'}
          </button>
        </div>
      </div>
    </div>
  )
}
