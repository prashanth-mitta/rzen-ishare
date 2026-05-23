import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    setLoading(false)
  }

  async function sendOtp(phone) {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
  }

  async function verifyOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) throw error
    return data
  }

  async function signInWithPhone(phone, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ phone, password })
    if (error) throw error
    return data
  }

  async function signUpAdmin({ firstName, lastName, phone, password, orgName, timezone }) {
    const { data, error } = await supabase.auth.signUp({
      phone, password,
      options: { data: { first_name: firstName, last_name: lastName, phone, role: 'super_admin' } }
    })
    if (error) throw error
    await supabase.from('org_settings').update({ org_name: orgName, timezone }).eq('id', 1)
    return data
  }

  async function signOut() { await supabase.auth.signOut() }

  return (
    <AuthContext.Provider value={{
      session, profile, loading,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'super_admin',
      isHR: ['super_admin','hr_manager'].includes(profile?.role),
      sendOtp, verifyOtp, signInWithPhone, signUpAdmin, signOut,
      refetchProfile: () => session && fetchProfile(session.user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
