import React, { useState } from 'react';

const EmojiPicker = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const emojiCategories = {
    'Lebensmittel': [
      '🍎', '🍌', '🍊', '🍋', '🍇', '🍓', '🥝', '🍒', '🥭', '🍑',
      '🥕', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🌽', '🥔', '🍅',
      '🥛', '🧀', '🧈', '🥚', '🍞', '🥖', '🥨', '🥯', '🥞', '🧇',
      '🍖', '🍗', '🥩', '🥓', '🍔', '🌭', '🥪', '🌮', '🌯', '🥙',
      '🐟', '🍤', '🦀', '🦞', '🐙', '🍚', '🍝', '🍜', '🍲', '🥗',
      '🍰', '🎂', '🧁', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🥤'
    ],
    'Getränke': [
      '☕', '🍵', '🥤', '🧃', '🥛', '🍼', '🍺', '🍻', '🍷', '🥂',
      '🍸', '🍹', '🍾', '🧊', '💧'
    ],
    'Haushalt': [
      '🧽', '🧴', '🧻', '🪥', '🧼', '🛁', '🚿', '🧹', '🗑️', '📦',
      '🛒', '🛍️', '💡', '🔋', '🕯️', '🧺', '🧸'
    ],
    'Sonstiges': [
      '📋', '📝', '✏️', '🖊️', '📌', '📍', '🏷️', '🎯', '⭐', '❤️',
      '💚', '💙', '💜', '🧡', '💛', '🤍', '🖤', '🤎', '❗', '❓',
      '✅', '❌', '⚠️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫',
      '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '💎', '🌟'
    ]
  };

  const allEmojis = Object.values(emojiCategories).flat();
  
  // TODO: Implement emoji search filtering
  // const filteredEmojis = searchTerm 
  //   ? allEmojis.filter(emoji => {
  //       return emoji.includes(searchTerm.toLowerCase());
  //     })
  //   : allEmojis;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Symbol auswählen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            placeholder="Symbol suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-4">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{category}</h4>
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={`${category}-${index}`}
                    onClick={() => onSelect(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
