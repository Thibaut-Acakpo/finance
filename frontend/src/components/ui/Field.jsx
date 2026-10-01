export function Label({ children }) {
  return <label className="mb-1.5 block text-xs font-medium text-white/60">{children}</label>;
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-coral-400">{children}</p>;
}

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border bg-ink-900/70 px-3 py-2.5 text-sm text-paper placeholder:text-white/30 outline-none transition-colors focus:border-mint-500/60 ${
        error ? 'border-coral-500/60' : 'border-white/10'
      } ${className}`}
      {...props}
    />
  );
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border bg-ink-900/70 px-3 py-2.5 text-sm text-paper outline-none transition-colors focus:border-mint-500/60 ${
        error ? 'border-coral-500/60' : 'border-white/10'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Button({ variant = 'primary', className = '', children, loading, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-mint-500 text-ink-950 hover:bg-mint-400 shadow-glow',
    ghost: 'bg-white/5 text-paper hover:bg-white/10 border border-white/10',
    danger: 'bg-coral-500/15 text-coral-400 hover:bg-coral-500/25 border border-coral-500/30',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
