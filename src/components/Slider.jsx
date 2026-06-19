export default function Slider({ value, onChange, max = 20, side = 'left', disabled = false, ariaLabel }) {
  const v = Number(value) || 0
  const pct = Math.max(0, Math.min(100, (v / max) * 100))

  return (
    <div className={`slider ${side} ${disabled ? 'disabled' : ''}`}>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={v}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        style={{ '--pct': `${pct}%` }}
      />
      <div className="slider-scale">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
