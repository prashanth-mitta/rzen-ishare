import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Alert } from '../../components/ui'
import { ShieldCheck, Phone } from 'lucide-react'

export default function LoginPage() {
  const { signInWithPhone } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g,'')}`
      await signInWithPhone(formatted, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message ?? 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck className="text-white" size={28}/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rzen Ishare</h1>
          <p className="text-sm text-gray-500 mt-1">HR & Operations Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          {error && <Alert type="error" className="mb-4">{error}</Alert>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Mobile number" type="tel" placeholder="+91 98765 43210" value={phone}
              onChange={e => setPhone(e.target.value)} required
              hint="Enter with country code e.g. +91 9876543210"/>
            <Input label="Password" type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required/>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Sign in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            First time?{' '}
            <Link to="/admin/setup" className="text-brand-600 font-medium hover:underline">Set up admin account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
