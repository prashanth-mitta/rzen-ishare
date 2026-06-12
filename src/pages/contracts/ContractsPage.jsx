import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select, Textarea, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, FileText, Edit2 } from 'lucide-react'

const STATUSES = ['draft','active','expired','terminated']
const STATUS_LABELS = { draft:'Draft', active:'Active', expired:'Expired', terminated:'Terminated' }
const EMPTY = { title:'', contract_number:'', client_id:'', project_id:'', start_date:'', end_date:'', value_inr:'', status:'draft', renewal_date:'', notes:'' }

export default function ContractsPage() {
  const { profile } = useAuth()
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: cons }, { data: cls }, { data: projs }] = await Promise.all([
      supabase.from('contracts').select('*, clients(name), projects(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name').eq('is_active', true).order('name'),
      supabase.from('projects').select('id,name').eq('is_active', true).order('name'),
    ])
    setContracts(cons ?? [])
    setClients(cls ?? [])
    setProjects(projs ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(c) {
    setEditing(c)
    setForm({ title:c.title, contract_number:c.contract_number, client_id:c.client_id, project_id:c.project_id??'', start_date:c.start_date, end_date:c.end_date, value_inr:c.value_inr, status:c.status, renewal_date:c.renewal_date??'', notes:c.notes??'' })
    setError('')
    setModal(true)
  }
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = { ...form, project_id: form.project_id||null, renewal_date: form.renewal_date||null, value_inr: parseFloat(form.value_inr), created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('contracts').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('contracts').insert(payload)
        if (err) throw err
      }
      setModal(false); fetchAll()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  function formatINR(v) {
    return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(v)
  }

  const statusColor = { draft:'bg-gray-100 text-gray-700', active:'bg-green-100 text-green-800', expired:'bg-red-100 text-red-800', terminated:'bg-orange-100 text-orange-800' }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Contracts" description="Manage client contracts"
        action={<Button onClick={openAdd}><Plus size={16}/>Add contract</Button>}/>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Contract</Th><Th>Client</Th><Th>Project</Th><Th>Value (INR)</Th><Th>Period</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && contracts.length === 0 && (
              <tr><td colSpan={7}><EmptyState icon={FileText} title="No contracts yet" description="Add your first client contract." action={<Button onClick={openAdd}><Plus size={16}/>Add contract</Button>}/></td></tr>
            )}
            {contracts.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td>
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <span className="font-mono text-xs text-gray-400">{c.contract_number}</span>
                </Td>
                <Td>{c.clients?.name}</Td>
                <Td>{c.projects?.name ?? <span className="text-gray-400">—</span>}</Td>
                <Td className="font-medium">{formatINR(c.value_inr)}</Td>
                <Td><p className="text-xs">{c.start_date} →</p><p className="text-xs">{c.end_date}</p></Td>
                <Td><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>{STATUS_LABELS[c.status]}</span></Td>
                <Td><button onClick={()=>openEdit(c)} className="text-gray-400 hover:text-brand-600"><Edit2 size={15}/></button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit contract':'Add contract'} size="lg">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contract title" value={form.title} onChange={set('title')} required/>
            <Input label="Contract number" value={form.contract_number} onChange={set('contract_number')} required placeholder="e.g. CNT-2024-001"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Client" value={form.client_id} onChange={set('client_id')} required>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Project (optional)" value={form.project_id} onChange={set('project_id')}>
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Start date <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={set('start_date')} required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">End date <span className="text-red-500">*</span></label>
              <input type="date" value={form.end_date} onChange={set('end_date')} required className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Renewal date</label>
              <input type="date" value={form.renewal_date} onChange={set('renewal_date')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Contract value (INR) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                <input type="number" value={form.value_inr} onChange={set('value_inr')} required min="0" step="0.01"
                  className="block w-full rounded-lg border border-gray-300 bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="0.00"/>
              </div>
            </div>
            <Select label="Status" value={form.status} onChange={set('status')} required>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2}/>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add contract'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
