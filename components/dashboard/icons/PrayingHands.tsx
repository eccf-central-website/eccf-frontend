import React from 'react'

export function PrayingHands({
  className,
  size = 24,
  strokeWidth = 1.7,
  ...props
}: {
  className?: string
  size?: number | string
  strokeWidth?: number | string
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.5C10.2 3.8 9 6 8.4 8.3C7.8 10.5 7.8 12.8 8.5 14.9C8.8 15.8 8.3 16.8 7.3 17.8L4.8 19.6C5.9 20.1 7.1 20.1 8.2 19.7C9.1 19.3 9.7 18.5 10.1 17.5C10.6 16.3 10.8 15 10.9 13.7C11 14.8 11.2 16.4 11.8 18.1C12 18.7 12 19.2 12 19.6C12 19.2 12 18.7 12.2 18.1C12.8 16.4 13 14.8 13.1 13.7C13.2 15 13.4 16.3 13.9 17.5C14.3 18.5 14.9 19.3 15.8 19.7C16.9 20.1 18.1 20.1 19.2 19.6L16.7 17.8C15.7 16.8 15.2 15.8 15.5 14.9C16.2 12.8 16.2 10.5 15.6 8.3C15 6 13.8 3.8 12 2.5Z" />
      <path d="M12 2.5V18" />
    </svg>
  )
}

export default PrayingHands
