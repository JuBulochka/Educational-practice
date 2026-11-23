import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getService } from '../api/catalog';
import { FavoriteButton } from '../components/FavoriteButton';
import { EmptyState, ErrorState, Loader } from '../components/Feedback';
import { ServiceCard } from '../components/ServiceCard';
import { useFavorites } from '../hooks/useFavorites';
import { useResource } from '../hooks/useResource';

export function FavoritesPage() {
  const { ids, toggle } = useFavorites();
  const load = useCallback(
    (signal) => Promise.all(ids.map(async (id) => {
      try {
        return { id, service: await getService(id, signal) };
      } catch (error) {
        if (error.status === 404) return { id, service: null };
        throw error;
      }
    })),
    [ids],
  );
  const favorites = useResource(load);

  return (
    <>
      <section className="intro"><h1>Избранное</h1></section>
      {ids.length === 0 ? (
        <EmptyState title="В избранном пока ничего нет" action={<Link className="button secondary" to="/">Перейти в каталог</Link>}>
          Нажмите на звёздочку рядом с нужной услугой, чтобы сохранить её в этом браузере.
        </EmptyState>
      ) : (
        <>
          {favorites.phase === 'loading' && <Loader />}
          {favorites.phase === 'error' && <ErrorState error={favorites.error} retry={favorites.retry} />}
          {favorites.phase === 'ready' && (
            <div className="services-grid">
              {favorites.data.map(({ id, service }) => service ? (
                <ServiceCard key={id} service={service}><FavoriteButton service={service} /></ServiceCard>
              ) : (
                <article className="service-card" key={id}>
                  <h3>Услуга больше недоступна</h3>
                  <p><button type="button" className="text-button" onClick={() => toggle(id)}>Убрать из избранного</button></p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
