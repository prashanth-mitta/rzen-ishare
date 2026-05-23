import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Textarea, Select, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, Building2, Edit2, ToggleLeft } from 'lucide-react'

const EMPTY = { name:'', code:'', description:'', parent_id:'' }

export default function DepartmentsPage() {
  const { profile } = useAuth()
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchDepts() }, [])

  async function fetchDepts() {
    setLoading(true)
    const { data } = await supabase
      .from('departments')
      .select('*, parent:parent_id(name)')
      .order('created_at', { ascending: true })
    setDepts(data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(d) { setEditing(d); setForm({ name:d.name, code:d.code, description:d.description??'', parent_id:d.parent_id??'' }); setError(''); setModal(true) }
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, parent_id: form.parent_id || null, created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('departments').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('departments').insert(payload)
        if (err) throw err
      }
      setModal(false)
      fetchDepts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(d) {
    await supabase.from('departments').update({ is_active: !d.is_active }).eq('id', d.id)
    fetchDepts()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Departments" description="Manage your organisation's departments"
        action={<Button onClick={openAdd}><Plus size={16}/>Add department</Button>}/>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Department</Th><Th>Code</Th><Th>Parent dept</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && depts.length === 0 && (
              <tr><td colSpan={5}><EmptyState icon={Building2} title="No departments yet" description="Create your first department to start organising your team." action={<Button onClick={openAdd}><Plus size={16}/>Add department</Button>}/></td></tr>
            )}
            {depts.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <Td><p className="font-medium text-gray-900">{d.name}</p>{d.description&&<p className="text-xs text-gray-400 truncate max-w-xs">{d.description}</p>}</Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{d.code}</span></Td>
                <Td>{d.parent?.name ?? <span className="text-gray-400">—</span>}</Td>
                <Td><Badge type={d.is_active?'active':'inactive'} label={d.is_active?'Active':'Inactive'}/></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(d)} className="text-gray-400 hover:text-brand-600"><Edit2 size={15}/></button>
                    <button onClick={()=>toggleActive(d)} className="text-gray-400 hover:text-orange-500"><ToggleLeft size={15}/></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit department':'Add department'}>
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department name" value={form.name} onChange={set('name')} required placeholder="e.g. Engineering"/>
            <Input label="Department code" value={form.code} onChange={set('code')} required placeholder="e.g. ENG"/>
          </div>
          <Select label="Parent department (optional)" value={form.parent_id} onChange={set('parent_id')}>
            <option value="">None (top-level)</option>
            {depts.filter(d => !editing || d.id !== editing.id).map(d =>
              <option key={d.id} value={d.id}>{d.name}</option>
            )}
          </Select>
          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Optional description"/>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add department'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
