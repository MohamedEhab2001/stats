'use client'

import { useId, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from '@/i18n/client'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// Shared by LoginForm and RegisterForm: a password field with a toggle to reveal the
// typed value. The toggle button sits inside the input's own relative wrapper so it
// works the same in both LTR and RTL layouts.
export default function PasswordInput({ className, id, ...props }: PasswordInputProps) {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={`w-full pe-10 ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('password.hide') : t('password.show')}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex items-center px-3 text-white/50 transition hover:text-white"
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
            <path d="M9.36 5.31A9.65 9.65 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-3.05 3.94M6.6 6.6C3.88 8.36 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.24-.94" />
          </svg>
        )}
      </button>
    </div>
  )
}
