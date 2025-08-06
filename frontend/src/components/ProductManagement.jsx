import { useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import * as api from '../utils/api';

const ProductManagement = ({ onClose }) => {
  const [standardArticles, setStandardArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newArticle, setNewArticle] = useState({ name: '', category: '', icon: '' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [editMode, setEditMode] = useState(false);
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTarget, setEmojiTarget] = useState(null); // 'newArticle', 'newCategory', 'editingArticle', 'editingCategory'

  const fetchData = async () => {
    await Promise.all([
      fetchStandardArticles(),
      fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const cats = await api.fetchCategories(token);
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    
    if (!newArticle.name.trim() || !newArticle.category) return;

    try {
      const token = localStorage.getItem('token');
      const selectedCategory = categories.find(cat => cat.name === newArticle.category);
      const response = await fetch('/api/standard-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newArticle.name.trim(),
          category: newArticle.category,
          icon: newArticle.icon || selectedCategory?.icon || '📦'
        })
      });

      if (response.ok) {
        setNewArticle({ name: '', category: '', icon: '' });
        fetchStandardArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('Error adding standard article:', error);
      alert('Fehler beim Hinzufügen des Artikels');
    }
  };

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
        fetchStandardArticles();
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
    if (!window.confirm('Möchten Sie diesen Standardartikel wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/standard-articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStandardArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting standard article:', error);
      alert('Fehler beim Löschen des Artikels');
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

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.icon.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
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

  const handleBulkDelete = async () => {
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
        fetchStandardArticles();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error bulk deleting articles:', error);
      alert('Fehler beim Löschen der Artikel');
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

  const handleSelectArticle = (articleId) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedArticles.size === standardArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(standardArticles.map(a => a.id)));
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

  const handleEmojiSelect = (emoji) => {
    switch (emojiTarget) {
      case 'newArticle':
        setNewArticle({...newArticle, icon: emoji});
        break;
      case 'newCategory':
        setNewCategory({...newCategory, icon: emoji});
        break;
      case 'editingArticle':
        setEditingArticle({...editingArticle, icon: emoji});
        break;
      case 'editingCategory':
        setEditingCategory({...editingCategory, icon: emoji});
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
            {activeTab === 'view' && (
              <>
                {selectedArticles.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    🗑️ {selectedArticles.size} löschen
                  </button>
                )}
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editMode 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  ✏️ {editMode ? 'Bearbeitung beenden' : 'Bearbeiten'}
                </button>
              </>
            )}
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
              {/* Add Article Form */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">➕ Neuen Standardartikel hinzufügen</h3>
                <form onSubmit={handleAddArticle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Artikelname
                    </label>
                    <input
                      type="text"
                      value={newArticle.name}
                      onChange={(e) => setNewArticle({...newArticle, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Äpfel"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategorie
                    </label>
                    <select
                      value={newArticle.category}
                      onChange={(e) => {
                        const selectedCategory = categories.find(cat => cat.name === e.target.value);
                        setNewArticle({
                          ...newArticle, 
                          category: e.target.value,
                          icon: newArticle.icon || selectedCategory?.icon || '📦'
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Kategorie wählen</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Symbol (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newArticle.icon}
                        onChange={(e) => setNewArticle({...newArticle, icon: e.target.value})}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="🍞"
                        maxLength={2}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEmojiTarget('newArticle');
                          setShowEmojiPicker(true);
                        }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                        title="Symbol auswählen"
                      >
                        😀
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Hinzufügen
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {editMode && (
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedArticles.size === standardArticles.length && standardArticles.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    Alle auswählen ({standardArticles.length} Artikel)
                  </label>
                  {selectedArticles.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {selectedArticles.size} ausgewählt
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {Object.keys(groupedArticles).sort().map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {categories.find(cat => cat.name === category)?.icon || '📦'} {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupedArticles[category].map((article) => (
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
                                <option key={cat.id} value={cat.name}>
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
                              {!article.is_global && (
                                <span className="text-blue-400 text-sm" title="Eigener Artikel">👤</span>
                              )}
                            </div>
                            {editMode && (
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
                      key={category.id}
                      className={`rounded-lg p-3 flex items-center justify-between transition-colors ${
                        selectedCategories.has(category.id) && !category.is_global
                          ? 'bg-blue-700 border border-blue-500' 
                          : 'bg-gray-700 border border-transparent'
                      }`}
                    >
                      {editingCategory?.id === category.id ? (
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
                                checked={selectedCategories.has(category.id)}
                                onChange={() => handleSelectCategory(category.id)}
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
                                onClick={() => handleDeleteCategory(category.id)}
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
