// Check if we're in demo mode
const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                  (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

const API_BASE = isDemoMode ? '' : 'http://localhost:4000';

// Helper function to make API calls with demo fallback
async function apiCall(endpoint, options = {}) {
  // Force demo mode for GitHub Pages and when DemoAPI is available
  if ((isDemoMode || window.location.hostname === 'ochtii.github.io') && window.DemoAPI) {
    console.log('Using DemoAPI for:', endpoint);
    return await window.DemoAPI.fetch(endpoint, options);
  }
  
  // Regular API call
  const url = `${API_BASE}/api${endpoint}`;
  console.log('Making API call to:', url);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response;
}

// Auth API
export async function loginUser(username, password) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  return await response.json();
}

export async function logoutUser() {
  if (window.DemoAPI) {
    return window.DemoAPI.logout();
  }
  
  const response = await apiCall('/auth/logout', { method: 'POST' });
  return response.ok;
}

// Lists API
export async function fetchLists(token) {
  const response = await apiCall('/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch lists');
  }
  
  return await response.json();
}

export async function createList(name, token) {
  const response = await apiCall('/lists', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create list');
  }
  
  return await response.json();
}

export async function deleteList(id, token) {
  const response = await apiCall(`/lists/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.ok;
}

// Articles API
export async function fetchArticles(listId, token) {
  const response = await apiCall(`/lists/${listId}/articles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }
  
  return await response.json();
}

export async function createArticle(listId, articleData, token) {
  const response = await apiCall(`/lists/${listId}/articles`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(articleData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create article');
  }
  
  return await response.json();
}

export async function updateArticle(listId, articleId, articleData, token) {
  const response = await apiCall(`/lists/${listId}/articles/${articleId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(articleData)
  });
  
  return response.ok;
}

export async function deleteArticle(listId, articleId, token) {
  const response = await apiCall(`/lists/${listId}/articles/${articleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.ok;
}

// Favorites API
export async function fetchFavorites(token) {
  const response = await apiCall('/favorites', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }
  
  return await response.json();
}

export async function addToFavorites(articleData, token) {
  const response = await apiCall('/favorites', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(articleData)
  });
  
  return response.ok;
}

export async function removeFromFavorites(favoriteId, token) {
  const response = await apiCall(`/favorites/${favoriteId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.ok;
}

// Categories and Standard Articles API
export async function fetchCategories(token) {
  const response = await apiCall('/categories', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return await response.json();
}

export async function fetchStandardArticles(token) {
  const response = await apiCall('/standard-articles', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch standard articles');
  }
  
  return await response.json();
}

export async function fetchArticleHistory(token) {
  const response = await apiCall('/articles/history', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    // Don't throw error for history, just return empty array
    return [];
  }
  
  return await response.json();
}

// Broadcasts API (for admin messages)
export async function fetchBroadcasts(token) {
  const response = await apiCall('/broadcasts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    // Don't throw error for broadcasts, just return empty array
    return [];
  }
  
  return await response.json();
}

export async function confirmBroadcast(broadcastId, token) {
  const response = await apiCall(`/broadcasts/${broadcastId}/confirm`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.ok;
}

// User Profile API
export async function fetchUserProfile(token) {
  const response = await apiCall('/user/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return await response.json();
}

export async function changePassword(passwordData, token) {
  const response = await apiCall('/change-password', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(passwordData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
  
  return await response.json();
}

export async function changeUsername(usernameData, token) {
  const response = await apiCall('/change-username', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(usernameData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change username');
  }
  
  return await response.json();
}