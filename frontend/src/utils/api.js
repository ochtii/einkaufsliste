const API_BASE = 'http://localhost:4000/api';

export async function fetchArticles() {
  const res = await fetch(`${API_BASE}/articles`);
  return res.json();
}

export async function createArticle(data) {
  const res = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateArticle(id, data) {
  await fetch(`${API_BASE}/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deleteArticle(id) {
  await fetch(`${API_BASE}/articles/${id}`, { method: 'DELETE' });
}