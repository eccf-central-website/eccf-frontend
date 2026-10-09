"use client"

import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/components/dashboard/theme/ThemeProvider"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
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
            "!left-auto !right-1 !top-1/2 !h-10 !w-10 !-translate-y-1/2 !transform !rounded-md !border-0 !bg-transparent !text-current opacity-70 hover:!bg-foreground/5 hover:opacity-100 focus-visible:!ring-2 focus-visible:!ring-ring [&_svg]:!h-4 [&_svg]:!w-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
