import { Link } from 'react-router-dom';
import { priceLabel } from '../format';

export function Availability({ available }) {
  return (
    <span className={`availability ${available ? 'available' : 'unavailable'}`}>
      {available ? 'Запись открыта' : 'Запись закрыта'}
    </span>
  );
}

export function ServiceCard({ service, children }) {
  return (
    <article className="service-card">
      <div className="service-top">
        <span className="category-label">{service.category_name}</span>
        {children}
      </div>
      <h3><Link to={`/services/${service.id}`}>{service.name}</Link></h3>
      <p>{service.description}</p>
      <div className="service-bottom">
        <div>
          <strong className="price">{priceLabel(service.price)}</strong>
          <span className="duration">{service.duration_minutes} мин</span>
        </div>
        <Availability available={service.is_available} />
      </div>
    </article>
  );
}
