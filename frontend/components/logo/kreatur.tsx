import type * as React from "react"

import { cn } from "@/lib/utils"

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export const Kreatur: React.FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 443.32 443.32"
      fill="currentColor"
      {...props}
    >
      <rect x="295.55" width="147.77" height="147.77" />
      <polygon points="147.78 147.78 147.78 0 0 0 0 147.78 0 295.55 0 443.32 147.78 443.32 147.78 295.55 295.55 295.55 295.55 147.78 147.78 147.78" />
      <rect x="295.55" y="295.55" width="147.77" height="147.77" />
    </svg>
  )
}

/**
 * Kreatur dengan teks "Kreatur" di sampingnya.
 */
export function LogoWithText({ className, ...props }: IconProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Kreatur {...props} />
      <span className={cn("font-semibold tracking-tight")}>Kreatur</span>
    </div>
  )
}
