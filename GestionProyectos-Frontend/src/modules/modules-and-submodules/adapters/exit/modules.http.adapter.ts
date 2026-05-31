// Adaptador HTTP de ejemplo. Reemplazar baseUrl/fetch por el cliente real.
const BASE_URL = '/api/modules';

export const modulesHttpAdapter = {
  list: () => fetch(BASE_URL).then((r) => r.json()),
  getById: (id) => fetch(`${BASE_URL}/${id}`).then((r) => r.json()),
  create: (dto) =>
    fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    }).then((r) => r.json()),
  update: (dto) =>
    fetch(`${BASE_URL}/${dto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    }).then((r) => r.json()),
  remove: (id) =>
    fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then((r) => r.ok)
};
