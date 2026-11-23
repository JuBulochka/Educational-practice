import { useCallback, useState } from 'react';
import { getCategories, getServices } from '../api/catalog';
import { CatalogFilters, defaultFilters } from '../components/CatalogFilters';
import { EmptyState, ErrorState, Loader } from '../components/Feedback';
import { Pagination } from '../components/Pagination';
import { ServiceCard } from '../components/ServiceCard';
import { serviceCount } from '../format';
import { useDebounce } from '../hooks/useDebounce';
import { useResource } from '../hooks/useResource';

export function CatalogPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const { search, category, is_available, min_price, max_price, ordering } = filters;
  const searchQuery = useDebounce(search.trim());
  const categories = useResource(getCategories);
  const loadServices = useCallback(
    (signal) => getServices({
      category, is_available, min_price, max_price, ordering, search: searchQuery, page,
    }, signal),
    [category, is_available, min_price, max_price, ordering, searchQuery, page],
  );
  const services = useResource(loadServices);

  function changeFilter(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }));
    setPage(1);
  }

  function reset() {
    setFilters(defaultFilters);
    setPage(1);
  }

  return (
    <>
      <section className="intro">
        <h1>Каталог услуг</h1>
        <p>Занятия и консультации учебного центра. Выберите направление, посмотрите условия и оставьте заявку.</p>
      </section>
      <div className="catalog-layout">
        <div>
          <CatalogFilters filters={filters} categories={categories.data || []} onChange={changeFilter} onReset={reset} />
          {categories.phase === 'error' && <ErrorState error={categories.error} retry={categories.retry} />}
        </div>
        <section aria-label="Результаты поиска" className="results">
          <div className="catalog-toolbar">
            <label>
              Поиск по услугам
              <input type="search" placeholder="Например, английский" value={search}
                onChange={(event) => changeFilter('search', event.target.value)} />
            </label>
            <label>
              Сортировка
              <select value={ordering} onChange={(event) => changeFilter('ordering', event.target.value)}>
                <option value="">По умолчанию</option>
                <option value="price">Сначала дешевле</option>
                <option value="-price">Сначала дороже</option>
              </select>
            </label>
          </div>
          {services.phase === 'loading' && <Loader>Загружаем услуги…</Loader>}
          {services.phase === 'error' && <ErrorState error={services.error} retry={services.retry} />}
          {services.phase === 'ready' && (
            <>
              <p className="result-count" role="status">{serviceCount(services.data.count)}</p>
              {services.data.results.length ? (
                <div className="services-grid">
                  {services.data.results.map((service) => <ServiceCard key={service.id} service={service} />)}
                </div>
              ) : (
                <EmptyState title="Услуги не найдены"
                  action={<button className="button secondary" onClick={reset}>Сбросить фильтры</button>}>
                  Попробуйте другой запрос или измените фильтры.
                </EmptyState>
              )}
              <Pagination data={services.data} page={page} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
