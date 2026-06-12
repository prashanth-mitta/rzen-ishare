import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth, RedirectIfAuth } from './routes/Guards'
import AppLayout from './components/layout/AppLayout'

import LoginPage        from './pages/auth/LoginPage'
import ActivatePage     from './pages/auth/ActivatePage'
import AdminSetupPage   from './pages/auth/AdminSetupPage'
import DashboardPage    from './pages/dashboard/DashboardPage'
import DepartmentsPage  from './pages/departments/DepartmentsPage'
import OrgChartPage     from './pages/org/OrgChartPage'
import EmployeesPage    from './pages/employees/EmployeesPage'
import AttendancePage   from './pages/attendance/AttendancePage'
import WorkLocationsPage from './pages/locations/WorkLocationsPage'
import ClientsPage      from './pages/clients/ClientsPage'
import ProjectsPage     from './pages/projects/ProjectsPage'
import ContractsPage    from './pages/contracts/ContractsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route element={<RedirectIfAuth/>}>
            <Route path="/login"       element={<LoginPage/>}/>
            <Route path="/activate"    element={<ActivatePage/>}/>
            <Route path="/admin/setup" element={<AdminSetupPage/>}/>
          </Route>

          {/* Protected app routes */}
          <Route element={<RequireAuth/>}>
            <Route element={<AppLayout/>}>
              <Route path="/dashboard"      element={<DashboardPage/>}/>
              <Route path="/departments"    element={<DepartmentsPage/>}/>
              <Route path="/org-chart"      element={<OrgChartPage/>}/>
              <Route path="/employees"      element={<EmployeesPage/>}/>
              <Route path="/attendance"     element={<AttendancePage/>}/>
              <Route path="/work-locations" element={<WorkLocationsPage/>}/>
              <Route path="/clients"        element={<ClientsPage/>}/>
              <Route path="/projects"       element={<ProjectsPage/>}/>
              <Route path="/contracts"      element={<ContractsPage/>}/>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
