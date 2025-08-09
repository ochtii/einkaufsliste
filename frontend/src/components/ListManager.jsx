import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';

const LIST_ICONS = ['🛒', '🍎', '🏠', '⚡', '🎮', '📚', '🧽', '🔧'];

export default function ListManager({ onSelectList, currentList }) {
  const [lists, setLists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('🛒');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLists() {
    try {
      const data = await api.fetchLists(token);
      setLists(data);
      
      // Select first list if none selected
      if (!currentList && data.length > 0) {
        onSelectList(data[0]);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createList() {
    if (!newListName.trim()) return;

    try {
      const newList = await api.createList(newListName, newListIcon, token);
      setLists(prev => [newList, ...prev]);
      setNewListName('');
      setNewListIcon('🛒');
      setShowCreateForm(false);
      onSelectList(newList);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  }

  async function deleteList(listUuid) {
    if (!window.confirm('Liste wirklich löschen? Alle Artikel gehen verloren.')) return;

    try {
      await api.deleteList(listUuid, token);
      setLists(prev => prev.filter(list => list.uuid !== listUuid));
      
      // Select another list if current was deleted
      if (currentList?.uuid === listUuid) {
        const remainingLists = lists.filter(list => list.uuid !== listUuid);
        onSelectList(remainingLists[0] || null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">📋 Meine Listen</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary text-sm px-3 py-1"
        >
          {showCreateForm ? '✕' : '+ Liste'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="space-y-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Listenname"
              className="input-field w-full"
              onKeyPress={(e) => e.key === 'Enter' && createList()}
            />
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Icon:</span>
              <div className="flex space-x-1 flex-wrap">
                {LIST_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewListIcon(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors border ${
                      newListIcon === icon 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={createList}
              disabled={!newListName.trim()}
              className="btn-primary w-full disabled:opacity-50"
            >
              Liste erstellen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {lists.map(list => (
          <div
            key={list.uuid}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              currentList?.uuid === list.uuid
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-100'
            }`}
            onClick={() => onSelectList(list)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{list.icon}</span>
              <span className="font-medium">{list.name}</span>
            </div>
            
            {lists.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList(list.uuid);
                }}
                className="text-red-400 hover:text-red-300 p-1 rounded"
                title="Liste löschen"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
        
        {lists.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>Noch keine Listen vorhanden</p>
            <p className="text-sm">Erstelle deine erste Einkaufsliste!</p>
          </div>
        )}
      </div>
    </div>
  );
}
