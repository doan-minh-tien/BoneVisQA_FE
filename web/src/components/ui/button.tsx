import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary:
    'border border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover focus-visible:ring-blue-500 shadow-[0_8px_24px_rgba(0,123,255,0.22)]',
  default:
    'border border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover focus-visible:ring-blue-500 shadow-[0_8px_24px_rgba(0,123,255,0.22)]',
  secondary:
    'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-blue-500',
  outline:
    'border border-border bg-card text-foreground hover:bg-slate-50 focus-visible:ring-blue-500',
  ghost: 'text-foreground hover:bg-slate-50 focus-visible:ring-blue-500',
  destructive:
    'border border-danger bg-danger text-white hover:bg-danger/90 focus-visible:ring-blue-500 shadow-[0_8px_24px_rgba(239,68,68,0.16)]',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-11 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-[0.01em]
        cursor-pointer transition-all duration-150
        active:scale-[0.98] disabled:active:scale-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        ${sizeClass[size]}
        ${variantClass[variant]}
        ${className}
      `}
      {...rest}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
});
