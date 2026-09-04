import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BUTTON_PRIMARY_CLASS } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={`${BUTTON_PRIMARY_CLASS} ${className}`} {...props}>
      {children}
    </button>
  )
}
