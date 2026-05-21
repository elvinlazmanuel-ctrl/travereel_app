'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type AuthMode = 'login' | 'register' | 'forgot-password'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with travel-themed gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF5F0] via-[#FFF0E5] to-[#E8FAF8]" />

      {/* Decorative circles */}
      <div className="absolute top-20 -left-20 w-64 h-64 rounded-full bg-[#FF6B6B]/10 blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full bg-[#2EC4B6]/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-[#FFBA49]/15 blur-2xl" />

      {/* Decorative travel elements - subtle floating shapes */}
      <motion.div
        className="absolute top-[15%] left-[10%] text-[#FF6B6B]/15"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-[20%] right-[12%] text-[#2EC4B6]/15"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-[60%] left-[8%] text-[#FFBA49]/15"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z" />
        </svg>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm 
                onSwitchToRegister={() => setMode('register')} 
                onSwitchToForgotPassword={() => setMode('forgot-password')}
              />
            </motion.div>
          ) : mode === 'register' ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            </motion.div>
          ) : (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
