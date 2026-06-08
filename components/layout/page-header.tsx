import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-4 lg:mb-[26px]", className)}>
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-[12.5px] font-medium tracking-wide text-[var(--ink-3)]">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[23px] font-bold tracking-tight lg:text-[27px]">{title}</h1>
      </div>
      {action}
    </div>
  );
}
