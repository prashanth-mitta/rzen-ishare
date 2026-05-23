import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Users, Building2, MapPin, Briefcase, Clock, FileText } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function load() {
      const [emp, dept, loc, client, proj, contract] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('departments').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('work_locations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
      ])
      setStats({ emp: emp.count, dept: dept.count, loc: loc.count, client: client.count, proj: proj.count, contract: contract.count })
    }
    load()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back, {profile?.first_name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening across your organisation.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users}     label="Active employees" value={stats.emp}      color="bg-brand-600" />
        <StatCard icon={Building2} label="Departments"       value={stats.dept}     color="bg-teal-600" />
        <StatCard icon={MapPin}    label="Work locations"    value={stats.loc}      color="bg-orange-500" />
        <StatCard icon={Briefcase} label="Clients"           value={stats.client}   color="bg-indigo-500" />
        <StatCard icon={Clock}     label="Active projects"   value={stats.proj}     color="bg-purple-600" />
        <StatCard icon={FileText}  label="Contracts"         value={stats.contract} color="bg-pink-600" />
      </div>
    </div>
  )
}
