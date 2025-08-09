// Update 2025-08-09: Commit-Trigger-Kommentar für Deployment
// DEPLOY: Force deployment trigger
import { useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import * as api from '../utils/api';
import easterEggSystem from '../utils/easterEggs';

const ProductManagement = ({ onClose }) => {
  // Helper function for API requests
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`/${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
  };

  const [standardArticles, setStandardArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customArticles, setCustomArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [newArticle, setNewArticle] = useState({ name: '', icon: '', category: '' });
  const [newFavorite, setNewFavorite] = useState({ name: '', icon: '', category: '', searchQuery: '' });
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [showAddFavorite, setShowAddFavorite] = useState(false);
  const [filteredStandardArticles, setFilteredStandardArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [editMode, setEditMode] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [selectedFavorites, setSelectedFavorites] = useState(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTarget, setEmojiTarget] = useState(null); // 'newCategory', 'editingCategory', 'editingArticle', 'newArticle'

  const fetchData = async () => {
    await Promise.all([
      fetchStandardArticles(),
      fetchCategories(),
      fetchCustomArticles(),
      fetchFavorites()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStandardArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const articles = await api.fetchStandardArticles(token);
      setStandardArticles(articles);
    } catch (error) {
      console.error('Error fetching standard articles:', error);
    }
  };

  const fetchCustomArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const articles = await api.fetchStandardArticles(token);
      // Filter to only user-created articles (not global)
      const customOnly = articles.filter(article => !article.is_global);
      setCustomArticles(customOnly);
    } catch (error) {
      console.error('Error fetching custom articles:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const favs = await api.fetchFavorites(token);
      setFavorites(favs);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const cats = await api.fetchCategories(token);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim() || !newCategory.icon.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          icon: newCategory.icon.trim()
        })
      });

      if (response.ok) {
        setNewCategory({ name: '', icon: '' });
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Fehler beim Hinzufügen der Kategorie');
    }
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    
    if (!newArticle.name.trim() || !newArticle.category) return;

    // Check for Easter Eggs before adding
    const icon = newArticle.icon || '📦';
    const category = newArticle.category;
    easterEggSystem.checkStarsAndSweets(icon, category);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/standard-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newArticle.name.trim(),
          category: newArticle.category,
          icon: icon
        })
      });

      if (response.ok) {
        setNewArticle({ name: '', icon: '', category: '' });
        setShowAddArticle(false);
        fetchCustomArticles();
        fetchStandardArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Fehler beim Hinzufügen des Artikels');
    }
  };

  // Filter standard articles based on search query
  const handleStandardArticleSearch = (query) => {
    if (!query.trim()) {
      setFilteredStandardArticles([]);
      return;
    }
    
    const filtered = groupedArticles.standard?.filter(article => 
      article.name.toLowerCase().includes(query.toLowerCase())
    ) || [];
    setFilteredStandardArticles(filtered);
  };

  // Add favorite from standard article
  const addFavoriteFromStandard = async (standardArticle) => {
    try {
      const newFav = {
        name: standardArticle.name,
        icon: standardArticle.icon,
        category: newFavorite.category || standardArticle.category
      };
      
      // Check for Easter Eggs before adding
      easterEggSystem.checkStarsAndSweets(newFav.icon, newFav.category);
      
      await apiRequest('api/articles', {
        method: 'POST',
        body: JSON.stringify({
          ...newFav,
          type: 'favorite'
        })
      });
      
      setNewFavorite({ name: '', icon: '', category: '', searchQuery: '' });
      setFilteredStandardArticles([]);
      fetchStandardArticles();
      fetchCustomArticles();
      fetchFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  // Add new favorite
  const addFavorite = async () => {
    if (!newFavorite.name.trim() || !newFavorite.category) return;
    
    // Check for Easter Eggs before adding
    const icon = newFavorite.icon || '📦';
    const category = newFavorite.category;
    easterEggSystem.checkStarsAndSweets(icon, category);
    
    try {
      await apiRequest('api/articles', {
        method: 'POST',
        body: JSON.stringify({
          ...newFavorite,
          icon: icon,
          type: 'favorite'
        })
      });
      
      setNewFavorite({ name: '', icon: '', category: '', searchQuery: '' });
      setShowAddFavorite(false);
      setFilteredStandardArticles([]);
      fetchStandardArticles();
      fetchCustomArticles();
      fetchFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.icon.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/categories/${editingCategory.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingCategory.name.trim(),
          icon: editingCategory.icon.trim()
        })
      });

      if (response.ok) {
        setEditingCategory(null);
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Bearbeiten');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Fehler beim Bearbeiten der Kategorie');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Fehler beim Löschen der Kategorie');
    }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.size === 0) return;
    
    const count = selectedCategories.size;
    if (!window.confirm(`Möchten Sie wirklich ${count} Kategorien löschen?`)) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedCategories).map(categoryId =>
        fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);
      setSelectedCategories(new Set());
      fetchCategories();
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      alert('Fehler beim Löschen der Kategorien');
    }
  };

  const handleSelectCategory = (categoryId) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleSelectAllCategories = () => {
    const editableCategories = categories.filter(cat => !cat.is_global);
    if (selectedCategories.size === editableCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(editableCategories.map(c => c.id)));
    }
  };

  // Article management functions
  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    
    if (!editingArticle || !editingArticle.name.trim() || !editingArticle.category) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/standard-articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingArticle.name.trim(),
          category: editingArticle.category,
          icon: editingArticle.icon
        })
      });

      if (response.ok) {
        setEditingArticle(null);
        fetchCustomArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Bearbeiten');
      }
    } catch (error) {
      console.error('Error updating standard article:', error);
      alert('Fehler beim Bearbeiten des Artikels');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Möchten Sie diesen Artikel wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/standard-articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCustomArticles();
        fetchStandardArticles(); // Also refresh standard articles
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting standard article:', error);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const handleMoveArticleToCategory = async (articleId, newCategory) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/standard-articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newCategory
        })
      });

      if (response.ok) {
        fetchStandardArticles();
        fetchCustomArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Verschieben');
      }
    } catch (error) {
      console.error('Error moving article:', error);
      alert('Fehler beim Verschieben des Artikels');
    }
  };

  const handleSelectArticle = (articleId) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleSelectAllArticles = () => {
    const editableArticles = activeTab === 'view' 
      ? standardArticles.filter(a => !a.is_global)
      : customArticles;
      
    if (selectedArticles.size === editableArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(editableArticles.map(a => a.id)));
    }
  };

  const handleBulkDeleteArticles = async () => {
    if (selectedArticles.size === 0) return;
    
    const count = selectedArticles.size;
    if (!window.confirm(`Möchten Sie wirklich ${count} Artikel löschen?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/standard-articles/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ids: Array.from(selectedArticles)
        })
      });

      if (response.ok) {
        setSelectedArticles(new Set());
        fetchCustomArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error bulk deleting articles:', error);
      alert('Fehler beim Löschen der Artikel');
    }
  };

  // Favorites management functions
  const handleDeleteFavorite = async (favoriteId) => {
    if (!window.confirm('Möchten Sie diesen Favoriten wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.removeFromFavorites(favoriteId, token);
      fetchFavorites();
    } catch (error) {
      console.error('Error deleting favorite:', error);
      alert('Fehler beim Löschen des Favoriten');
    }
  };

  const handleSelectFavorite = (favoriteId) => {
    const newSelected = new Set(selectedFavorites);
    if (newSelected.has(favoriteId)) {
      newSelected.delete(favoriteId);
    } else {
      newSelected.add(favoriteId);
    }
    setSelectedFavorites(newSelected);
  };

  const handleSelectAllFavorites = () => {
    if (selectedFavorites.size === favorites.length) {
      setSelectedFavorites(new Set());
    } else {
      setSelectedFavorites(new Set(favorites.map(f => f.id)));
    }
  };

  const handleBulkDeleteFavorites = async () => {
    if (selectedFavorites.size === 0) return;
    
    const count = selectedFavorites.size;
    if (!window.confirm(`Möchten Sie wirklich ${count} Favoriten löschen?`)) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedFavorites).map(favoriteId =>
        api.removeFromFavorites(favoriteId, token)
      );

      await Promise.all(promises);
      setSelectedFavorites(new Set());
      fetchFavorites();
    } catch (error) {
      console.error('Error bulk deleting favorites:', error);
      alert('Fehler beim Löschen der Favoriten');
    }
  };

  const handleEmojiSelect = (emoji) => {
    switch (emojiTarget) {
      case 'newCategory':
        setNewCategory({...newCategory, icon: emoji});
        break;
      case 'editingCategory':
        setEditingCategory({...editingCategory, icon: emoji});
        break;
      case 'editingArticle':
        setEditingArticle({...editingArticle, icon: emoji});
        break;
      case 'newArticle':
        setNewArticle({...newArticle, icon: emoji});
        break;
      default:
        // No action needed for unknown targets
        break;
    }
    setShowEmojiPicker(false);
    setEmojiTarget(null);
  };

  // Group articles by category
  const groupedArticles = standardArticles.reduce((groups, article) => {
    const category = article.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(article);
    return groups;
  }, {});

  // Group custom articles by category
  const groupedCustomArticles = customArticles.reduce((groups, article) => {
    const category = article.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(article);
    return groups;
  }, {});

  // Group favorites by category
  const groupedFavorites = favorites.reduce((groups, favorite) => {
    const category = favorite.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(favorite);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-white">Lade Produktverwaltung...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">📦 Produktverwaltung</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {setActiveTab('view'); setEditMode(false);}}
            className={`px-6 py-3 font-medium ${
              activeTab === 'view'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Standardartikel
          </button>
          <button
            onClick={() => {setActiveTab('custom'); setEditMode(false);}}
            className={`px-6 py-3 font-medium ${
              activeTab === 'custom'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📦 Eigene Artikel
          </button>
          <button
            onClick={() => {setActiveTab('favorites'); setEditMode(false);}}
            className={`px-6 py-3 font-medium ${
              activeTab === 'favorites'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⭐ Favoriten
          </button>
          <button
            onClick={() => {setActiveTab('categories'); setEditMode(false);}}
            className={`px-6 py-3 font-medium ${
              activeTab === 'categories'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏷️ Kategorien
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'view' && (
            <div className="space-y-6">
              {/* Edit Mode Controls for Standard Articles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Standardartikel</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditMode(!editMode);
                        setSelectedArticles(new Set());
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        editMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      ✏️ {editMode ? 'Bearbeitung beenden' : 'Bearbeiten'}
                    </button>
                  </div>
                </div>
                
                {editMode && (
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <label className="flex items-center gap-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedArticles.size === standardArticles.filter(a => !a.is_global).length && standardArticles.filter(a => !a.is_global).length > 0}
                        onChange={handleSelectAllArticles}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                      />
                      Alle eigenen Standardartikel auswählen ({standardArticles.filter(a => !a.is_global).length} Artikel)
                    </label>
                    {selectedArticles.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                          {selectedArticles.size} ausgewählt
                        </span>
                        <button
                          onClick={handleBulkDeleteArticles}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {Object.keys(groupedArticles).sort().map(category => (
                <div key={category} className="space-y-3">
                  <h4 className="text-md font-semibold text-white flex items-center gap-2">
                    {categories.find(cat => cat.name === category)?.icon || '📦'} {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupedArticles[category].map((article) => (
                      <div
                        key={article.id}
                        className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                          selectedArticles.has(article.id) && !article.is_global
                            ? 'bg-blue-700 border border-blue-500' 
                            : 'bg-gray-700 border border-transparent'
                        }`}
                        draggable={editMode && !article.is_global}
                        onDragStart={(e) => {
                          if (editMode && !article.is_global) {
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              id: article.id,
                              name: article.name,
                              icon: article.icon,
                              category: article.category
                            }));
                          }
                        }}
                        onDragOver={(e) => editMode && e.preventDefault()}
                        onDrop={(e) => {
                          if (editMode) {
                            e.preventDefault();
                            const draggedArticle = JSON.parse(e.dataTransfer.getData('text/plain'));
                            if (draggedArticle.category !== category) {
                              handleMoveArticleToCategory(draggedArticle.id, category);
                            }
                          }
                        }}
                      >
                        {editingArticle?.id === article.id ? (
                          <form onSubmit={handleUpdateArticle} className="flex-1 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingArticle.icon}
                                onChange={(e) => setEditingArticle({...editingArticle, icon: e.target.value})}
                                className="w-10 px-1 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="🍎"
                                maxLength={2}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEmojiTarget('editingArticle');
                                  setShowEmojiPicker(true);
                                }}
                                className="p-1 text-gray-400 hover:text-white text-sm"
                                title="Symbol auswählen"
                              >
                                😀
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingArticle.name}
                              onChange={(e) => setEditingArticle({...editingArticle, name: e.target.value})}
                              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            <select
                              value={editingArticle.category}
                              onChange={(e) => setEditingArticle({...editingArticle, category: e.target.value})}
                              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              {categories.map(cat => (
                                <option key={cat.uuid || cat.name} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="text-green-400 hover:text-green-300 text-lg">✓</button>
                            <button 
                              type="button" 
                              onClick={() => setEditingArticle(null)}
                              className="text-red-400 hover:text-red-300 text-lg"
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          <>
                            {editMode && !article.is_global && (
                              <input
                                type="checkbox"
                                checked={selectedArticles.has(article.id)}
                                onChange={() => handleSelectArticle(article.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mr-2"
                              />
                            )}
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-lg">{article.icon}</span>
                              <span className="text-white">{article.name}</span>
                              {!article.is_global && (
                                <span className="text-blue-400 text-sm" title="Eigener Artikel">👤</span>
                              )}
                            </div>
                            {editMode && !article.is_global && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingArticle(article)}
                                  className="text-orange-400 hover:text-orange-300 text-sm p-1"
                                  title="Bearbeiten"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(article.id)}
                                  className="text-red-400 hover:text-red-300 text-sm p-1"
                                  title="Löschen"
                                >
                                  �️
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              {editMode && (
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedArticles.size === customArticles.length && customArticles.length > 0}
                      onChange={handleSelectAllArticles}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Alle eigenen Artikel auswählen ({customArticles.length} Artikel)
                  </label>
                  {selectedArticles.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {selectedArticles.size} ausgewählt
                      </span>
                      <button
                        onClick={handleBulkDeleteArticles}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Eigene Artikel</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowAddArticle(!showAddArticle);
                        setNewArticle({ name: '', icon: '', category: categories[0]?.name || '' });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ➕ Artikel hinzufügen
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(!editMode);
                        setSelectedArticles(new Set());
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        editMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      ✏️ {editMode ? 'Bearbeitung beenden' : 'Bearbeiten'}
                    </button>
                  </div>
                </div>
                
                {/* Add Article Form */}
                {showAddArticle && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <form onSubmit={handleAddArticle} className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmojiTarget('newArticle');
                            setShowEmojiPicker(true);
                          }}
                          className="w-10 h-10 bg-gray-600 border border-gray-500 rounded-lg text-white text-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                          title="Symbol auswählen"
                        >
                          {newArticle.icon || '�'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newArticle.name}
                        onChange={(e) => setNewArticle({...newArticle, name: e.target.value})}
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Artikelname..."
                        required
                      />
                      <select
                        value={newArticle.category}
                        onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                        className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Kategorie wählen</option>
                        {categories.map(cat => (
                          <option key={cat.uuid || cat.name} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm">
                        ✓ Hinzufügen
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowAddArticle(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                )}
                
                {customArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">Noch keine eigenen Artikel vorhanden</p>
                    <p className="text-gray-500 text-sm">
                      Erstellen Sie Standard-Artikel in der Artikelverwaltung
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedCustomArticles).sort().map(category => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-md font-semibold text-white flex items-center gap-2">
                        {categories.find(cat => cat.name === category)?.icon || '📦'} {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {groupedCustomArticles[category].map((article) => (
                          <div
                            key={article.id}
                            className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                              selectedArticles.has(article.id) 
                                ? 'bg-blue-700 border border-blue-500' 
                                : 'bg-gray-700 border border-transparent'
                            }`}
                          >
                            {editingArticle?.id === article.id ? (
                              <form onSubmit={handleUpdateArticle} className="flex-1 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingArticle.icon}
                                    onChange={(e) => setEditingArticle({...editingArticle, icon: e.target.value})}
                                    className="w-10 px-1 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="🍎"
                                    maxLength={2}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEmojiTarget('editingArticle');
                                      setShowEmojiPicker(true);
                                    }}
                                    className="p-1 text-gray-400 hover:text-white text-sm"
                                    title="Symbol auswählen"
                                  >
                                    😀
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={editingArticle.name}
                                  onChange={(e) => setEditingArticle({...editingArticle, name: e.target.value})}
                                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                                <select
                                  value={editingArticle.category}
                                  onChange={(e) => setEditingArticle({...editingArticle, category: e.target.value})}
                                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                >
                                  {categories.map(cat => (
                                    <option key={cat.uuid || cat.name} value={cat.name}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                                <button type="submit" className="text-green-400 hover:text-green-300 text-lg">✓</button>
                                <button 
                                  type="button" 
                                  onClick={() => setEditingArticle(null)}
                                  className="text-red-400 hover:text-red-300 text-lg"
                                >
                                  ✕
                                </button>
                              </form>
                            ) : (
                              <>
                                {editMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedArticles.has(article.id)}
                                    onChange={() => handleSelectArticle(article.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mr-2"
                                  />
                                )}
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-lg">{article.icon}</span>
                                  <span className="text-white">{article.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingArticle(article)}
                                    className="text-orange-400 hover:text-orange-300 text-sm p-1"
                                    title="Bearbeiten"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArticle(article.id)}
                                    className="text-red-400 hover:text-red-300 text-sm p-1"
                                    title="Löschen"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              {editMode && (
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedFavorites.size === favorites.length && favorites.length > 0}
                      onChange={handleSelectAllFavorites}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Alle Favoriten auswählen ({favorites.length} Favoriten)
                  </label>
                  {selectedFavorites.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {selectedFavorites.size} ausgewählt
                      </span>
                      <button
                        onClick={handleBulkDeleteFavorites}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Favoriten</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditMode(!editMode);
                        setSelectedFavorites(new Set());
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        editMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      ✏️ {editMode ? 'Bearbeitung beenden' : 'Bearbeiten'}
                    </button>
                  </div>
                </div>
                
                {favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">Noch keine Favoriten vorhanden</p>
                    <p className="text-gray-500 text-sm">
                      Markieren Sie Artikel als Favoriten, um sie hier zu sehen
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedFavorites).sort().map(category => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-md font-semibold text-white flex items-center gap-2">
                        {categories.find(cat => cat.name === category)?.icon || '📦'} {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {groupedFavorites[category].map((favorite) => (
                          <div
                            key={favorite.id}
                            className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                              selectedFavorites.has(favorite.id) 
                                ? 'bg-blue-700 border border-blue-500' 
                                : 'bg-gray-700 border border-transparent'
                            }`}
                          >
                            {editMode && (
                              <input
                                type="checkbox"
                                checked={selectedFavorites.has(favorite.id)}
                                onChange={() => handleSelectFavorite(favorite.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 mr-2"
                              />
                            )}
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-lg">{favorite.icon}</span>
                              <span className="text-white">{favorite.name}</span>
                              <span className="text-yellow-400 text-sm ml-auto" title="Favorit">⭐</span>
                            </div>
                            {editMode && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteFavorite(favorite.id)}
                                  className="text-red-400 hover:text-red-300 text-sm p-1"
                                  title="Löschen"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Favorite Form */}
              <div className="bg-gray-800 rounded-lg p-6 mt-6">
                <button
                  onClick={() => setShowAddFavorite(!showAddFavorite)}
                  className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold mb-4"
                >
                  <span className="text-lg">⭐</span>
                  {showAddFavorite ? 'Favorit hinzufügen ausblenden' : 'Neuen Favorit hinzufügen'}
                </button>

                {showAddFavorite && (
                  <div className="space-y-4">
                    {/* Search in Standard Articles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Aus Standardartikeln auswählen
                      </label>
                      <input
                        type="text"
                        value={newFavorite.searchQuery}
                        onChange={(e) => {
                          setNewFavorite(prev => ({ ...prev, searchQuery: e.target.value }));
                          handleStandardArticleSearch(e.target.value);
                        }}
                        placeholder="Artikel suchen..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      {filteredStandardArticles.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 rounded-lg border border-gray-600">
                          {filteredStandardArticles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => addFavoriteFromStandard(article)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-600 flex items-center gap-2"
                            >
                              <span className="text-lg">{article.icon}</span>
                              <span className="text-white">{article.name}</span>
                              <span className="text-gray-400 text-sm ml-auto">{article.category}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-600 pt-4">
                      <p className="text-gray-400 text-sm mb-4">Oder neuen Favorit erstellen:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={newFavorite.name}
                            onChange={(e) => setNewFavorite(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Artikelname"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Kategorie
                          </label>
                          <select
                            value={newFavorite.category}
                            onChange={(e) => setNewFavorite(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Kategorie wählen</option>
                            {categories.map((cat) => (
                              <option key={cat.uuid} value={cat.name}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Icon
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2"
                          >
                            <span className="text-lg">{newFavorite.icon || '🔍'}</span>
                            Icon wählen
                          </button>
                        </div>
                        
                        {showEmojiPicker && (
                          <div className="mt-2">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                setNewFavorite(prev => ({ ...prev, icon: emojiData.emoji }));
                                setShowEmojiPicker(false);
                              }}
                              theme="dark"
                              searchDisabled={false}
                              skinTonesDisabled={true}
                              width="100%"
                              height={400}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={addFavorite}
                          disabled={!newFavorite.name.trim() || !newFavorite.category}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <span>⭐</span>
                          Favorit hinzufügen
                        </button>
                        <button
                          onClick={() => {
                            setShowAddFavorite(false);
                            setNewFavorite({ name: '', icon: '', category: '', searchQuery: '' });
                            setFilteredStandardArticles([]);
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              {editMode && (
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCategories.size === categories.filter(cat => !cat.is_global).length && categories.filter(cat => !cat.is_global).length > 0}
                      onChange={handleSelectAllCategories}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Alle eigenen Kategorien auswählen ({categories.filter(cat => !cat.is_global).length} Kategorien)
                  </label>
                  {selectedCategories.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {selectedCategories.size} ausgewählt
                      </span>
                      <button
                        onClick={handleBulkDeleteCategories}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Verfügbare Kategorien</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCategoryEditMode(!categoryEditMode);
                        setSelectedCategories(new Set());
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        categoryEditMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {categoryEditMode ? 'Beenden' : 'Bearbeiten'}
                    </button>
                  </div>
                </div>
                
                {categoryEditMode && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-white">
                          <input
                            type="checkbox"
                            checked={selectedCategories.size === categories.filter(c => !c.is_global).length && categories.filter(c => !c.is_global).length > 0}
                            onChange={handleSelectAllCategories}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          Alle auswählen
                        </label>
                        <span className="text-gray-400">
                          {selectedCategories.size} von {categories.filter(c => !c.is_global).length} ausgewählt
                        </span>
                      </div>
                      {selectedCategories.size > 0 && (
                        <button
                          onClick={handleBulkDeleteCategories}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.uuid || category.name}
                      className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                        selectedCategories.has(category.uuid) && !category.is_global
                          ? 'bg-blue-700 border border-blue-500' 
                          : 'bg-gray-700 border border-transparent'
                      }`}
                    >
                      {editingCategory?.uuid === category.uuid ? (
                        <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingCategory.icon}
                              onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                              className="w-10 px-1 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="🍎"
                              maxLength={2}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEmojiTarget('editingCategory');
                                setShowEmojiPicker(true);
                              }}
                              className="p-1 text-gray-400 hover:text-white text-sm"
                              title="Symbol auswählen"
                            >
                              😀
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button type="submit" className="text-green-400 hover:text-green-300 text-lg">✓</button>
                          <button 
                            type="button" 
                            onClick={() => setEditingCategory(null)}
                            className="text-red-400 hover:text-red-300 text-lg"
                          >
                            ✕
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            {categoryEditMode && !category.is_global && (
                              <input
                                type="checkbox"
                                checked={selectedCategories.has(category.uuid)}
                                onChange={() => handleSelectCategory(category.uuid)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            )}
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-white">{category.name}</span>
                            {!category.is_global && (
                              <span className="text-blue-400 text-sm" title="Eigene Kategorie">👤</span>
                            )}
                          </div>
                          {!category.is_global && !categoryEditMode && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingCategory(category)}
                                className="text-orange-400 hover:text-orange-300 text-sm"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.uuid)}
                                className="text-red-400 hover:text-red-300 text-sm"
                                title="Löschen"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Neue Kategorie hinzufügen</h3>
                <form onSubmit={handleAddCategory} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategoriename
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Gewürze"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Symbol
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="🌶️"
                        maxLength={2}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEmojiTarget('newCategory');
                          setShowEmojiPicker(true);
                        }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        title="Symbol auswählen"
                      >
                        😀
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Kategorie hinzufügen
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect}
          onClose={() => {
            setShowEmojiPicker(false);
            setEmojiTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;
