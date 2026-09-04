import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BUTTON_SECONDARY_CLASS } from './buttonStyles'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function SecondaryButton({ children, className = '', type = 'button', ...props }: SecondaryButtonProps) {
  return (
    <button type={type} className={`${BUTTON_SECONDARY_CLASS} ${className}`} {...props}>
      {children}
    </button>
  )
}
