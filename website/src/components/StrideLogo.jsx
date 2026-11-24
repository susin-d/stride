export function StrideLogo({ size = 30, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="Stride Logo"
      width={size}
      height={size}
      className={`stride-logo-icon ${className}`}
    />
  )
}
