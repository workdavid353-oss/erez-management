import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['חדש', 'בטיפול', 'בוצע', 'ממתין', 'סגור']
const CATEGORY_OPTIONS = ['נדלן', 'חוזים', 'ייעוץ משפטי', 'ליטיגציה', 'דיני עבודה', 'אחר']

const FIELD = (label, name, type = 'text', opts = null) => ({ label, name, type, opts })

const FIELDS = [
  FIELD('מס׳ תיק בבית משפט', 'court_case_number'),
  FIELD('שם תיק', 'name'),
  FIELD('נושא תיק', 'subject'),
  FIELD('קטגוריה', 'category', 'select', CATEGORY_OPTIONS),
  FIELD('מידע נוסף', 'additional_info'),
  FIELD('הצעת מחיר ראשונית (₪)', 'initial_price', 'number'),
  FIELD('שווי תיק כולל (₪)', 'total_case_value', 'number'),
  FIELD('זמן עבודה (שע׳)', 'work_hours', 'number'),
  FIELD('הצעת לקוח (₪)', 'client_offer', 'number'),
  FIELD('סה"כ נוצל (₪)', 'total_used', 'number'),
  FIELD('סטטוס', 'status', 'select', STATUS_OPTIONS),
  FIELD('הערות', 'notes', 'textarea'),
]

export default function CaseModal({ caseData, employees, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!caseData

  const [form, setForm] = useState({
    court_case_number: '',
    name: '',
    subject: '',
    category: '',
    additional_info: '',
    initial_price: '',
    total_case_value: '',
    work_hours: '',
    client_offer: '',
    total_used: '',
    status: 'חדש',
    notes: '',
    assigned_employee_id: '',
    ...caseData,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם תיק הוא שדה חובה'); return }
    setSaving(true)
    setError('')

    try {
      const payload = {
        court_case_number: form.court_case_number || null,
        name: form.name.trim(),
        subject: form.subject || null,
        category: form.category || null,
        additional_info: form.additional_info || null,
        initial_price: form.initial_price ? Number(form.initial_price) : null,
        total_case_value: form.total_case_value ? Number(form.total_case_value) : null,
        work_hours: form.work_hours ? Number(form.work_hours) : null,
        client_offer: form.client_offer ? Number(form.client_offer) : null,
        total_used: form.total_used ? Number(form.total_used) : null,
        status: form.status || 'חדש',
        notes: form.notes || null,
        assigned_employee_id: form.assigned_employee_id || null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }

      let caseId = caseData?.id

      if (isEdit) {
        const { error } = await supabase.from('cases').update(payload).eq('id', caseId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('cases').insert(payload).select().single()
        if (error) throw error
        caseId = data.id
      }

      // manage assignment
      if (form.assigned_employee_id) {
        const { data: existing } = await supabase
          .from('case_assignments')
          .select('id')
          .eq('case_id', caseId)
          .eq('employee_id', form.assigned_employee_id)
          .single()

        if (!existing) {
          const assignedEmp = employees.find(e => e.id === form.assigned_employee_id)
          await supabase.from('case_assignments').insert({
            case_id: caseId,
            employee_id: form.assigned_employee_id,
            status: 'חדש',
            assigned_by_note: `הוקצה ע"י ענת – ${new Date().toLocaleDateString('he-IL')}`,
          })
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'עריכת תיק' : 'תיק חדש'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.name] || ''}
                    onChange={e => handleChange(f.name, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר...</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={form[f.name] || ''}
                    onChange={e => handleChange(f.name, e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type={f.type}
                    value={form[f.name] || ''}
                    onChange={e => handleChange(f.name, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הקצה לעובד</label>
              <select
                value={form.assigned_employee_id || ''}
                onChange={e => handleChange('assigned_employee_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר עובד...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
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
            {saving ? 'שומר...' : isEdit ? 'עדכן תיק' : 'צור תיק'}
          </button>
        </div>
      </div>
    </div>
  )
}
