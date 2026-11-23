import { Link, NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">П</span>
            <span><strong>Практика</strong><small>Учебный центр</small></span>
          </Link>
          <nav aria-label="Основное меню">
            <NavLink to="/" end>Каталог</NavLink>
            <NavLink to="/favorites">Избранное</NavLink>
            <NavLink to="/manage">Управление</NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="container main-content"><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Учебный центр «Практика»</span>
          <span>Учебный проект УП.05</span>
        </div>
      </footer>
    </>
  );
}
