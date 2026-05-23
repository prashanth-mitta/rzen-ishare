import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500',
  secondary:'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-brand-500',
  danger:'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost:'bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-brand-500',
}
const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2 text-sm', lg:'px-5 py-2.5 text-sm' }

export function Button({ children, variant='primary', size='md', loading=false, className='', disabled, ...props }) {
  return (
    <button disabled={disabled||loading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}>
      {loading && <Loader2 size={14} className="animate-spin"/>}
      {children}
    </button>
  )
}

export const Input = forwardRef(function Input({ label, error, hint, className='', required, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input ref={ref} className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${error?'border-red-400 bg-red-50':'border-gray-300 bg-white'} ${className}`} {...props}/>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select({ label, error, hint, children, className='', required, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select ref={ref} className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${error?'border-red-400 bg-red-50':'border-gray-300 bg-white'} ${className}`} {...props}>{children}</select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, hint, className='', required, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea ref={ref} rows={3} className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${error?'border-red-400 bg-red-50':'border-gray-300 bg-white'} ${className}`} {...props}/>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export function Card({ children, className='', ...props }) {
  return <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} {...props}>{children}</div>
}
export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
      <div><h2 className="text-base font-semibold text-gray-900">{title}</h2>{description&&<p className="mt-0.5 text-sm text-gray-500">{description}</p>}</div>
      {action&&<div className="ml-4 shrink-0">{action}</div>}
    </div>
  )
}
export function CardBody({ children, className='' }) { return <div className={`px-6 py-4 ${className}`}>{children}</div> }

const alertStyles = { error:'bg-red-50 border-red-200 text-red-800', success:'bg-green-50 border-green-200 text-green-800', info:'bg-blue-50 border-blue-200 text-blue-800', warning:'bg-yellow-50 border-yellow-200 text-yellow-800' }
export function Alert({ type='info', children }) { return <div className={`rounded-lg border px-4 py-3 text-sm ${alertStyles[type]}`}>{children}</div> }

const badgeMap = { super_admin:'bg-purple-100 text-purple-800', hr_manager:'bg-blue-100 text-blue-800', department_head:'bg-teal-100 text-teal-800', project_manager:'bg-orange-100 text-orange-800', employee:'bg-gray-100 text-gray-700', active:'bg-green-100 text-green-800', inactive:'bg-red-100 text-red-800', draft:'bg-gray-100 text-gray-700', present:'bg-green-100 text-green-800', absent:'bg-red-100 text-red-800', half_day:'bg-yellow-100 text-yellow-800', leave:'bg-blue-100 text-blue-800', full_time:'bg-indigo-100 text-indigo-800', part_time:'bg-purple-100 text-purple-800', contract:'bg-orange-100 text-orange-800', intern:'bg-teal-100 text-teal-800' }
export function Badge({ label, type }) {
  const cls = badgeMap[type]??'bg-gray-100 text-gray-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label??type}</span>
}

export function Modal({ open, onClose, title, children, size='md' }) {
  if (!open) return null
  const widths = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Table({ children }) { return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table></div> }
export function Th({ children, className='' }) { return <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${className}`}>{children}</th> }
export function Td({ children, className='' }) { return <td className={`px-4 py-3 text-gray-700 whitespace-nowrap ${className}`}>{children}</td> }

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon&&<Icon size={40} className="text-gray-300 mb-3"/>}
      <p className="text-base font-medium text-gray-700">{title}</p>
      {description&&<p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action&&<div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ className='' }) { return <Loader2 size={20} className={`animate-spin text-brand-600 ${className}`}/> }
