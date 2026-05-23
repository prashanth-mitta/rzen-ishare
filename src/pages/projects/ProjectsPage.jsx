import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select, Textarea, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, FolderKanban, Edit2, Users } from 'lucide-react'

const EMPTY_P = { name:'', code:'', client_id:'', work_location_id:'', project_manager_id:'', start_date:'', end_date:'', description:'' }
const EMPTY_M = { employee_id:'', role_on_project:'', start_date:'', end_date:'' }

export default function ProjectsPage() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [locations, setLocations] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [teamModal, setTeamModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(EMPTY_P)
  const [memberForm, setMemberForm] = useState(EMPTY_M)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: projs }, { data: cls }, { data: locs }, { data: emps }] = await Promise.all([
      supabase.from('projects').select('*, clients(name), work_locations(name), employees!project_manager_id(first_name,last_name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('is_active', true).order('name'),
      supabase.from('work_locations').select('id,name').eq('is_active', true).order('name'),
      supabase.from('employees').select('id,first_name,last_name,emp_id').eq('is_active', true).order('first_name'),
    ])
    setProjects(projs ?? [])
    setClients(cls ?? [])
    setLocations(locs ?? [])
    setEmployees(emps ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY_P); setError(''); setModal(true) }
  function openEdit(p) {
    setEditing(p)
    setForm({ name:p.name, code:p.code, client_id:p.client_id, work_location_id:p.work_location_id??'', project_manager_id:p.project_manager_id??'', start_date:p.start_date, end_date:p.end_date??'', description:p.description??'' })
    setError('')
    setModal(true)
  }

  async function openTeam(p) {
    setActiveProject(p)
    setMemberForm(EMPTY_M)
    setError('')
    const { data } = await supabase.from('project_members').select('*, employees(first_name,last_name,emp_id)').eq('project_id', p.id)
    setMembers(data ?? [])
    setTeamModal(true)
  }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const setM = f => e => setMemberForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = { ...form, work_location_id: form.work_location_id||null, project_manager_id: form.project_manager_id||null, end_date: form.end_date||null, created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('projects').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('projects').insert(payload)
        if (err) throw err
      }
      setModal(false); fetchAll()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleAddMember(e) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const { error: err } = await supabase.from('project_members').insert({ ...memberForm, project_id: activeProject.id, end_date: memberForm.end_date||null, assigned_by: profile.id })
      if (err) throw err
      const { data } = await supabase.from('project_members').select('*, employees(first_name,last_name,emp_id)').eq('project_id', activeProject.id)
      setMembers(data ?? [])
      setMemberForm(EMPTY_M)
    } catch (err) { setError(err.message.includes('unique') ? 'This employee is already assigned to this project.' : err.message) }
    finally { setSaving(false) }
  }

  async function removeMember(id) {
    await supabase.from('project_members').delete().eq('id', id)
    const { data } = await supabase.from('project_members').select('*, employees(first_name,last_name,emp_id)').eq('project_id', activeProject.id)
    setMembers(data ?? [])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Projects" description="Manage client projects and team assignments"
        action={<Button onClick={openAdd}><Plus size={16}/>Add project</Button>}/>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Project</Th><Th>Client</Th><Th>Location</Th><Th>Manager</Th><Th>Start date</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && projects.length === 0 && (
              <tr><td colSpan={7}><EmptyState icon={FolderKanban} title="No projects yet" description="Create a project and assign team members." action={<Button onClick={openAdd}><Plus size={16}/>Add project</Button>}/></td></tr>
            )}
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <Td><p className="font-medium text-gray-900">{p.name}</p><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.code}</span></Td>
                <Td>{p.clients?.name}</Td>
                <Td>{p.work_locations?.name ?? '—'}</Td>
                <Td>{p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : '—'}</Td>
                <Td>{p.start_date}</Td>
                <Td><Badge type={p.is_active?'active':'inactive'} label={p.is_active?'Active':'Closed'}/></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(p)} className="text-gray-400 hover:text-brand-600" title="Edit"><Edit2 size={15}/></button>
                    <button onClick={()=>openTeam(p)} className="text-gray-400 hover:text-teal-600" title="Manage team"><Users size={15}/></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit project':'Add project'} size="lg">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Project name" value={form.name} onChange={set('name')} required/>
            <Input label="Project code" value={form.code} onChange={set('code')} required placeholder="e.g. PROJ-001"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Client" value={form.client_id} onChange={set('client_id')} required>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Work location" value={form.work_location_id} onChange={set('work_location_id')}>
              <option value="">Select location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </div>
          <Select label="Project manager" value={form.project_manager_id} onChange={set('project_manager_id')}>
            <option value="">Select manager</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Start date <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={set('start_date')} required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">End date</label>
              <input type="date" value={form.end_date} onChange={set('end_date')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
          </div>
          <Textarea label="Description" value={form.description} onChange={set('description')} rows={2}/>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add project'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={teamModal} onClose={()=>setTeamModal(false)} title={`Team — ${activeProject?.name}`} size="lg">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Current team members</p>
          {members.length === 0 && <p className="text-sm text-gray-400">No members assigned yet.</p>}
          <div className="flex flex-col gap-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.employees?.first_name} {m.employees?.last_name} <span className="text-xs text-gray-400">({m.employees?.emp_id})</span></p>
                  <p className="text-xs text-gray-500">{m.role_on_project} · from {m.start_date}{m.end_date ? ` to ${m.end_date}` : ''}</p>
                </div>
                <button onClick={()=>removeMember(m.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Add team member</p>
          <form onSubmit={handleAddMember} className="flex flex-col gap-3">
            <Select label="Employee" value={memberForm.employee_id} onChange={setM('employee_id')} required>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_id})</option>)}
            </Select>
            <Input label="Role on project" value={memberForm.role_on_project} onChange={setM('role_on_project')} required placeholder="e.g. Team lead, Developer"/>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Start date <span className="text-red-500">*</span></label>
                <input type="date" value={memberForm.start_date} onChange={setM('start_date')} required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">End date</label>
                <input type="date" value={memberForm.end_date} onChange={setM('end_date')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
              </div>
            </div>
            <Button type="submit" loading={saving}><Plus size={14}/>Add member</Button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
