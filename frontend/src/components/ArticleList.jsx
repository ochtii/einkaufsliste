import CategoryIcon from './CategoryIcon';
import ArticleForm from './ArticleForm';

export default function ArticleList({ articles, onToggleBought, onDelete, onAddToFavorites, favoriteIds = new Set(), onAdded, currentList, token }) {
  const exportShoppingList = () => {
    if (!currentList || articles.length === 0) {
      alert('Keine Artikel zum Exportieren vorhanden.');
      return;
    }

    // Gruppiere Artikel nach Kategorien für den Export
    const groupedArticles = articles.reduce((groups, article) => {
      const category = article.category || 'Sonstiges';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(article);
      return groups;
    }, {});

    // Erstelle den Text-Inhalt
    let content = `Einkaufsliste: ${currentList.name}\n`;
    content += `Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n`;
    content += `Anzahl Artikel: ${articles.length}\n`;
    content += `==========================================\n\n`;

    // Füge Kategorien und Artikel hinzu
    Object.entries(groupedArticles).forEach(([category, categoryArticles]) => {
      content += `${category.toUpperCase()}\n`;
      content += '-'.repeat(category.length) + '\n';
      
      categoryArticles.forEach((article, index) => {
        const status = article.is_bought ? '[✓]' : '[ ]';
        content += `${status} ${article.name}`;
        if (article.comment) {
          content += ` (${article.comment})`;
        }
        content += '\n';
      });
      content += '\n';
    });

    // Statistiken hinzufügen
    const boughtCount = articles.filter(a => a.is_bought).length;
    const remainingCount = articles.length - boughtCount;
    content += '\n==========================================\n';
    content += `STATISTIK:\n`;
    content += `Gekauft: ${boughtCount} von ${articles.length} Artikeln\n`;
    content += `Verbleibend: ${remainingCount} Artikel\n`;

    // Datei herunterladen
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Einkaufsliste_${currentList.name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (articles.length === 0) {
    return (
      <div className="space-y-6">
        {/* Article Form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            ➕ Artikel hinzufügen zu "{currentList?.name}"
          </h2>
          <ArticleForm 
            onAdded={onAdded}
            currentList={currentList}
            token={token}
          />
        </div>
        
        {/* Empty State */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">Keine Artikel vorhanden</h3>
          <p className="text-gray-500">Füge deinen ersten Artikel zur Einkaufsliste hinzu!</p>
        </div>
      </div>
    );
  }

  // Gruppiere Artikel nach Kategorien
  const groupedArticles = articles.reduce((groups, article) => {
    const category = article.category || 'Sonstiges';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(article);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Article Form */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          ➕ Artikel hinzufügen zu "{currentList?.name}"
        </h2>
        <ArticleForm 
          onAdded={onAdded}
          currentList={currentList}
          token={token}
        />
      </div>
      
      {/* Export Button */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            📝 Einkaufsliste "{currentList?.name}"
          </h2>
          <button
            onClick={exportShoppingList}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            📄 Liste exportieren
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-400">
          {articles.length} Artikel • {articles.filter(a => a.is_bought).length} gekauft
        </div>
      </div>
      
      {/* Article List */}
      {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">
            {category} ({categoryArticles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryArticles.map(article => {
              const isFavorite = favoriteIds.has(`${article.name}-${article.category}`);
              
              return (
                <div 
                  key={article.id} 
                  className={`border rounded-lg p-4 transition-colors duration-200 ${
                    article.is_bought 
                      ? 'bg-green-900/20 border-green-800' 
                      : isFavorite
                      ? 'bg-yellow-900/10 border-yellow-800/50 hover:border-yellow-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="relative">
                        <CategoryIcon 
                          category={article.category} 
                          icon={article.icon} 
                          defaultIcon={article.category} 
                        />
                        {isFavorite && (
                          <div className="absolute -top-1 -right-1 text-xs">⭐</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${
                          article.is_bought ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {article.name}
                        </h4>
                        {article.comment && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{article.comment}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      <button 
                        onClick={() => onToggleBought(article)} 
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          article.is_bought 
                            ? 'text-green-400 hover:text-green-300 bg-green-400/10' 
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                        }`}
                        title={article.is_bought ? 'Als nicht gekauft markieren' : 'Als gekauft markieren'}
                      >
                        {article.is_bought ? '✅' : '☐'}
                      </button>

                      <button 
                        onClick={() => onAddToFavorites(article)} 
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isFavorite 
                            ? 'text-yellow-400 bg-yellow-400/10' 
                            : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                        }`}
                        title={isFavorite ? 'Bereits in Favoriten' : 'Zu Favoriten hinzufügen'}
                      >
                        ⭐
                      </button>
                      
                      <button 
                        onClick={() => onDelete(article.id)} 
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors duration-200"
                        title="Artikel löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}