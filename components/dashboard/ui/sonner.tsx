"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// The dashboard is light-only for now, so no next-themes provider is needed.
//
// Dashboard overrides (raise toasts via lib/dashboard/toast.ts, not sonner):
// - offsets clear the sticky top bar (h-14 mobile / h-16 lg) so a toast
//   never covers the hamburger or user menu; below 600px sonner goes
//   full-width, which is where it used to sit on top of the hamburger.
// - the close button is a 40×40 target on the right instead of sonner's
//   20px corner badge, and the toast leaves room for it.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      offset={{ top: 72 }}
      mobileOffset={{ top: 64, left: 12, right: 12 }}
      containerAriaLabel="Notifications"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:pr-12",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-1 !top-1/2 !h-10 !w-10 !-translate-y-1/2 !transform !rounded-md !border-0 !bg-transparent !text-current opacity-70 hover:!bg-black/5 hover:opacity-100 focus-visible:!ring-2 focus-visible:!ring-ring [&_svg]:!h-4 [&_svg]:!w-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
