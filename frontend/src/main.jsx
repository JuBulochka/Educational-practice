import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FavoritesProvider } from './hooks/useFavorites';
import { CatalogPage } from './pages/CatalogPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ManagePage } from './pages/ManagePage';
import { RequestPage } from './pages/RequestPage';
import { ServicePage } from './pages/ServicePage';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FavoritesProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<CatalogPage />} />
            <Route path="services/:id" element={<ServicePage />} />
            <Route path="services/:id/request" element={<RequestPage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="*" element={<section className="intro"><h1>Страница не найдена</h1><Link to="/">Вернуться в каталог</Link></section>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  </StrictMode>,
);
