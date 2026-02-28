import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <>
      <style>{`
        @keyframes strong-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .animate-strong-pulse {
          animation: strong-pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div
        data-slot="skeleton"
        className={cn("bg-slate-200 dark:bg-slate-800 animate-strong-pulse rounded-md", className)}
        {...props}
      />
    </>
  )
}

export { Skeleton }
