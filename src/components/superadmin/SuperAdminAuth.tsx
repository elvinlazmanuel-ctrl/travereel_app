'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

interface SuperAdminAuthProps {
  onAuth: (user: { id: string; email: string; username: string; name: string; role: string; avatar?: string | null; token: string }) => void
}

export default function SuperAdminAuth({ onAuth }: SuperAdminAuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/superadmin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Authentication failed')
        return
      }

      const adminData = {
        ...data.admin,
        token: data.token,
      }

      localStorage.setItem('superadmin_auth', JSON.stringify(adminData))
      onAuth(adminData)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={{
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,107,107,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,140,66,0.06) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(46,196,182,0.04) 0%, transparent 50%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FF6B6B' }}
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Super Admin Access
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Wanderlust Platform Administration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="superadmin@wanderlust.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-white font-medium"
                style={{ backgroundColor: '#FF6B6B' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Authorized personnel only. All actions are logged.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
