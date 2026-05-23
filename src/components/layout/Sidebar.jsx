import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Building2, GitBranch, Users, Clock, MapPin, Briefcase, FolderKanban, FileText, LogOut, ShieldCheck } from 'lucide-react'

const NAV = [
  { label:'Dashboard',      icon:LayoutDashboard, to:'/dashboard',      roles:['super_admin','hr_manager','department_head','project_manager','employee'] },
  { label:'Departments',    icon:Building2,        to:'/departments',    roles:['super_admin','hr_manager'] },
  { label:'Org chart',      icon:GitBranch,        to:'/org-chart',      roles:['super_admin','hr_manager','department_head'] },
  { label:'Employees',      icon:Users,            to:'/employees',      roles:['super_admin','hr_manager','department_head'] },
  { label:'Attendance',     icon:Clock,            to:'/attendance',     roles:['super_admin','hr_manager','department_head','project_manager'] },
  { label:'Work locations', icon:MapPin,           to:'/work-locations', roles:['super_admin','hr_manager'] },
  { label:'Clients',        icon:Briefcase,        to:'/clients',        roles:['super_admin','hr_manager','project_manager'] },
  { label:'Projects',       icon:FolderKanban,     to:'/projects',       roles:['super_admin','hr_manager','project_manager'] },
  { label:'Contracts',      icon:FileText,         to:'/contracts',      roles:['super_admin','hr_manager'] },
]

export default function Sidebar() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  async function handleSignOut() { await signOut(); navigate('/login') }
  const initials = profile ? `${profile.first_name?.[0]??''}${profile.last_name?.[0]??''}`.toUpperCase() : '?'
  const visible = NAV.filter(n => n.roles.includes(role))
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <ShieldCheck size={16} className="text-white"/>
        </div>
        <span className="font-semibold text-gray-900 text-sm">Rzen Ishare</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(({ label, icon:Icon, to }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive?' active':''}`}>
            <Icon size={16}/>{label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{profile?.role?.replace('_',' ')}</p>
          </div>
          <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign out"><LogOut size={15}/></button>
        </div>
      </div>
    </aside>
  )
}
