import { useRef, useState } from 'react'
import type { ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import { ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '../ui/Button'
import { SecondaryButton } from '../ui/SecondaryButton'
import { ErrorState } from '../ui/ErrorState'
import { StepIndicator } from '../ui/StepIndicator'
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../data/countryCodes'
import { completeCustomerSignup, sendCustomerOtp } from '../../services/customerAuth'
import type { CustomerProfile } from '../../services/customerAuth'

const CODE_LENGTH = 6

interface CustomerSignupFormProps {
  onSuccess: (profile: CustomerProfile) => void
  headingId: string
}

function OtpCodeInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const digits = value.padEnd(CODE_LENGTH, ' ').slice(0, CODE_LENGTH).split('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  function setDigit(index: number, char: string) {
    const next = digits.slice()
    next[index] = char
    onChange(next.join('').trimEnd())
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, char || ' ')
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
          value={digit.trim()}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="h-14 w-full min-w-0 rounded-lg border border-border bg-background text-center text-xl font-semibold text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      ))}
    </div>
  )
}

// Shared by the full-viewport modal (CustomerSignupModal, the mandatory-login
// path most customers hit) -- kept as its own component so the two-stage
// (details -> OTP) logic and the country-code phone field exist in one
// place. No email field anywhere -- phone is the only identity this product
// needs (it doubles as the OTP destination and the escalation callback).
export function CustomerSignupForm({ onSuccess, headingId }: CustomerSignupFormProps) {
  const [stage, setStage] = useState<'details' | 'otp'>('details')
  const [name, setName] = useState('')
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY_CODE)
  const [localPhone, setLocalPhone] = useState('')
  const [city, setCity] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fullPhone = `${dialCode}${localPhone.replace(/\D/g, '')}`

  async function handleSendCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await sendCustomerOtp(fullPhone)
      setStage('otp')
    } catch {
      setError("Couldn't send a code. Check your number and try again.")
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const profile = await completeCustomerSignup(name.trim(), fullPhone, city.trim(), code.trim())
      onSuccess(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setBusy(true)
    setError(null)
    try {
      await sendCustomerOtp(fullPhone)
    } catch {
      setError("Couldn't resend the code. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-3 pb-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
          {stage === 'details' ? (
            <UserRound size={32} className="text-primary" aria-hidden="true" />
          ) : (
            <ShieldCheck size={32} className="text-primary" aria-hidden="true" />
          )}
        </div>
        <h2 id={headingId} className="text-[28px] font-bold leading-8 text-text">
          {stage === 'details' ? 'Sign up to continue' : 'Verify your number'}
        </h2>
        <p className="text-base leading-6 text-text-secondary">
          {stage === 'details'
            ? "Tell us a bit about you so we can get your internet back on."
            : `Enter the 6-digit code we sent to ${fullPhone}.`}
        </p>
      </div>

      <div className="pb-6">
        <StepIndicator currentStep={stage === 'details' ? 1 : 2} totalSteps={2} />
      </div>

      {stage === 'details' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="signup-name" className="text-sm font-medium text-text">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="h-12 w-full rounded-lg border border-border bg-background px-3 text-base text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="signup-phone" className="text-sm font-medium text-text">
              Phone number
            </label>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="signup-country-code">
                Country code
              </label>
              <select
                id="signup-country-code"
                value={dialCode}
                onChange={(event) => setDialCode(event.target.value)}
                className="h-12 shrink-0 rounded-lg border border-border bg-background px-2 text-base text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.dialCode} value={country.dialCode}>
                    {country.dialCode} {country.label}
                  </option>
                ))}
              </select>
              <input
                id="signup-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                value={localPhone}
                onChange={(event) => setLocalPhone(event.target.value)}
                placeholder="Where we'll send your code"
                className="h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="signup-city" className="text-sm font-medium text-text">
              City
            </label>
            <input
              id="signup-city"
              type="text"
              autoComplete="address-level2"
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="So we can check for outages near you"
              className="h-12 w-full rounded-lg border border-border bg-background px-3 text-base text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          {error && <ErrorState title={error} inline />}

          <div className="pt-2">
            <Button type="submit" disabled={busy || !name.trim() || !localPhone.trim() || !city.trim()}>
              {busy ? 'Sending code…' : 'Continue'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          <OtpCodeInput value={code} onChange={setCode} />

          {error && <ErrorState title={error} inline />}

          <div className="space-y-3">
            <Button type="submit" disabled={busy || code.trim().length !== CODE_LENGTH}>
              {busy ? 'Verifying…' : 'Verify & Get Started'}
            </Button>
            <SecondaryButton
              type="button"
              onClick={() => {
                setStage('details')
                setCode('')
                setError(null)
              }}
              disabled={busy}
            >
              Edit details
            </SecondaryButton>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={busy}
              className="font-medium text-primary underline disabled:opacity-50"
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  )
}
