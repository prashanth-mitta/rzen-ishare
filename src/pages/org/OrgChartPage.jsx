import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/layout/PageHeader'
import { Spinner } from '../../components/ui'

function OrgNode({ node, allNodes, depth = 0 }) {
  const children = allNodes.filter(n => n.reports_to === node.id && n.is_active)
  const initials = `${node.first_name[0]}${node.last_name[0]}`.toUpperCase()
  return (
    <div className="flex flex-col items-center">
      <div className={`flex flex-col items-center ${depth > 0 ? 'mt-6' : ''}`}>
        {depth > 0 && <div className="w-px h-6 bg-gray-200"/>}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 min-w-[160px]">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">{initials}</div>
          <div>
            <p className="text-sm font-medium text-gray-900">{node.first_name} {node.last_name}</p>
            <p className="text-xs text-gray-400">{node.department_id ?? '—'}</p>
          </div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="flex items-start gap-6 mt-0 pt-0">
          {children.map((child, i) => (
            <div key={child.id} className="flex flex-col items-center">
              <OrgNode node={child} allNodes={allNodes} depth={depth + 1}/>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, reports_to, is_active, department_id')
      .eq('is_active', true)
      setEmployees(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const roots = employees.filter(e => !e.reports_to)

  return (
    <div className="p-6 max-w-full mx-auto">
      <PageHeader title="Org chart" description="Organisation reporting structure — view only"/>
      {loading && (
        <div className="flex justify-center py-20"><Spinner/></div>
      )}
      {!loading && employees.length === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">No employees found. Add employees first.</div>
      )}
      {!loading && employees.length > 0 && (
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-12 justify-center pt-4">
            {roots.map(r => (
              <OrgNode key={r.id} node={r} allNodes={employees} depth={0}/>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
