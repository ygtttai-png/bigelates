export function LoadingState({ message = "Yükleniyor…" }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-[var(--ink-2)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
