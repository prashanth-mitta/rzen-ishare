import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button, Input, Alert } from '../../components/ui'
import { ShieldCheck, UserCheck } from 'lucide-react'

export default function ActivatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0: form, 1: done
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ empId: '', phone: '', password: '', confirm: '' })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  function formatPhone(phone) {
    return phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!form.empId.trim()) { setError('Employee ID is required.'); return }

    setLoading(true)
    const phone = formatPhone(form.phone)

    try {
      // 1. Create the auth account (triggers handle_new_user -> profiles row)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        phone,
        password: form.password,
        options: { data: { first_name: '', last_name: '', phone, role: 'employee' } },
      })
      if (signUpErr) throw signUpErr

      // If email confirmation/OTP isn't required, session may already exist.
      // If not, sign in explicitly so the RPC call below is authenticated.
      let session = signUpData.session
      if (!session) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ phone, password: form.password })
        if (signInErr) throw signInErr
        session = signInData.session
      }

      // 2. Link this new account to the matching employees record
      const { error: linkErr } = await supabase.rpc('link_employee_profile', {
        p_emp_id: form.empId.trim(),
        p_phone: phone,
      })
      if (linkErr) throw linkErr

      setStep(1)
    } catch (err) {
      setError(err.message ?? 'Activation failed. Please check your details and try again.')
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
          <p className="text-sm text-gray-500 mt-1">Activate your employee account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          {step === 0 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={18} className="text-brand-600"/>
                <h2 className="text-base font-semibold text-gray-900">Set up your login</h2>
              </div>
              <p className="text-sm text-gray-500 -mt-2 mb-1">
                Enter the Employee ID and mobile number on file with HR, then choose a password.
              </p>
              <Input label="Employee ID" placeholder="e.g. RZ-001" value={form.empId} onChange={set('empId')} required hint="Provided by HR (e.g. RZ-001)"/>
              <Input label="Mobile number" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required hint="Must match the number HR has on file"/>
              <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set('password')} required/>
              <Input label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} required/>
              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Activate account</Button>
            </form>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck size={32} className="text-green-600"/>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Account activated!</h2>
              <p className="text-sm text-gray-500">You can now sign in with your mobile number and password.</p>
              <Button className="w-full mt-2" size="lg" onClick={() => navigate('/login')}>Go to sign in</Button>
            </div>
          )}

          {step === 0 && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Already activated?{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
