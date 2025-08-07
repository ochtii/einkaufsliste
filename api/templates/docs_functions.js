// Documentation Functions
function loadDocumentation() {
    fetch('/api/docs/data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Documentation error:', data.error);
                document.getElementById('docs-categories').innerHTML = 
                    `<div class="error">❌ ${data.error}</div>`;
                return;
            }
            
            // Store globally for category/endpoint navigation
            globalDocumentationData = data;
            
            displayDocumentationStats(data);
            displayDocumentationCategories(data.categories);
        })
        .catch(error => {
            console.error('Failed to load documentation:', error);
            document.getElementById('docs-categories').innerHTML = 
                '<div class="error">❌ Failed to load documentation</div>';
        });
}

function displayDocumentationStats(data) {
    const categories = data.categories || {};
    let totalEndpoints = 0;
    
    Object.values(categories).forEach(category => {
        totalEndpoints += category.endpoints ? category.endpoints.length : 0;
    });
    
    document.getElementById('docs-endpoints-count').textContent = totalEndpoints;
    document.getElementById('docs-categories-count').textContent = Object.keys(categories).length;
    document.getElementById('docs-last-updated').textContent = new Date().toLocaleDateString();
}

function displayDocumentationCategories(categories) {
    const container = document.getElementById('docs-categories');
    let html = '';
    
    if (!categories || Object.keys(categories).length === 0) {
        html = '<div class="no-data">No documentation categories found</div>';
    } else {
        html = '<div class="categories-grid">';
        
        for (const [categoryName, categoryInfo] of Object.entries(categories)) {
            const endpointsCount = categoryInfo.endpoints ? categoryInfo.endpoints.length : 0;
            const icon = getCategoryIcon(categoryName);
            
            html += `
                <div class="category-card" onclick="showCategoryEndpoints('${categoryName}')">
                    <div class="category-header">
                        <span class="category-icon">${icon}</span>
                        <h4>${categoryName}</h4>
                    </div>
                    <div class="category-description">${categoryInfo.description || 'No description available'}</div>
                    <div class="category-stats">
                        <span class="endpoint-count">${endpointsCount} endpoints</span>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Hide endpoint details section when showing categories
    document.getElementById('endpoint-details-section').style.display = 'none';
}

function getCategoryIcon(category) {
    const icons = {
        'Auth': '🔐',
        'Users': '👥',
        'Articles': '📦',
        'Lists': '📝',
        'Categories': '🏷️',
        'Favorites': '⭐',
        'Admin': '⚙️',
        'Database': '💾',
        'Monitoring': '📊'
    };
    return icons[category] || '📄';
}

function showCategoryDetails(categoryName) {
    // Create a modal or expand section to show detailed endpoint information
    alert(`Category: ${categoryName}\n\nThis would show detailed endpoint information. For full documentation, use the public documentation page.`);
}

// Global variable to store documentation data
let globalDocumentationData = null;

function showCategoryEndpoints(categoryName) {
    if (!globalDocumentationData || !globalDocumentationData.categories[categoryName]) {
        console.error('Category data not found:', categoryName);
        return;
    }
    
    const categoryInfo = globalDocumentationData.categories[categoryName];
    const container = document.getElementById('docs-categories');
    const detailsSection = document.getElementById('endpoint-details-section');
    const detailsContent = document.getElementById('endpoint-details-content');
    
    // Show endpoints list for the category
    let html = `
        <button class="category-back-btn" onclick="loadDocumentation()">
            ← Back to Categories
        </button>
        <h3>${getCategoryIcon(categoryName)} ${categoryName} Endpoints</h3>
        <p>${categoryInfo.description}</p>
        <div class="endpoints-grid">
    `;
    
    categoryInfo.endpoints.forEach((endpoint, index) => {
        const endpointId = `${categoryName.toLowerCase()}-${index}`;
        html += `
            <div class="endpoint-card" onclick="showEndpointDetails('${categoryName}', ${index})">
                <div class="endpoint-card-header">
                    <span class="endpoint-method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                    <span class="endpoint-path-text">${endpoint.path}</span>
                </div>
                <div class="endpoint-card-name">${endpoint.name}</div>
                <div class="endpoint-card-description">${endpoint.description}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Clear and hide details section
    detailsContent.innerHTML = '';
    detailsSection.style.display = 'none';
}

function showEndpointDetails(categoryName, endpointIndex) {
    if (!globalDocumentationData || !globalDocumentationData.categories[categoryName]) {
        console.error('Category data not found:', categoryName);
        return;
    }
    
    const endpoint = globalDocumentationData.categories[categoryName].endpoints[endpointIndex];
    if (!endpoint) {
        console.error('Endpoint not found:', categoryName, endpointIndex);
        return;
    }
    
    const detailsSection = document.getElementById('endpoint-details-section');
    const detailsContent = document.getElementById('endpoint-details-content');
    
    // Update selected endpoint card
    document.querySelectorAll('.endpoint-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.endpoint-card').classList.add('selected');
    
    // Render endpoint details
    let html = renderEndpointDetails(endpoint, categoryName, endpointIndex);
    
    detailsContent.innerHTML = html;
    detailsSection.style.display = 'block';
    
    // Scroll to details section
    detailsSection.scrollIntoView({ behavior: 'smooth' });
}

function renderEndpointDetails(endpoint, category, index) {
    const endpointId = `${category.toLowerCase()}-${index}`;
    
    let html = `
        <div class="endpoint-detail-card">
            <div class="endpoint-detail-header" onclick="toggleEndpointDetail('${endpointId}')">
                <div class="endpoint-info">
                    <div class="endpoint-detail-title">
                        <span class="endpoint-method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                        <span class="endpoint-path-text">${endpoint.path}</span>
                        <span class="toggle-icon" id="icon-${endpointId}">▼</span>
                    </div>
                    <div class="endpoint-detail-name">${endpoint.name}</div>
                    <div class="endpoint-detail-description">${endpoint.description}</div>
                    <span class="endpoint-auth-badge">${endpoint.authentication}</span>
                </div>
            </div>
            <div class="endpoint-detail-body active" id="details-${endpointId}">
                ${renderEndpointDetailSections(endpoint)}
            </div>
        </div>
    `;
    
    return html;
}

function renderEndpointDetailSections(endpoint) {
    let html = '';

    // Parameters
    if (endpoint.parameters && Object.keys(endpoint.parameters).length > 0) {
        html += `
            <div class="detail-section">
                <h4>📋 Parameters</h4>
                <table class="parameters-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const [paramName, paramInfo] of Object.entries(endpoint.parameters)) {
            html += `
                <tr>
                    <td><code>${paramName}</code></td>
                    <td>${paramInfo.type}</td>
                    <td>
                        ${paramInfo.required ? 
                            '<span class="required-badge">Required</span>' : 
                            '<span class="optional-badge">Optional</span>'
                        }
                    </td>
                    <td>${paramInfo.description}</td>
                </tr>
            `;
        }
        
        html += '</tbody></table></div>';
    }

    // Request Body
    if (endpoint.request_body) {
        html += `
            <div class="detail-section">
                <h4>📤 Request Body</h4>
                <p><strong>Content-Type:</strong> ${endpoint.request_body.content_type}</p>
                <p><strong>Required:</strong> ${endpoint.request_body.required ? 'Yes' : 'No'}</p>
        `;
        
        if (endpoint.request_body.schema) {
            html += '<h5>Schema:</h5>';
            html += '<table class="parameters-table"><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>';
            
            for (const [fieldName, fieldInfo] of Object.entries(endpoint.request_body.schema)) {
                html += `
                    <tr>
                        <td><code>${fieldName}</code></td>
                        <td>${fieldInfo.type}</td>
                        <td>
                            ${fieldInfo.required ? 
                                '<span class="required-badge">Required</span>' : 
                                '<span class="optional-badge">Optional</span>'
                            }
                        </td>
                        <td>${fieldInfo.description || ''}</td>
                    </tr>
                `;
            }
            
            html += '</tbody></table>';
        }
        
        if (endpoint.request_body.example) {
            html += '<h5>Example:</h5>';
            html += `<div class="code-block">${JSON.stringify(endpoint.request_body.example, null, 2)}</div>`;
        }
        
        html += '</div>';
    }

    // Response
    if (endpoint.response) {
        html += '<div class="detail-section"><h4>📥 Response</h4>';
        
        for (const [statusCode, responseInfo] of Object.entries(endpoint.response)) {
            const isError = parseInt(statusCode) >= 400;
            html += `
                <div style="margin-bottom: 20px;">
                    <h5>
                        <span class="response-code ${isError ? 'error' : ''}">${statusCode}</span>
                        ${responseInfo.description}
                    </h5>
                    ${responseInfo.example ? 
                        `<div class="code-block">${JSON.stringify(responseInfo.example, null, 2)}</div>` : 
                        ''
                    }
                </div>
            `;
        }
        
        html += '</div>';
    }

    return html;
}

function toggleEndpointDetail(endpointId) {
    const details = document.getElementById(`details-${endpointId}`);
    const icon = document.getElementById(`icon-${endpointId}`);
    const header = icon.closest('.endpoint-detail-header');
    
    if (details.classList.contains('active')) {
        details.classList.remove('active');
        icon.classList.remove('active');
        header.classList.remove('active');
    } else {
        details.classList.add('active');
        icon.classList.add('active');
        header.classList.add('active');
    }
}

function openPublicDocs() {
    window.open('/documentation', '_blank');
}

function refreshDocumentation() {
    document.getElementById('docs-categories').innerHTML = 'Loading documentation...';
    document.getElementById('endpoint-details-section').style.display = 'none';
    loadDocumentation();
}
