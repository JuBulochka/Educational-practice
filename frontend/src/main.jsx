import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CatalogPage } from './pages/CatalogPage';
import { ServicePage } from './pages/ServicePage';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CatalogPage />} />
          <Route path="services/:id" element={<ServicePage />} />
          <Route path="*" element={<section className="intro"><h1>Страница не найдена</h1><Link to="/">Вернуться в каталог</Link></section>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
