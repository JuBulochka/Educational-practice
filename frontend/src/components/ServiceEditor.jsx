import { useState } from 'react';
import { saveService } from '../api/catalog';
import { ErrorState } from './Feedback';
import { FormField } from './FormField';

export function ServiceEditor({ service, categories, onDone, onCancel }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const errors = error?.data;

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const saved = await saveService(service?.id, {
        name: data.get('name'),
        description: data.get('description'),
        category: Number(data.get('category')),
        price: data.get('price'),
        duration_minutes: Number(data.get('duration_minutes')),
        is_available: data.has('is_available'),
      });
      onDone(saved, !service);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-panel standard-form editor" onSubmit={submit}>
      <h2>{service ? 'Редактирование услуги' : 'Новая услуга'}</h2>
      <fieldset className="form-fields" disabled={pending}>
        <FormField label="Название" name="name" errors={errors}>
          {(props) => <input {...props} defaultValue={service?.name} required maxLength={160} />}
        </FormField>
        <FormField label="Категория" name="category" errors={errors}>
          {(props) => (
            <select {...props} required defaultValue={service?.category || ''}>
              <option value="" disabled>Выберите категорию</option>
              {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
        </FormField>
        <FormField label="Описание" name="description" errors={errors}>
          {(props) => <textarea {...props} defaultValue={service?.description} rows={4} required maxLength={4000} />}
        </FormField>
        <div className="editor-numbers">
          <FormField label="Цена, ₽" name="price" errors={errors}>
            {(props) => <input {...props} type="number" min={0} step="0.01" required defaultValue={service?.price} />}
          </FormField>
          <FormField label="Длительность, мин" name="duration_minutes" errors={errors}>
            {(props) => <input {...props} type="number" min={1} step={1} required defaultValue={service?.duration_minutes} />}
          </FormField>
        </div>
        <label className="checkbox"><input type="checkbox" name="is_available" defaultChecked={service?.is_available ?? true} /> Запись открыта</label>
        {error && <ErrorState error={error} />}
        <div className="form-actions">
          <button className="button" type="submit">{pending ? 'Сохраняем…' : 'Сохранить'}</button>
          <button className="button secondary" type="button" onClick={onCancel}>Отмена</button>
        </div>
      </fieldset>
    </form>
  );
}
