// Check if we're in demo mode
const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                  (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

const API_BASE = isDemoMode ? 'https://einkaufsliste-demo-backend.onrender.com/api' : 'http://localhost:4000/api';

// Helper function to make API calls with demo fallback
async function apiCall(endpoint, options = {}) {
  if (isDemoMode && window.DemoAPI) {
    // Use demo API for GitHub Pages
    return await window.DemoAPI.fetch(endpoint, options);
  }
  
  // Regular API call
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response;
}

export async function fetchArticles() {
  const res = await apiCall('/articles');
  return res.json();
}

export async function createArticle(data) {
  const res = await apiCall('/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateArticle(id, data) {
  await apiCall(`/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deleteArticle(id) {
  await apiCall(`/articles/${id}`, { method: 'DELETE' });
}