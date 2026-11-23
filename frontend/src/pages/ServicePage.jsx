import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getService } from '../api/catalog';
import { ErrorState, Loader } from '../components/Feedback';
import { Availability } from '../components/ServiceCard';
import { priceLabel } from '../format';
import { useResource } from '../hooks/useResource';

export function ServicePage() {
  const { id } = useParams();
  const load = useCallback((signal) => getService(id, signal), [id]);
  const service = useResource(load);

  return (
    <>
      <Link className="back-link" to="/">← К каталогу</Link>
      {service.phase === 'loading' && <Loader />}
      {service.phase === 'error' && <ErrorState error={service.error} retry={service.error.status !== 404 ? service.retry : null} />}
      {service.phase === 'ready' && (
        <div className="detail-layout">
          <article className="detail-main">
            <span className="category-label">{service.data.category_name}</span>
            <h1>{service.data.name}</h1>
            <h2>О занятии</h2>
            <p>{service.data.description}</p>
          </article>
          <aside className="detail-aside">
            <Availability available={service.data.is_available} />
            <dl>
              <div><dt>Стоимость</dt><dd>{priceLabel(service.data.price)}</dd></div>
              <div><dt>Длительность</dt><dd>{service.data.duration_minutes} мин</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </>
  );
}
