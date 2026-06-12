import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Alert } from '../../components/ui'
import { ShieldCheck, User } from 'lucide-react'

export default function AdminSetupPage() {
  const { signUpAdmin, sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [acc, setAcc] = useState({ firstName:'', lastName:'', phone:'', password:'', confirm:'' })
  const setA = f => e => setAcc(a => ({ ...a, [f]: e.target.value }))

  const STEPS = ['Account', 'Verify OTP', 'Done']

  async function handleAccountSubmit(e) {
    e.preventDefault()
    setError('')
    if (acc.password !== acc.confirm) { setError('Passwords do not match.'); return }
    if (acc.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const phone = acc.phone.startsWith('+') ? acc.phone : `+91${acc.phone.replace(/\s/g,'')}`
      await signUpAdmin({ firstName: acc.firstName, lastName: acc.lastName, phone, password: acc.password, orgName: 'Rzen Ishare', timezone: 'Asia/Kolkata' })
      await sendOtp(phone)
      setStep(1)
    } catch (err) {
      setError(err.message ?? 'Setup failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const phone = acc.phone.startsWith('+') ? acc.phone : `+91${acc.phone.replace(/\s/g,'')}`
      await verifyOtp(phone, otp)
      setStep(2)
    } catch (err) {
      setError(err.message ?? 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck className="text-white" size={28}/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rzen Ishare</h1>
          <p className="text-sm text-gray-500 mt-1">Admin setup</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border-2 transition-colors
                ${i < step ? 'bg-brand-600 border-brand-600 text-white' : i === step ? 'border-brand-600 text-brand-600 bg-white' : 'border-gray-300 text-gray-400 bg-white'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300 mx-1"/>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          {/* Step 0 — Account */}
          {step === 0 && (
            <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className="text-brand-600"/>
                <h2 className="text-base font-semibold text-gray-900">Create admin account</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First name" placeholder="Rajan" value={acc.firstName} onChange={setA('firstName')} required/>
                <Input label="Last name" placeholder="Sharma" value={acc.lastName} onChange={setA('lastName')} required/>
              </div>
              <Input label="Mobile number" type="tel" placeholder="+91 98765 43210" value={acc.phone} onChange={setA('phone')} required hint="Used for login and OTP verification"/>
              <Input label="Password" type="password" placeholder="Minimum 8 characters" value={acc.password} onChange={setA('password')} required/>
              <Input label="Confirm password" type="password" placeholder="Re-enter password" value={acc.confirm} onChange={setA('confirm')} required/>
              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Create account →</Button>
            </form>
          )}

          {/* Step 1 — Verify OTP */}
          {step === 1 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-gray-900">Verify your mobile number</h2>
              <p className="text-sm text-gray-500">An OTP has been sent to <strong>{acc.phone}</strong>. Enter it below to verify.</p>
              <Input label="OTP code" type="text" placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}/>
              <Button type="submit" loading={loading} className="w-full" size="lg">Verify OTP</Button>
            </form>
          )}

          {/* Step 2 — Done */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck size={32} className="text-green-600"/>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">You're all set!</h2>
              <p className="text-sm text-gray-500">Your admin account has been created. You can now sign in.</p>
              <Button className="w-full mt-2" size="lg" onClick={() => navigate('/login')}>Go to sign in</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
