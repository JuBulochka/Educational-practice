import { errorMessage } from '../format';

export function Loader({ children = 'Загрузка…' }) {
  return <div className="feedback" role="status"><span className="spinner" aria-hidden="true" />{children}</div>;
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="feedback">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }) {
  return (
    <div className="feedback feedback-error" role="alert">
      <strong>{errorMessage(error)}</strong>
      {retry && <button className="button secondary" onClick={retry}>Повторить</button>}
    </div>
  );
}
