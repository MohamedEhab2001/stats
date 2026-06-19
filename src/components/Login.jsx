import { useState, useRef, useEffect } from 'react'
import { LockIcon, TrophyIcon } from './Icons.jsx'

const PASSWORD = '1234554321'

export default function Login({ onSuccess }) {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = (e) => {
    e.preventDefault()
    if (value === PASSWORD) {
      onSuccess()
    } else {
      setError('That’s not the password. Try again.')
      setShake(true)
      setTimeout(() => setShake(false), 420)
      setValue('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="login-bg">
      <div className="login-floaters" aria-hidden>
        <span className="f1" /><span className="f2" /><span className="f3" />
      </div>
      <form className={`login-card ${shake ? 'shake' : ''}`} onSubmit={submit}>
        <div className="login-mark">
          <TrophyIcon size={22} />
        </div>
        <h1>Mohamed × Mohaned</h1>
        <p>Enter the secret to view the scoreboard.</p>

        <label className="login-field">
          <span className="ic"><LockIcon size={16} /></span>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            placeholder="Password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            autoComplete="off"
          />
        </label>

        <button type="submit" className="login-btn" disabled={!value.length}>
          Unlock
        </button>

        {error && <div className="login-error">{error}</div>}

        <div className="login-hint">Hint: it’s a palindrome.</div>
      </form>
    </div>
  )
}
