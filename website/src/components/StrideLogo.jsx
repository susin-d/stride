/* Shared brand mark — brushstroke "S", painted in currentColor (brand-mark.css) */
export function StrideLogo({ size = 30, className = "" }) {
  return (
    <span
      role="img"
      aria-label="Stride"
      className={`stride-logo-icon ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  )
}
