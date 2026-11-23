import { useCallback, useState } from 'react';
import { deleteService, getCategories, getServices, getStaffSession, loginStaff, logoutStaff } from '../api/catalog';
import { EmptyState, ErrorState, Loader } from '../components/Feedback';
import { Pagination } from '../components/Pagination';
import { Availability } from '../components/ServiceCard';
import { ServiceEditor } from '../components/ServiceEditor';
import { priceLabel } from '../format';
import { useDebounce } from '../hooks/useDebounce';
import { useResource } from '../hooks/useResource';

function StaffLogin({ onLogin }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await loginStaff({ username: fields.get('username'), password: fields.get('password') });
      onLogin();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-panel standard-form" onSubmit={submit}>
      <h2>Вход для сотрудников</h2>
      <fieldset className="form-fields" disabled={pending}>
        <label>Логин<input name="username" autoComplete="username" required /></label>
        <label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label>
        {error?.status === 403 ? (
          <p className="field-error" role="alert">Проверьте логин и пароль сотрудника.</p>
        ) : error && <ErrorState error={error} />}
        <button className="button" type="submit">{pending ? 'Входим…' : 'Войти'}</button>
      </fieldset>
    </form>
  );
}

function StaffCatalog({ username, onLogout }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const search = useDebounce(query);
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const categories = useResource(getCategories);
  const load = useCallback((signal) => getServices({ page, search }, signal), [page, search]);
  const catalog = useResource(load);

  function changeSearch(value) {
    setPage(1);
    setQuery(value);
  }

  function saved(service, created) {
    setEditor(null);
    setNotice(created ? 'Услуга добавлена.' : 'Изменения сохранены.');
    if (created) changeSearch(service.name);
    catalog.retry();
  }

  async function remove(service) {
    if (busy || !window.confirm(`Удалить услугу «${service.name}»?`)) return;
    setBusy(true);
    setActionError(null);
    setNotice('');
    try {
      await deleteService(service.id);
      setNotice('Услуга удалена.');
      if (page > 1 && catalog.data.results.length === 1) setPage(page - 1);
      catalog.retry();
    } catch (failure) {
      setActionError(failure);
    } finally {
      setBusy(false);
    }
  }

  async function exit() {
    setBusy(true);
    setActionError(null);
    try {
      await logoutStaff();
      onLogout();
    } catch (failure) {
      setActionError(failure);
      setBusy(false);
    }
  }

  function edit(service = null) {
    setNotice('');
    setActionError(null);
    setEditor({ service });
  }

  const locked = busy || editor !== null;
  const retryBlocked = catalog.error?.status === 403 ? onLogout : catalog.retry;

  return (
    <>
      <div className="staff-bar">
        <span>Сотрудник <strong>{username}</strong></span>
        <button className="button secondary" type="button" disabled={locked} onClick={exit}>Выйти</button>
      </div>
      {notice && <p className="manage-notice" role="status">{notice}</p>}
      {actionError && <ErrorState error={actionError} />}
      {categories.phase === 'error' && <ErrorState error={categories.error} retry={categories.retry} />}
      {editor && (
        <ServiceEditor service={editor.service} categories={categories.data} onDone={saved} onCancel={() => setEditor(null)} />
      )}
      <div className="manage-toolbar">
        <label>
          Поиск по услугам
          <input type="search" value={query} disabled={locked} onChange={(event) => changeSearch(event.target.value)} />
        </label>
        <button className="button" type="button" disabled={locked || !categories.data?.length} onClick={() => edit()}>
          Добавить услугу
        </button>
      </div>
      {catalog.phase === 'loading' && <Loader />}
      {catalog.phase === 'error' && <ErrorState error={catalog.error} retry={retryBlocked} />}
      {catalog.phase === 'ready' && (catalog.data.results.length ? (
        <>
          <ul className="manage-list" aria-label="Услуги">
            {catalog.data.results.map((service) => (
              <li key={service.id} className="manage-row">
                <div>
                  <span className="category-label">{service.category_name}</span>
                  <h3>{service.name}</h3>
                  <div className="manage-meta">
                    <strong>{priceLabel(service.price)}</strong>
                    <span>{service.duration_minutes} мин</span>
                    <Availability available={service.is_available} />
                  </div>
                </div>
                <div className="manage-actions">
                  <button className="button secondary" type="button" disabled={locked || !categories.data}
                    aria-label={`Изменить: ${service.name}`} onClick={() => edit(service)}>Изменить</button>
                  <button className="button secondary danger" type="button" disabled={locked}
                    aria-label={`Удалить: ${service.name}`} onClick={() => remove(service)}>Удалить</button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination data={catalog.data} page={page} onPage={setPage} disabled={locked} />
        </>
      ) : <EmptyState title="Услуги не найдены" />)}
    </>
  );
}

export function ManagePage() {
  const session = useResource(getStaffSession);

  return (
    <>
      <section className="intro"><h1>Управление каталогом</h1></section>
      {session.phase === 'loading' && <Loader />}
      {session.phase === 'error' && <ErrorState error={session.error} retry={session.retry} />}
      {session.phase === 'ready' && (session.data.username ? (
        <StaffCatalog username={session.data.username} onLogout={session.retry} />
      ) : <StaffLogin onLogin={session.retry} />)}
    </>
  );
}
