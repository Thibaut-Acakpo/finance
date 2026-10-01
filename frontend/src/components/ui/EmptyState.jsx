export default function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {Icon && <Icon size={28} className="text-white/25" />}
      <p className="font-display text-sm text-white/60">{title}</p>
      {hint && <p className="max-w-xs text-xs text-white/35">{hint}</p>}
    </div>
  );
}
