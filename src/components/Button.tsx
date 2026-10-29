import type { ComponentPropsWithRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant
  block?: boolean
}

export function Button({
  variant = 'primary',
  block = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...props} />
}
