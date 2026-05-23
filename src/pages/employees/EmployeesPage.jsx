import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select, Textarea, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, Users, Edit2, UserX, Info } from 'lucide-react'

const EMP_TYPES = ['full_time','part_time','contract','intern']
const EMP_TYPE_LABELS = { full_time:'Full-time', part_time:'Part-time', contract:'Contract', intern:'Intern' }
const ROLES = ['super_admin','hr_manager','department_head','project_manager','employee']
const EXIT_REASONS = ['resignation','termination','end_of_contract','retirement','other']
const EXIT_LABELS = { resignation:'Resignation', termination:'Termination', end_of_contract:'End of contract', retirement:'Retirement', other:'Other' }

const EMPTY_EMP = { first_name:'', last_name:'', email:'', phone:'', department_id:'', designation:'', date_of_joining:'', employment_type:'full_time', work_location_id:'', reports_to:'', date_of_birth:'', gender:'', address:'', emergency_contact_name:'', emergency_contact_phone:'', system_role:'employee' }
const EMPTY_EXIT = { exit_date:'', exit_reason:'resignation', exit_notes:'' }

export default function EmployeesPage() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [exitModal, setExitModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [exiting, setExiting] = useState(null)
  const [form, setForm] = useState(EMPTY_EMP)
  const [exitForm, setExitForm] = useState(EMPTY_EXIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

async function fetchAll() {
  setLoading(true)
  const { data: emps } = await supabase
    .from('employees')
    .select('*')
    .order('date_of_joining', { ascending: true })

  const { data: depts } = await supabase
    .from('departments')
    .select('id,name')
    .order('name')

  const { data: locs } = await supabase
    .from('work_locations')
    .select('id,name')
    .eq('is_active', true)
    .order('name')

  setEmployees(emps ?? [])
  setDepartments(depts ?? [])
  setLocations(locs ?? [])
  setLoading(false)
}

  function openAdd() { setEditing(null); setForm(EMPTY_EMP); setError(''); setModal(true) }
  function openEdit(e) {
    setEditing(e)
    setForm({ first_name:e.first_name, last_name:e.last_name, email:e.email??'', phone:e.phone, department_id:e.department_id, designation:e.designation, date_of_joining:e.date_of_joining, employment_type:e.employment_type, work_location_id:e.work_location_id??'', reports_to:e.reports_to??'', date_of_birth:e.date_of_birth??'', gender:e.gender??'', address:e.address??'', emergency_contact_name:e.emergency_contact_name??'', emergency_contact_phone:e.emergency_contact_phone??'', system_role:e.system_role??'employee' })
    setError('')
    setModal(true)
  }
  function openExit(e) { setExiting(e); setExitForm(EMPTY_EXIT); setError(''); setExitModal(true) }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const setEx = f => e => setExitForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, work_location_id: form.work_location_id||null, reports_to: form.reports_to||null, date_of_birth: form.date_of_birth||null, created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('employees').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('employees').insert(payload)
        if (err) throw err
      }
      setModal(false)
      fetchAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleExit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error: err } = await supabase.from('employees').update({ is_active: false, exit_date: exitForm.exit_date, exit_reason: exitForm.exit_reason, exit_notes: exitForm.exit_notes, exited_at: new Date().toISOString() }).eq('id', exiting.id)
      if (err) throw err
      setExitModal(false)
      fetchAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    return !q || `${e.first_name} ${e.last_name} ${e.emp_id} ${e.phone}`.toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Employees" description="Manage your workforce"
        action={<Button onClick={openAdd}><Plus size={16}/>Add employee</Button>}/>

      <div className="mb-4">
        <input type="text" placeholder="Search by name, emp ID, or phone..." value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Employee</Th><Th>Emp ID</Th><Th>Department</Th><Th>Designation</Th><Th>Type</Th><Th>Location</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8}><EmptyState icon={Users} title="No employees found" description="Add your first employee to get started." action={<Button onClick={openAdd}><Plus size={16}/>Add employee</Button>}/></td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} className={`hover:bg-gray-50 ${!e.is_active?'opacity-60':''}`}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
                      {e.first_name[0]}{e.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{e.first_name} {e.last_name}</p>
                      <p className="text-xs text-gray-400">{e.phone}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{e.emp_id}</span></Td>
                <Td>{e.departments?.name ?? '—'}</Td>
                <Td>{e.designation}</Td>
                <Td><Badge type={e.employment_type} label={EMP_TYPE_LABELS[e.employment_type]}/></Td>
                <Td>{e.work_locations?.name ?? '—'}</Td>
                <Td><Badge type={e.is_active?'active':'inactive'} label={e.is_active?'Active':'Exited'}/></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(e)} className="text-gray-400 hover:text-brand-600" title="Edit"><Edit2 size={15}/></button>
                    {e.is_active && <button onClick={()=>openExit(e)} className="text-gray-400 hover:text-red-500" title="Exit employee"><UserX size={15}/></button>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?`Edit — ${editing.first_name} ${editing.last_name}`:'Add employee'} size="xl">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 rounded-lg">
          <Info size={14} className="text-blue-600 shrink-0"/>
          <p className="text-xs text-blue-700">Fields marked with a lock are set by HR at onboarding and cannot be changed by employees.</p>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Personal information</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={form.first_name} onChange={set('first_name')} required placeholder="e.g. Rajan"/>
            <Input label="Last name" value={form.last_name} onChange={set('last_name')} required placeholder="e.g. Sharma"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mobile number" type="tel" value={form.phone} onChange={set('phone')} required placeholder="+91 9876543210" hint="Primary login identifier"/>
            <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="Optional"/>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')}/>
            <Select label="Gender" value={form.gender} onChange={set('gender')}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
            <div/>
          </div>
          <Textarea label="Address" value={form.address} onChange={set('address')} rows={2}/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency contact name" value={form.emergency_contact_name} onChange={set('emergency_contact_name')}/>
            <Input label="Emergency contact phone" type="tel" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')}/>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 border-t border-gray-100">Employment details (HR only)</p>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department *" value={form.department_id} onChange={set('department_id')} required>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Designation *" value={form.designation} onChange={set('designation')} required placeholder="e.g. Software Engineer"/>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Date of joining *" type="date" value={form.date_of_joining} onChange={set('date_of_joining')} required hint="Emp ID auto-assigned by this date"/>
            <Select label="Employment type *" value={form.employment_type} onChange={set('employment_type')} required>
              {EMP_TYPES.map(t => <option key={t} value={t}>{EMP_TYPE_LABELS[t]}</option>)}
            </Select>
            <Select label="Work location" value={form.work_location_id} onChange={set('work_location_id')}>
              <option value="">No location assigned</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Reports to" value={form.reports_to} onChange={set('reports_to')}>
              <option value="">None</option>
              {employees.filter(e => !editing || e.id !== editing.id).map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </Select>
            <Select label="System role" value={form.system_role} onChange={set('system_role')}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add employee'}</Button>
          </div>
        </form>
      </Modal>

      {/* Exit modal */}
      <Modal open={exitModal} onClose={()=>setExitModal(false)} title={`Exit employee — ${exiting?.first_name} ${exiting?.last_name}`}>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <Alert type="warning" className="mb-4">This will mark the employee as exited. This action cannot be undone.</Alert>
        <form onSubmit={handleExit} className="flex flex-col gap-4">
          <Input label="Last working date" type="date" value={exitForm.exit_date} onChange={setEx('exit_date')} required/>
          <Select label="Exit reason" value={exitForm.exit_reason} onChange={setEx('exit_reason')} required>
            {EXIT_REASONS.map(r => <option key={r} value={r}>{EXIT_LABELS[r]}</option>)}
          </Select>
          <Textarea label="Notes" value={exitForm.exit_notes} onChange={setEx('exit_notes')} placeholder="Optional notes"/>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setExitModal(false)}>Cancel</Button>
            <Button type="submit" variant="danger" loading={saving} className="flex-1">Confirm exit</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
