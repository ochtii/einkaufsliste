// =============================================================================
// Demo Configuration for Frontend-Only Mode
// =============================================================================

// Check if we're running in demo mode (GitHub Pages)
const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                   (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));

// Demo configuration
window.DEMO_CONFIG = {
    isDemoMode: isDemoMode,
    lastUpdated: new Date().toISOString(),
    buildTimestamp: new Date().toISOString(),
    demoMessage: {
        de: 'Dies ist eine Demo-Version der Einkaufsliste App',
        en: 'This is a demo version of the Shopping List App'
    },
    
    // Demo backend URL (when available)
    backendUrl: isDemoMode ? 'https://einkaufsliste-demo-backend.onrender.com' : 'http://18.197.100.102:4000',
    
    // Feature flags for demo
    features: {
        registration: true,
        userManagement: isDemoMode ? false : true,
        adminPanel: isDemoMode ? false : true,
        realTimeSync: isDemoMode ? false : true,
        offlineMode: true  // Always enable offline mode for GitHub Pages demo
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
console.log('Demo config initialization:', {
  isDemoMode,
  hostname: window.location.hostname,
  offlineMode: window.DEMO_CONFIG.features.offlineMode,
  shouldInitDemoAPI: isDemoMode && window.DEMO_CONFIG.features.offlineMode,
  timestamp: new Date().toISOString()
});

// Always initialize DemoAPI when offlineMode is enabled, regardless of hostname
if (window.DEMO_CONFIG.features.offlineMode) {
  console.log('Initializing DemoAPI...');
  
  // Initialize immediately for reliability
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
        
        // Generate a valid mock JWT token structure
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ 
          sub: user.uuid, 
          username: user.username, 
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }));
        const signature = btoa('demo-signature'); // Mock signature
        const mockJwtToken = `${header}.${payload}.${signature}`;
        
        return { token: mockJwtToken, user };
      }
      throw new Error('Invalid credentials');
    },
    
    logout() {
      this.storage.currentUser = null;
      this.save();
    },
    
    // Validate JWT token
    validateToken(token) {
      if (!token) return null;
      
      try {
        // Split the token into parts
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // Decode the payload
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return null;
        }
        
        // Find user by UUID from token
        const user = this.storage.users.find(u => u.uuid === payload.sub);
        return user || null;
      } catch (error) {
        console.warn('Token validation failed:', error);
        return null;
      }
    },
    
    // Mock API endpoints
    async fetch(endpoint, options = {}) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : null;
      
      // Check authentication for protected endpoints (except login)
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        const authHeader = options.headers?.Authorization || options.headers?.authorization;
        const token = authHeader?.replace('Bearer ', '');
        const validUser = this.validateToken(token);
        
        if (!validUser) {
          return {
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized' })
          };
        }
        
        // Update current user from token validation
        this.storage.currentUser = validUser;
      }
      
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
          
        case endpoint.includes('/lists') && method === 'POST':
          const newList = {
            id: Date.now(),
            uuid: `list-${Date.now()}`,
            name: body.name,
            icon: body.icon || '🛒',
            user_id: this.storage.currentUser?.id,
            articles: []
          };
          this.storage.lists.push(newList);
          this.save();
          return { 
            ok: true, 
            json: () => Promise.resolve(newList)
          };
          
        case endpoint.includes('/lists/') && method === 'DELETE':
          const listId = parseInt(endpoint.split('/lists/')[1]);
          this.storage.lists = this.storage.lists.filter(l => l.id !== listId);
          this.save();
          return { ok: true, json: () => Promise.resolve({}) };
          
        case endpoint.includes('/articles') && method === 'GET':
          // Handle /lists/{id}/articles
          const listMatch = endpoint.match(/\/lists\/(\d+)\/articles/);
          if (listMatch) {
            const listId = parseInt(listMatch[1]);
            const list = this.storage.lists.find(l => l.id === listId);
            return { 
              ok: true, 
              json: () => Promise.resolve(list?.articles || [])
            };
          }
          return { ok: true, json: () => Promise.resolve([]) };
          
        case endpoint.includes('/articles') && method === 'POST':
          // Handle /lists/{id}/articles
          const postListMatch = endpoint.match(/\/lists\/(\d+)\/articles/);
          if (postListMatch) {
            const listId = parseInt(postListMatch[1]);
            const list = this.storage.lists.find(l => l.id === listId);
            if (list) {
              const newArticle = {
                id: Date.now(),
                ...body,
                is_bought: false
              };
              list.articles.push(newArticle);
              this.save();
              return { 
                ok: true, 
                json: () => Promise.resolve(newArticle)
              };
            }
          }
          return { ok: false };
          
        case endpoint.includes('/articles/') && method === 'PUT':
          // Handle /lists/{listId}/articles/{articleId}
          const putMatch = endpoint.match(/\/lists\/(\d+)\/articles\/(\d+)/);
          if (putMatch) {
            const [, listId, articleId] = putMatch;
            const list = this.storage.lists.find(l => l.id === parseInt(listId));
            if (list) {
              const articleIndex = list.articles.findIndex(a => a.id === parseInt(articleId));
              if (articleIndex >= 0) {
                list.articles[articleIndex] = { ...list.articles[articleIndex], ...body };
                this.save();
                return { ok: true };
              }
            }
          }
          return { ok: false };
          
        case endpoint.includes('/articles/') && method === 'DELETE':
          // Handle /lists/{listId}/articles/{articleId}
          const deleteMatch = endpoint.match(/\/lists\/(\d+)\/articles\/(\d+)/);
          if (deleteMatch) {
            const [, listId, articleId] = deleteMatch;
            const list = this.storage.lists.find(l => l.id === parseInt(listId));
            if (list) {
              list.articles = list.articles.filter(a => a.id !== parseInt(articleId));
              this.save();
              return { ok: true };
            }
          }
          return { ok: false };
          
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
          
        case endpoint.includes('/favorites') && method === 'GET':
          return { 
            ok: true, 
            json: () => Promise.resolve(this.storage.favorites)
          };
          
        case endpoint.includes('/favorites') && method === 'POST':
          const newFavorite = { ...body, id: Date.now() };
          this.storage.favorites.push(newFavorite);
          this.save();
          return { ok: true, json: () => Promise.resolve(newFavorite) };
          
        case endpoint.includes('/favorites/') && method === 'DELETE':
          const favId = parseInt(endpoint.split('/favorites/')[1]);
          this.storage.favorites = this.storage.favorites.filter(f => f.id !== favId);
          this.save();
          return { ok: true };
          
        case endpoint.includes('/broadcasts'):
          return { ok: true, json: () => Promise.resolve([]) };
          
        case endpoint.includes('/user/profile'):
          return { 
            ok: true, 
            json: () => Promise.resolve(this.storage.currentUser || {})
          };
          
        case endpoint.includes('/articles/history'):
          return { ok: true, json: () => Promise.resolve([]) };
          
        default:
          console.warn('Unhandled DemoAPI endpoint:', endpoint, method);
          return { 
            ok: true, 
            json: () => Promise.resolve([])
          };
      }
    }
  };
  console.log('✅ DemoAPI successfully initialized!', window.DemoAPI);
} else {
  console.log('❌ DemoAPI not initialized:', { isDemoMode, offlineMode: window.DEMO_CONFIG?.features?.offlineMode });
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.DEMO_CONFIG;
}
