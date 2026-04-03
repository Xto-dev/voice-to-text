import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-20 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-950 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
