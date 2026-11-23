import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createRequest, getService } from '../api/catalog';
import { EmptyState, ErrorState, Loader } from '../components/Feedback';
import { FormField } from '../components/FormField';
import { priceLabel } from '../format';
import { useResource } from '../hooks/useResource';

function RequestForm({ service }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await createRequest({
        service_id: service.id,
        client_name: fields.get('client_name'),
        phone: fields.get('phone'),
        desired_at: new Date(fields.get('desired_at')).toISOString(),
      });
      setConfirmation(result.id);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  if (confirmation !== null) {
    return (
      <div className="confirmation" role="status">
        <h2>Заявка №{confirmation} принята</h2>
        <p>Сотрудник учебного центра свяжется с вами по указанному телефону.</p>
        <Link className="button secondary" to="/">Вернуться в каталог</Link>
      </div>
    );
  }

  const fieldErrors = error?.data;
  return (
    <form className="form-panel standard-form" onSubmit={submit}>
      <fieldset disabled={pending} className="form-fields">
        <FormField label="Имя" name="client_name" errors={fieldErrors}>
          {(props) => <input {...props} required autoComplete="name" maxLength={120} />}
        </FormField>
        <FormField label="Телефон" name="phone" errors={fieldErrors}>
          {(props) => <input {...props} type="tel" required autoComplete="tel" maxLength={40} placeholder="+7 900 000-00-00" />}
        </FormField>
        <FormField label="Желаемые дата и время" name="desired_at" errors={fieldErrors}
          hint="Время указывается по часовому поясу вашего устройства.">
          {(props) => <input {...props} type="datetime-local" required />}
        </FormField>
        {fieldErrors?.service_id && <p className="field-error" role="alert">{fieldErrors.service_id.join(' ')}</p>}
        {error && <ErrorState error={error} />}
        <div className="form-actions">
          <button className="button" type="submit">{pending ? 'Отправляем…' : 'Отправить заявку'}</button>
          <Link className="button secondary" to={`/services/${service.id}`}>Отмена</Link>
        </div>
      </fieldset>
    </form>
  );
}

export function RequestPage() {
  const { id } = useParams();
  const load = useCallback((signal) => getService(id, signal), [id]);
  const service = useResource(load);

  return (
    <>
      <Link className="back-link" to={`/services/${id}`}>← К услуге</Link>
      <h1 className="page-title">Оставить заявку</h1>
      {service.phase === 'loading' && <Loader />}
      {service.phase === 'error' && <ErrorState error={service.error} retry={service.error.status !== 404 ? service.retry : null} />}
      {service.phase === 'ready' && (
        <div className="request-layout">
          {service.data.is_available ? <RequestForm key={id} service={service.data} /> : (
            <EmptyState title="Запись закрыта" action={<Link className="button secondary" to="/">Вернуться в каталог</Link>} />
          )}
          <aside className="detail-aside">
            <span className="category-label">{service.data.category_name}</span>
            <h2>{service.data.name}</h2>
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
