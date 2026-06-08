import type { IconName } from "./icon";
import { Icon } from "./icon";

interface EmptyStateProps {
  icon: IconName;
  message: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, message, children }: EmptyStateProps) {
  return (
    <div className="px-5 py-10 text-center text-[var(--ink-3)]">
      <div className="mx-auto mb-3.5 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--ink-3)]">
        <Icon name={icon} />
      </div>
      <p>{message}</p>
      {children && <div className="mt-3.5">{children}</div>}
    </div>
  );
}
