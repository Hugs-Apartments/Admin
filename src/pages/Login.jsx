import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, Field, inputCls } from '../components/ui.jsx'
import { USING_MOCK } from '../lib/api.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(USING_MOCK ? 'admin@hugsapartments.ng' : '')
  const [password, setPassword] = useState(USING_MOCK ? 'demo' : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-plum px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <img
            src="/HUGS-LOGO-2.png"
            alt="Hugs Luxury Apartments"
            className="mx-auto h-28 w-28 rounded-2xl object-cover shadow-lg ring-1 ring-gold/30"
          />
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.28em] text-gold">Admin Portal</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border-t-2 border-gold bg-white p-8 shadow-2xl">
          <h2 className="font-serif text-xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink/60">Access the management dashboard.</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
            </Field>
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            Sign in
          </Button>

          {USING_MOCK && (
            <p className="mt-4 text-center text-xs text-ink/40">
              Demo mode — any email/password works.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
