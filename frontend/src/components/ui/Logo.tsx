type LogoProps = {
  /** Tailwind sizing/spacing classes for the badge box. */
  className?: string
}

/**
 * WorkNest brand mark: a "W" monogram on an teal badge.
 */
export default function Logo({ className = '' }: LogoProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex select-none items-center justify-center font-bold leading-none text-white ${className}`}
    >
      W
    </div>
  )
}
