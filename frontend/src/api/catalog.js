import { api } from './client';

function queryString(values) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (value !== '' && value !== undefined) query.set(name, value);
  }
  return query.size ? `?${query}` : '';
}

export const getServices = (filters, signal) => api(`/services/${queryString(filters)}`, { signal });
export const getService = (id, signal) => api(`/services/${id}/`, { signal });
export const createRequest = (data) => api('/requests/', { method: 'POST', data });
export const getStaffSession = (signal) => api('/auth/session/', { signal });
export const loginStaff = (data) => api('/auth/login/', { method: 'POST', data });
export const logoutStaff = () => api('/auth/logout/', { method: 'POST' });
export const saveService = (id, data) => id
  ? api(`/services/${id}/`, { method: 'PATCH', data })
  : api('/services/', { method: 'POST', data });
export const deleteService = (id) => api(`/services/${id}/`, { method: 'DELETE' });

export async function getCategories(signal) {
  const categories = [];
  let page = 1;
  do {
    const result = await api(`/categories/?page=${page}`, { signal });
    categories.push(...result.results);
    if (!result.next) return categories;
    page += 1;
  } while (true);
}
