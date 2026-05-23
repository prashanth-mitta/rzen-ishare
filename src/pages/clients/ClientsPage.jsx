import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Textarea, Modal, Table, Th, Td, Badge, EmptyState, Alert, Select } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, Briefcase, Edit2, ToggleLeft } from 'lucide-react'

const EMPTY = { name:'', code:'', industry:'', primary_contact_name:'', primary_contact_email:'', primary_contact_phone:'', secondary_contact_name:'', secondary_contact_email:'', billing_address:'', website:'', notes:'' }

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(c) { setEditing(c); setForm({ name:c.name, code:c.code, industry:c.industry??'', primary_contact_name:c.primary_contact_name, primary_contact_email:c.primary_contact_email, primary_contact_phone:c.primary_contact_phone??'', secondary_contact_name:c.secondary_contact_name??'', secondary_contact_email:c.secondary_contact_email??'', billing_address:c.billing_address??'', website:c.website??'', notes:c.notes??'' }); setError(''); setModal(true) }
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('clients').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('clients').insert(payload)
        if (err) throw err
      }
      setModal(false)
      fetchClients()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c) {
    await supabase.from('clients').update({ is_active: !c.is_active }).eq('id', c.id)
    fetchClients()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Clients" description="Manage client organisations"
        action={<Button onClick={openAdd}><Plus size={16}/>Add client</Button>}/>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr>
              <Th>Client</Th><Th>Code</Th><Th>Industry</Th>
              <Th>Primary contact</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={Briefcase} title="No clients yet" description="Add your first client to get started." action={<Button onClick={openAdd}><Plus size={16}/>Add client</Button>}/></td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td><p className="font-medium text-gray-900">{c.name}</p>{c.website&&<a href={c.website} className="text-xs text-brand-600 hover:underline" target="_blank" rel="noreferrer">{c.website}</a>}</Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span></Td>
                <Td>{c.industry || <span className="text-gray-400">—</span>}</Td>
                <Td><p className="text-sm">{c.primary_contact_name}</p><p className="text-xs text-gray-400">{c.primary_contact_email}</p></Td>
                <Td><Badge type={c.is_active?'active':'inactive'} label={c.is_active?'Active':'Inactive'}/></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>openEdit(c)} className="text-gray-400 hover:text-brand-600 transition-colors" title="Edit"><Edit2 size={15}/></button>
                    <button onClick={()=>toggleActive(c)} className="text-gray-400 hover:text-orange-500 transition-colors" title={c.is_active?'Deactivate':'Activate'}><ToggleLeft size={15}/></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit client':'Add client'} size="lg">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client name" value={form.name} onChange={set('name')} required placeholder="Acme Corp"/>
            <Input label="Client code" value={form.code} onChange={set('code')} required placeholder="ACME" hint="Unique short code"/>
          </div>
          <Input label="Industry" value={form.industry} onChange={set('industry')} placeholder="e.g. Manufacturing, IT, Healthcare"/>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Primary contact</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={form.primary_contact_name} onChange={set('primary_contact_name')} required/>
              <Input label="Email" type="email" value={form.primary_contact_email} onChange={set('primary_contact_email')} required/>
            </div>
            <Input label="Phone" type="tel" value={form.primary_contact_phone} onChange={set('primary_contact_phone')} className="mt-3"/>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Secondary contact (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={form.secondary_contact_name} onChange={set('secondary_contact_name')}/>
              <Input label="Email" type="email" value={form.secondary_contact_email} onChange={set('secondary_contact_email')}/>
            </div>
          </div>
          <Textarea label="Billing address" value={form.billing_address} onChange={set('billing_address')} rows={2}/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Website" type="url" value={form.website} onChange={set('website')} placeholder="https://"/>
            <div/>
          </div>
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2}/>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add client'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
