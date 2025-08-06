import CategoryIcon from './CategoryIcon';

export default function FavoriteList({ favorites, onSelect, onRemove }) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⭐</div>
        <p className="text-gray-400 text-sm">Noch keine Favoriten</p>
        <p className="text-gray-500 text-xs mt-1">Markiere Artikel als Favoriten für schnellen Zugriff</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map(favorite => (
        <div 
          key={favorite.uuid} 
          className="bg-gray-800 border border-gray-700 rounded-lg p-3 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 flex-1 cursor-pointer hover:text-blue-400"
              onClick={() => onSelect(favorite)}
              title="Zu aktueller Liste hinzufügen"
            >
              <CategoryIcon 
                category={favorite.category} 
                icon={favorite.icon} 
                defaultIcon={favorite.category} 
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                  {favorite.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{favorite.category}</p>
              </div>
            </div>
            
            <button
              onClick={() => onRemove(favorite.uuid)}
              className="text-red-400 hover:text-red-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Aus Favoriten entfernen"
            >
              ✕
            </button>
          </div>
          
          {favorite.comment && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{favorite.comment}</p>
          )}
        </div>
      ))}
      
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
        Klicke auf einen Favoriten um ihn hinzuzufügen
      </div>
    </div>
  );
}