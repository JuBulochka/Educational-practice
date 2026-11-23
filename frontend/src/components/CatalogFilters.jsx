export const defaultFilters = {
  category: '', is_available: '', min_price: '', max_price: '', search: '', ordering: '',
};

export function CatalogFilters({ filters, categories, onChange, onReset }) {
  const numberProps = { type: 'number', min: 0, step: '0.01', inputMode: 'decimal' };
  const priceError = filters.min_price !== '' && filters.max_price !== ''
    && Number(filters.min_price) > Number(filters.max_price);

  return (
    <aside className="filter-panel" aria-label="Фильтры каталога">
      <div className="filter-heading">
        <h2>Фильтры</h2>
        <button className="text-button" type="button" onClick={onReset}>Сбросить</button>
      </div>
      <label>
        <span id="filter-category-label">Категория</span>
        <select aria-labelledby="filter-category-label" value={filters.category}
          onChange={(event) => onChange('category', event.target.value)}>
          <option value="">Все категории</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>
        <span id="filter-availability-label">Доступность</span>
        <select aria-labelledby="filter-availability-label" value={filters.is_available}
          onChange={(event) => onChange('is_available', event.target.value)}>
          <option value="">Любая</option>
          <option value="true">Можно записаться</option>
          <option value="false">Запись закрыта</option>
        </select>
      </label>
      <fieldset>
        <legend>Цена, ₽</legend>
        <div className="price-inputs">
          <label className="sr-only" htmlFor="min-price">Цена от</label>
          <input id="min-price" placeholder="От" value={filters.min_price} {...numberProps}
            onChange={(event) => onChange('min_price', event.target.value)} />
          <label className="sr-only" htmlFor="max-price">Цена до</label>
          <input id="max-price" placeholder="До" value={filters.max_price} {...numberProps}
            aria-invalid={priceError || undefined} aria-describedby={priceError ? 'price-error' : undefined}
            onChange={(event) => onChange('max_price', event.target.value)} />
        </div>
        {priceError && <div className="field-error" id="price-error">Цена «до» меньше цены «от».</div>}
      </fieldset>
    </aside>
  );
}
