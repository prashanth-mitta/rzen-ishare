import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select, Modal, Table, Th, Td, Badge, EmptyState, Alert } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { Plus, MapPin, Edit2, ToggleLeft } from 'lucide-react'

const EMPTY = { name:'', client_id:'', address_line1:'', address_line2:'', city:'', state:'', pincode:'', country:'India', location_type:'office', contact_person:'', contact_phone:'' }

const LOCATION_TYPES = [
  { value:'office', label:'Office' },
  { value:'client_site', label:'Client site' },
  { value:'remote_hub', label:'Remote hub' },
]

export default function WorkLocationsPage() {
  const { profile } = useAuth()
  const [locations, setLocations] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: locs }, { data: cls }] = await Promise.all([
      supabase.from('work_locations').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
    ])
    setLocations(locs ?? [])
    setClients(cls ?? [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(l) {
    setEditing(l)
    setForm({ name:l.name, client_id:l.client_id??'', address_line1:l.address_line1, address_line2:l.address_line2??'', city:l.city, state:l.state, pincode:l.pincode, country:l.country, location_type:l.location_type, contact_person:l.contact_person??'', contact_phone:l.contact_phone??'' })
    setError('')
    setModal(true)
  }
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, client_id: form.client_id || null, created_by: profile.id }
      if (editing) {
        const { error: err } = await supabase.from('work_locations').update(payload).eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('work_locations').insert(payload)
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

  async function toggleActive(l) {
    await supabase.from('work_locations').update({ is_active: !l.is_active }).eq('id', l.id)
    fetchAll()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Work locations" description="Manage offices, client sites and remote hubs"
        action={<Button onClick={openAdd}><Plus size={16}/>Add location</Button>}/>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <thead>
            <tr><Th>Location</Th><Th>Client</Th><Th>Type</Th><Th>City</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>}
            {!loading && locations.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={MapPin} title="No locations yet" description="Add a work location. Make sure to add clients first." action={<Button onClick={openAdd}><Plus size={16}/>Add location</Button>}/></td></tr>
            )}
            {locations.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <Td><p className="font-medium text-gray-900">{l.name}</p><p className="text-xs text-gray-400">{l.address_line1}, {l.city}</p></Td>
                <Td>{l.clients?.name ?? <span className="text-gray-400">—</span>}</Td>
                <Td><span className="text-xs capitalize">{l.location_type.replace('_',' ')}</span></Td>
                <Td>{l.city}, {l.state}</Td>
                <Td><Badge type={l.is_active?'active':'inactive'} label={l.is_active?'Active':'Inactive'}/></Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(l)} className="text-gray-400 hover:text-brand-600"><Edit2 size={15}/></button>
                    <button onClick={()=>toggleActive(l)} className="text-gray-400 hover:text-orange-500"><ToggleLeft size={15}/></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit work location':'Add work location'} size="lg">
        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Location name" value={form.name} onChange={set('name')} required placeholder="e.g. Hyderabad Office"/>
            <Select label="Client" value={form.client_id} onChange={set('client_id')} required>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Select label="Location type" value={form.location_type} onChange={set('location_type')} required>
            {LOCATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input label="Address line 1" value={form.address_line1} onChange={set('address_line1')} required/>
          <Input label="Address line 2" value={form.address_line2} onChange={set('address_line2')} placeholder="Optional"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="City" value={form.city} onChange={set('city')} required/>
            <Input label="State" value={form.state} onChange={set('state')} required/>
            <Input label="Pincode" value={form.pincode} onChange={set('pincode')} required/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact person" value={form.contact_person} onChange={set('contact_person')}/>
            <Input label="Contact phone" type="tel" value={form.contact_phone} onChange={set('contact_phone')}/>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing?'Save changes':'Add location'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
