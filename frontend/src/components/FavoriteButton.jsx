import { useFavorites } from '../hooks/useFavorites';

export function FavoriteButton({ service }) {
  const { ids, toggle } = useFavorites();
  const saved = ids.includes(service.id);
  const label = saved ? 'Убрать из избранного' : 'В избранное';

  return (
    <button type="button" className="favorite-button" title={label}
      aria-label={`${label}: ${service.name}`} aria-pressed={saved}
      onClick={() => toggle(service.id)}>
      <span aria-hidden="true">{saved ? '★' : '☆'}</span>
    </button>
  );
}
