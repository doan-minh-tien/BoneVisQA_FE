import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const variantClass: Record<Variant, string> = {
  primary:
    'border border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover focus-visible:ring-cyan-accent shadow-[0_8px_24px_rgba(0,123,255,0.22)]',
  secondary:
    'border border-cyan-accent/25 bg-cyan-accent/10 text-cyan-accent hover:bg-cyan-accent/15 focus-visible:ring-cyan-accent',
  outline:
    'border border-border-color bg-surface text-text-main hover:bg-surface/80 focus-visible:ring-cyan-accent',
  ghost: 'text-text-main hover:bg-surface/70 focus-visible:ring-cyan-accent',
  destructive:
    'border border-danger bg-danger text-white hover:bg-danger/90 focus-visible:ring-cyan-accent shadow-[0_8px_24px_rgba(239,68,68,0.16)]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', isLoading, disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium tracking-[0.01em]
        transition-colors duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
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
