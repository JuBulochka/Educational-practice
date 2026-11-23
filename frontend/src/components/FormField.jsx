export function FormField({ label, name, errors, children, hint }) {
  const error = errors?.[name];
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <label>
      {label}
      {children({
        name,
        'aria-invalid': Boolean(error) || undefined,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
      })}
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error" id={errorId}>{Array.isArray(error) ? error.join(' ') : error}</span>}
    </label>
  );
}
