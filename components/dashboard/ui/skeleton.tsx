import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "motion-safe:animate-pulse rounded-md bg-muted/60 dark:bg-white/[0.05] border-0",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
