// Update 2025-08-09: Commit-Trigger-Kommentar für Deployment
import { useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import ArticleBrowser from './ArticleBrowser';
import * as api from '../utils/api';

// Fixed duplicate import issue - Clean version
export default function ArticleForm({ onAdded, currentList, token }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [articleHistory, setArticleHistory] = useState([]);
  const [standardArticles, setStandardArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showArticleBrowser, setShowArticleBrowser] = useState(false);

  useEffect(() => {
    loadArticleHistory();
    loadStandardArticles();
    loadFavorites();
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    if (name.length > 0) {
      // Combine history, standard articles, and favorites for suggestions
      const allSuggestions = [...articleHistory, ...standardArticles, ...favorites];
      const filtered = allSuggestions.filter(article =>
        article.name.toLowerCase().includes(name.toLowerCase()) &&
        article.name.toLowerCase() !== name.toLowerCase() // Exclude exact matches
      );
      // Remove duplicates based on name and category
      const uniqueFiltered = filtered.filter((item, index, arr) => 
        arr.findIndex(i => i.name === item.name && i.category === item.category) === index
      );
      setFilteredSuggestions(uniqueFiltered);
      setShowSuggestions(uniqueFiltered.length > 0);
    } else {
      // When input is empty, show dropdown with favorites and search option
      setFilteredSuggestions([]);
      // Don't automatically show suggestions when empty, will be shown on focus
    }
  }, [name, articleHistory, standardArticles, favorites]);

  async function loadArticleHistory() {
    try {
      const data = await api.fetchArticleHistory(token);
      setArticleHistory(data);
    } catch (error) {
      console.error('Error loading article history:', error);
    }
  }

  async function loadStandardArticles() {
    try {
      const data = await api.fetchStandardArticles(token);
      setStandardArticles(data);
    } catch (error) {
      console.error('Error loading standard articles:', error);
    }
  }

  async function loadFavorites() {
    try {
      const data = await api.fetchFavorites(token);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async function loadCategories() {
    try {
      const data = await api.fetchCategories(token);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !currentList) return;
    
    setLoading(true);
    try {
      // Backend handles icon selection based on category
      const articleIcon = null; // Let backend handle icon selection
      const data = { name: name.trim(), category, icon: articleIcon, comment: comment.trim() };
      
      await api.createArticle(currentList.uuid, data, token);
      
      onAdded();
      loadArticleHistory(); // Refresh history
      setName(''); 
      setComment('');
    } catch (err) {
      console.error('Error creating article:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(suggestion) {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setComment(suggestion.comment || '');
    setShowSuggestions(false);
  }

  async function handleQuickAdd(article) {
    if (!currentList) return;
    
    setLoading(true);
    try {
      const data = { 
        name: article.name.trim(), 
        category: article.category, 
        icon: article.icon || '📦', 
        comment: article.comment || '' 
      };
      
      await api.createArticle(currentList.uuid, data, token);
      
      onAdded();
      loadArticleHistory(); // Refresh history
      setName(''); 
      setComment('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error creating article:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleEmojiSelect(emoji) {
    // For ArticleForm, we don't use custom icons, so this is just for future extension
    setShowEmojiPicker(false);
  }

  function handleArticleSelect(selectedArticle) {
    setName(selectedArticle.name);
    setCategory(selectedArticle.category);
    setComment(selectedArticle.comment || '');
    setShowArticleBrowser(false);
    setShowSuggestions(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Artikelname *
          </label>
          <div className="relative">
            <div className="flex">
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="z.B. Äpfel, Brot... (Tippen für Vorschläge)" 
                className="input-field flex-1 pr-20" 
                required 
                onFocus={() => {
                  if (name.length > 0) {
                    setShowSuggestions(filteredSuggestions.length > 0);
                  } else {
                    setShowArticleBrowser(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowArticleBrowser(true)}
                  className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
                  title="Artikelliste durchsuchen"
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
          
          {/* Inline tip when field is empty */}
          {name.length === 0 && (
            <div className="mt-2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <div className="text-xs text-blue-300">
                💡 Tippen Sie, um zu suchen oder klicken Sie auf die Lupe für die Artikelübersicht
              </div>
            </div>
          )}
          
          {/* Inline suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
              <div className="border-b border-gray-600">
                <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-700 cursor-pointer transition-colors"
                     onClick={() => setShowArticleBrowser(true)}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🔍</span>
                    <span className="font-medium text-white">Alle Artikel durchsuchen</span>
                  </div>
                  <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                    Suche
                  </span>
                </div>
              </div>
              
              {favorites.length > 0 && (
                <div className="border-b border-gray-600">
                  <div className="px-3 py-2 bg-gray-700">
                    <div className="text-xs text-gray-300 font-medium">
                      ⭐ Favoriten
                    </div>
                  </div>
                  <div className="max-h-24 overflow-y-auto">
                    {favorites.slice(0, 6).map((fav, index) => (
                      <div
                        key={`fav-${index}`}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                        onClick={() => selectSuggestion(fav)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{fav.icon || '📦'}</span>
                            <span className="font-medium text-white">{fav.name}</span>
                            <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                              {fav.category}
                            </span>
                          </div>
                          <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">
                            Favorit
                          </span>
                        </div>
                        {fav.comment && (
                          <div className="text-xs text-gray-400 mt-1 ml-6">{fav.comment}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="px-3 py-2 bg-gray-700 border-b border-gray-600">
                <div className="text-xs text-gray-300 font-medium">
                  📋 Passende Artikel ({filteredSuggestions.length})
                </div>
              </div>
              {filteredSuggestions.map((suggestion, index) => {
                const isFromFavorites = favorites.some(fav => fav.name === suggestion.name && fav.category === suggestion.category);
                const isFromHistory = articleHistory.some(hist => hist.name === suggestion.name && hist.category === suggestion.category);
                const sourceLabel = isFromFavorites ? 'Favorit' : isFromHistory ? 'Verlauf' : suggestion.is_global ? 'Standard' : 'Persönlich';
                const sourceColor = isFromFavorites ? 'text-yellow-400 bg-yellow-900/30' : isFromHistory ? 'text-green-400 bg-green-900/30' : 'text-blue-400 bg-blue-900/30';
                
                return (
                  <div key={`${suggestion.name}-${suggestion.category}-${index}`}>
                    <div
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 transition-colors"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{suggestion.icon || '📦'}</span>
                          <span className="font-medium text-white">{suggestion.name}</span>
                          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                            {suggestion.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${sourceColor}`}>
                            {sourceLabel}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(suggestion);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                            title="Direkt hinzufügen"
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                      {suggestion.comment && (
                        <div className="text-xs text-gray-400 mt-1 ml-6">{suggestion.comment}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Quick add new article option */}
              {name.trim() && !filteredSuggestions.some(s => s.name.toLowerCase() === name.toLowerCase()) && (
                <div className="border-t border-gray-700">
                  <div
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => {
                      if (category) {
                        handleQuickAdd({
                          name: name.trim(),
                          category: category,
                          icon: '📦',
                          comment: comment
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📦</span>
                        <span className="font-medium text-green-400">"{name}" als neuen Artikel hinzufügen</span>
                        {category && (
                          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                            {category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (category) {
                            handleQuickAdd({
                              name: name.trim(),
                              category: category,
                              icon: '📦',
                              comment: comment
                            });
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        disabled={!category}
                        title={category ? "Direkt hinzufügen" : "Bitte wählen Sie zuerst eine Kategorie"}
                      >
                        ➕
                      </button>
                    </div>
                    {!category && (
                      <div className="text-xs text-orange-400 mt-1">
                        Bitte wählen Sie zuerst eine Kategorie aus
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kategorie
          </label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            className="select-field w-full"
          >
            <option value="">Kategorie wählen</option>
            {categories.map(cat => (
              <option key={cat.uuid || cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Kommentar
        </label>
        <textarea 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          placeholder="Zusätzliche Notizen..." 
          className="input-field w-full h-20 resize-none" 
          rows="3"
        />
      </div>
      
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading || !name.trim() || !currentList}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Hinzufügen...</span>
            </>
          ) : (
            <>
              <span>➕</span>
              <span>Hinzufügen</span>
            </>
          )}
        </button>
      </div>
      
      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Article Browser Modal */}
      {showArticleBrowser && (
        <ArticleBrowser
          articles={[...articleHistory, ...standardArticles, ...favorites]}
          categories={categories}
          onSelect={handleArticleSelect}
          onClose={() => setShowArticleBrowser(false)}
          onAddNew={(articleData) => {
            setName(articleData.name);
            setCategory(articleData.category);
            setComment(articleData.comment || '');
            setShowArticleBrowser(false);
          }}
          token={token}
        />
      )}
    </form>
  );
}
// FINAL LINE - DO NOT ADD ANY CODE AFTER THIS COMMENT - Version 2
