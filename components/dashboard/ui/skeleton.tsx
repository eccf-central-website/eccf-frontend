import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border-0 bg-[linear-gradient(100deg,var(--sk-base)_0%,var(--sk-shine)_46%,var(--sk-base)_92%)] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
