export default function CategoryIcon({ category, icon, defaultIcon }) {
  // Mapping von Kategorien zu Emojis
  const categoryEmojis = {
    '🍎 Obst': '🍎',
    '🥬 Gemüse': '🥬', 
    '🥛 Milch': '🥛',
    '🍞 Backwaren': '🍞',
    '🥤 Getränke': '🥤',
    '🍖 Fleisch': '🍖',
    '🧊 Tiefkühl': '🧊',
    '🏠 Haushalt': '🏠',
    // Fallback für alte Kategorien ohne Emoji
    'Obst': '🍎',
    'Gemüse': '🥬',
    'Milch': '🥛',
    'Backwaren': '🍞',
    'Getränke': '🥤',
    'Fleisch': '🍖',
    'Tiefkühl': '🧊',
    'Haushalt': '🏠'
  };

  // Verwende das benutzerdefinierte Icon, falls vorhanden, sonst das Kategorie-Emoji
  const displayIcon = icon || categoryEmojis[category] || categoryEmojis[defaultIcon] || '📦';

  return (
    <div className="w-8 h-8 flex items-center justify-center text-xl bg-gray-700 rounded-lg">
      {displayIcon}
    </div>
  );
}