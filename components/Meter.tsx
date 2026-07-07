export function Meter({
  value,
  max = 5,
  hot = false,
  label,
}: {
  value: number;
  max?: number;
  hot?: boolean;
  label?: string;
}) {
  const v = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className={`meter${hot ? " hot" : ""}`}
      role="img"
      aria-label={`${label ?? "score"}: ${v} of ${max}`}
      title={`${v}/${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < v ? "on" : ""} />
      ))}
    </span>
  );
}
