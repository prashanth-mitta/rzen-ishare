import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Select, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, Clock, Edit2 } from 'lucide-react'

const STATUSES = ['present','absent','half_day','leave']
const STATUS_LABELS = { present:'Present', absent:'Absent', half_day:'Half-day', leave:'Leave' }

const today = new Date().toISOString().split('T')[0]
const EMPTY = { employee_id:'', date:today, status:'present', check_in_time:'', check_out_time:'', work_location_id:'', notes:'' }

export default function AttendancePage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [locations, setLocations] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ date: today, dept:'', status:'' })

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchRecords() }, [filters])

  async function fetchAll() {
    const [{ data: emps }, { data: locs }, { data: depts }] = await Promise.all([
      supabase.from('employees').select('id,first_name,last_name,emp_id').eq('is_active', true).order('first_name'),
      supabase.from('work_locations').select('id,name').eq('is_active', true),
      supabase.from('departments').select('id,name').eq('is_active', true).order('name'),
    ])
    setEmployees(emps ?? [])
    setLocations(locs ?? [])
    setDepartments(depts ?? [])
    fetchRecords()
  }

  async function fetchRecords() {
    setLoading(true)
    let q = supabase.from('attendance')
      .select('*, employees(first_name, last_name, emp_id, department_id), work_locations(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (filters.date) q = q.eq('date', filters.date)
    if (filters.status) q = q.eq('status', filters.status)
    const { data } = await q
    setRecords(data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(r) {
    setEditing(r)
    setForm({ employee_id:r.employee_id, date:r.date, status:r.status, check_in_time:r.check_in_time??'', check_out_time:r.check_out_time??'', work_location_id:r.work_location_id??'', notes:r.notes??'' })
    setError('')
    setModal(true)
  }
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const setF = f => e => setFilters(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, work_location_id: form.work_location_id||null, check_in_time: form.check_in_time||null, check_out_time: form.check_out_time||null, marked_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('attendance').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('attendance').insert(payload)
        if (err) throw err
      }
      setModal(false)
      fetchRecords()
    } catch (err) {
      setError(err.message.includes('unique') ? 'Attendance already marked for this employee on this date.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Attendance" description="Mark and track employee attendance"
        action={<Button onClick={openAdd}><Plus size={16}/>Mark attendance</Button>}/>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={filters.date} onChange={setF('date')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
        <select value={filters.dept} onChange={setF('dept')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.status} onChange={setF('status')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Employee</Th><Th>Date</Th><Th>Status</Th><Th>Check-in</Th><Th>Check-out</Th><Th>Location</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && records.length === 0 && (
              <tr><td colSpan={7}><EmptyState icon={Clock} title="No attendance records" description="Mark attendance for your team." action={<Button onClick={openAdd}><Plus size={16}/>Mark attendance</Button>}/></td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td>
                  <p className="font-medium text-gray-900">{r.employees?.first_name} {r.employees?.last_name}</p>
                  <p className="text-xs text-gray-400">{r.employees?.emp_id} · {r.employees?.departments?.name}</p>
                </Td>
                <Td>{r.date}</Td>
                <Td><Badge type={r.status} label={STATUS_LABELS[r.status]}/></Td>
                <Td>{r.check_in_time ?? <span className="text-gray-400">—</span>}</Td>
                <Td>{r.check_out_time ?? <span className="text-gray-400">—</span>}</Td>
                <Td>{r.work_locations?.name ?? <span className="text-gray-400">—</span>}</Td>
                <Td><button onClick={()=>openEdit(r)} className="text-gray-400 hover:text-brand-600"><Edit2 size={15}/></button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit attendance record':'Mark attendance'}>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Select label="Employee" value={form.employee_id} onChange={set('employee_id')} required>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_id})</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={set('date')} required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <Select label="Status" value={form.status} onChange={set('status')} required>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Check-in time</label>
              <input type="time" value={form.check_in_time} onChange={set('check_in_time')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Check-out time</label>
              <input type="time" value={form.check_out_time} onChange={set('check_out_time')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
          </div>
          <Select label="Work location" value={form.work_location_id} onChange={set('work_location_id')}>
            <option value="">Select location</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes / remarks</label>
            <input type="text" value={form.notes} onChange={set('notes')} placeholder="Optional"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Mark attendance'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
