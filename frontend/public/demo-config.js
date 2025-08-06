// =============================================================================
// Demo Configuration for Frontend-Only Mode
// =============================================================================

// Check if we're running in demo mode (GitHub Pages)
const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                   (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

// Demo configuration
window.DEMO_CONFIG = {
  isDemoMode: isDemoMode,
  demoMessage: {
    de: 'Dies ist eine Demo-Version der Einkaufsliste App',
    en: 'This is a demo version of the Shopping List App'
  },
  
  // Demo backend URL (when available)
  backendUrl: isDemoMode ? 'https://einkaufsliste-demo-backend.onrender.com' : 'http://localhost:4000',
  
  // Feature flags for demo
  features: {
    registration: true,
    userManagement: isDemoMode ? false : true,
    adminPanel: isDemoMode ? false : true,
    realTimeSync: isDemoMode ? false : true,
    offlineMode: isDemoMode ? true : false
  },
  
  // Demo credentials
  demoCredentials: {
    user: { username: 'demo', password: 'demo123' },
    admin: { username: 'admin', password: 'admin123' }
  },
  
  // Demo data for offline mode
  demoData: {
    users: [
      {
        id: 1,
        uuid: 'demo-user-uuid',
        username: 'demo',
        email: 'demo@example.com',
        role: 'user'
      },
      {
        id: 2,
        uuid: 'admin-user-uuid', 
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    ],
    
    categories: [
      { id: 1, name: 'Obst & Gemüse', icon: '🍎', is_global: true },
      { id: 2, name: 'Milchprodukte', icon: '🥛', is_global: true },
      { id: 3, name: 'Fleisch & Fisch', icon: '🥩', is_global: true },
      { id: 4, name: 'Brot & Backwaren', icon: '🍞', is_global: true },
      { id: 5, name: 'Getränke', icon: '🥤', is_global: true },
      { id: 6, name: 'Süßwaren', icon: '🍫', is_global: true },
      { id: 7, name: 'Haushalt', icon: '🧽', is_global: true },
      { id: 8, name: 'Sonstiges', icon: '📦', is_global: true }
    ],
    
    standardArticles: [
      { id: 1, name: 'Äpfel', category: 'Obst & Gemüse', icon: '🍎', is_global: true },
      { id: 2, name: 'Bananen', category: 'Obst & Gemüse', icon: '🍌', is_global: true },
      { id: 3, name: 'Milch', category: 'Milchprodukte', icon: '🥛', is_global: true },
      { id: 4, name: 'Käse', category: 'Milchprodukte', icon: '🧀', is_global: true },
      { id: 5, name: 'Brot', category: 'Brot & Backwaren', icon: '🍞', is_global: true },
      { id: 6, name: 'Butter', category: 'Milchprodukte', icon: '🧈', is_global: true },
      { id: 7, name: 'Wasser', category: 'Getränke', icon: '💧', is_global: true },
      { id: 8, name: 'Kaffee', category: 'Getränke', icon: '☕', is_global: true },
      { id: 9, name: 'Tomaten', category: 'Obst & Gemüse', icon: '🍅', is_global: true },
      { id: 10, name: 'Nudeln', category: 'Sonstiges', icon: '🍝', is_global: true }
    ],
    
    sampleLists: [
      {
        id: 1,
        uuid: 'sample-list-1',
        name: 'Wocheneinkauf',
        user_id: 1,
        articles: [
          { id: 1, name: 'Milch', category: 'Milchprodukte', icon: '🥛', is_bought: false },
          { id: 2, name: 'Brot', category: 'Brot & Backwaren', icon: '🍞', is_bought: true },
          { id: 3, name: 'Äpfel', category: 'Obst & Gemüse', icon: '🍎', is_bought: false },
          { id: 4, name: 'Käse', category: 'Milchprodukte', icon: '🧀', is_bought: false }
        ]
      },
      {
        id: 2,
        uuid: 'sample-list-2',
        name: 'Party-Einkauf',
        user_id: 1,
        articles: [
          { id: 5, name: 'Chips', category: 'Süßwaren', icon: '🍿', is_bought: false },
          { id: 6, name: 'Cola', category: 'Getränke', icon: '🥤', is_bought: false },
          { id: 7, name: 'Pizza', category: 'Sonstiges', icon: '🍕', is_bought: true }
        ]
      }
    ],
    
    favorites: [
      { name: 'Milch', category: 'Milchprodukte' },
      { name: 'Brot', category: 'Brot & Backwaren' },
      { name: 'Äpfel', category: 'Obst & Gemüse' }
    ]
  }
};

// Demo API Mock for offline mode
if (isDemoMode && window.DEMO_CONFIG.features.offlineMode) {
  window.DemoAPI = {
    // Mock local storage for demo data
    storage: {
      users: JSON.parse(localStorage.getItem('demo_users') || JSON.stringify(window.DEMO_CONFIG.demoData.users)),
      lists: JSON.parse(localStorage.getItem('demo_lists') || JSON.stringify(window.DEMO_CONFIG.demoData.sampleLists)),
      categories: JSON.parse(localStorage.getItem('demo_categories') || JSON.stringify(window.DEMO_CONFIG.demoData.categories)),
      standardArticles: JSON.parse(localStorage.getItem('demo_standard_articles') || JSON.stringify(window.DEMO_CONFIG.demoData.standardArticles)),
      favorites: JSON.parse(localStorage.getItem('demo_favorites') || JSON.stringify(window.DEMO_CONFIG.demoData.favorites)),
      currentUser: JSON.parse(localStorage.getItem('demo_current_user') || 'null')
    },
    
    // Save to localStorage
    save() {
      localStorage.setItem('demo_users', JSON.stringify(this.storage.users));
      localStorage.setItem('demo_lists', JSON.stringify(this.storage.lists));
      localStorage.setItem('demo_categories', JSON.stringify(this.storage.categories));
      localStorage.setItem('demo_standard_articles', JSON.stringify(this.storage.standardArticles));
      localStorage.setItem('demo_favorites', JSON.stringify(this.storage.favorites));
      localStorage.setItem('demo_current_user', JSON.stringify(this.storage.currentUser));
    },
    
    // Mock authentication
    login(username, password) {
      const user = this.storage.users.find(u => u.username === username);
      if (user && (password === 'demo123' || password === 'admin123')) {
        this.storage.currentUser = user;
        this.save();
        return { token: 'demo-jwt-token', user };
      }
      throw new Error('Invalid credentials');
    },
    
    logout() {
      this.storage.currentUser = null;
      this.save();
    },
    
    // Mock API endpoints
    async fetch(endpoint, options = {}) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : null;
      
      // Handle different endpoints
      switch (true) {
        case endpoint.includes('/auth/login'):
          return { 
            ok: true, 
            json: () => Promise.resolve(this.login(body.username, body.password))
          };
          
        case endpoint.includes('/lists') && method === 'GET':
          const userLists = this.storage.lists.filter(l => l.user_id === this.storage.currentUser?.id);
          return { 
            ok: true, 
            json: () => Promise.resolve(userLists)
          };
          
        case endpoint.includes('/categories') && method === 'GET':
          return { 
            ok: true, 
            json: () => Promise.resolve(this.storage.categories)
          };
          
        case endpoint.includes('/standard-articles') && method === 'GET':
          return { 
            ok: true, 
            json: () => Promise.resolve(this.storage.standardArticles)
          };
          
        default:
          return { 
            ok: true, 
            json: () => Promise.resolve([])
          };
      }
    }
  };
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.DEMO_CONFIG;
}
