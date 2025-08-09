import { useState, useEffect } from 'react';
import CategoryIcon from './CategoryIcon';

export default function ArticleBrowser({ articles, categories, onSelect, onClose, onAddNew, token }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newArticleName, setNewArticleName] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState('');
  const [newArticleComment, setNewArticleComment] = useState('');

  useEffect(() => {
    // Remove duplicates based on name and category combination
    const uniqueArticles = articles.filter((item, index, arr) => 
      arr.findIndex(i => i.name === item.name && i.category === item.category) === index
    );

    let filtered = uniqueArticles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory]);

  // Get unique categories from articles
  const articleCategories = [...new Set(articles.map(a => a.category))].sort();
  
  const handleAddNew = () => {
    if (!newArticleName.trim()) return;
    
    onAddNew({
      name: newArticleName.trim(),
      category: newArticleCategory || (categories[0]?.name) || 'Sonstiges',
      comment: newArticleComment.trim()
    });
    
    setShowAddDialog(false);
    setNewArticleName('');
    setNewArticleCategory('');
    setNewArticleComment('');
  };

  const groupedArticles = filteredArticles.reduce((groups, article) => {
    const category = article.category || 'Sonstiges';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(article);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">🔍 Gespeicherte Artikel durchsuchen</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artikel suchen
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name oder Kategorie eingeben..."
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kategorie filtern
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select-field w-full"
              >
                <option value="">Alle Kategorien</option>
                {articleCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {filteredArticles.length} Artikel gefunden
            </div>
            <button
              onClick={() => setShowAddDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              ➕ Neuen Artikel hinzufügen
            </button>
          </div>
        </div>

        {/* Article List */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedArticles).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-400">Keine Artikel gefunden</p>
              <p className="text-gray-500 text-sm mt-1">
                Versuchen Sie eine andere Suche oder fügen Sie einen neuen Artikel hinzu
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-3">
                    {category} ({categoryArticles.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryArticles.map((article, index) => (
                      <div
                        key={`${article.name}-${article.category}-${index}`}
                        onClick={() => onSelect(article)}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <CategoryIcon 
                            category={article.category} 
                            icon={article.icon} 
                            defaultIcon={article.category} 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">
                              {article.name}
                            </h4>
                            <p className="text-sm text-blue-400 mt-1">
                              {article.category}
                            </p>
                            {article.comment && (
                              <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                {article.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Article Dialog */}
        {showAddDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Neuen Artikel hinzufügen</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Artikelname *
                  </label>
                  <input
                    type="text"
                    value={newArticleName}
                    onChange={(e) => setNewArticleName(e.target.value)}
                    placeholder="z.B. Äpfel, Brot..."
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie *
                  </label>
                  <select
                    value={newArticleCategory}
                    onChange={(e) => setNewArticleCategory(e.target.value)}
                    className="select-field w-full"
                    required
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={cat.uuid || cat.name} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kommentar
                  </label>
                  <textarea
                    value={newArticleComment}
                    onChange={(e) => setNewArticleComment(e.target.value)}
                    placeholder="Zusätzliche Notizen..."
                    className="input-field w-full h-20 resize-none"
                    rows="3"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAddNew}
                    disabled={!newArticleName.trim() || !newArticleCategory}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
