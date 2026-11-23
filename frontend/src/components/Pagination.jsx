export function Pagination({ data, page, onPage, disabled = false }) {
  if (!data.previous && !data.next) return null;
  return (
    <nav className="pagination" aria-label="Страницы каталога">
      <button className="button secondary" type="button" disabled={disabled || !data.previous} onClick={() => onPage(page - 1)}>
        Назад
      </button>
      <span aria-current="page">Страница {page}</span>
      <button className="button secondary" type="button" disabled={disabled || !data.next} onClick={() => onPage(page + 1)}>
        Далее
      </button>
    </nav>
  );
}
