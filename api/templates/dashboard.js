// Tab switching
function showTab(tabName) {
    // Hide all tab panes
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => pane.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab pane
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadStats();
            loadRecentLogs();
            break;
        case 'api-keys':
            loadApiKeys();
            break;
        case 'endpoints':
            loadEndpoints();
            break;
        case 'users':
            loadUsers();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'database':
            loadDatabaseInfo();
            break;
        case 'docs':
            loadDocumentation();
            break;
        case 'labor':
            loadLaborTab();
            break;
    }
}

// Load statistics
function loadStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('api-keys-count').textContent = data.api_keys || 0;
            document.getElementById('api-requests-count').textContent = data.api_requests || '0/0';
            document.getElementById('endpoints-count').textContent = data.endpoints || '0/0';
            document.getElementById('db-size').textContent = data.db_size || 'Unknown';
            document.getElementById('db-modified').textContent = data.db_modified || 'Unknown';
        })
        .catch(err => console.log('Stats loading failed:', err));
}

// Load recent logs for overview
function loadRecentLogs() {
    document.getElementById('recent-logs').innerHTML = '<p>No recent activity</p>';
}

// API Keys functions
function loadApiKeys() {
    fetch('/api/api-keys')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('api-keys-list');
            if (data.success && data.keys && data.keys.length > 0) {
                let html = `
                    <div class="table-container">
                    <table class="table">
                        <tr>
                            <th>Name</th>
                            <th>Key Preview</th>
                            <th>Permissions</th>
                            <th>Usage Count</th>
                            <th>Rate Limit</th>
                            <th>IP Restrictions</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Details</th>
                        </tr>`;                data.keys.forEach(key => {
                    const permissions = Array.isArray(key.endpoint_permissions) ? 
                        `${key.endpoint_permissions.length} endpoints` : 'None';
                    const status = key.is_active ? '<span style="color: #4CAF50;">Active</span>' : '<span style="color: #f44336;">Inactive</span>';
                    const rateLimit = key.rate_limit === 0 ? 'Unlimited' : `${key.rate_limit}/min`;
                    const ipRestrictions = Array.isArray(key.ip_restrictions) && key.ip_restrictions.length > 0 
                        ? key.ip_restrictions.slice(0, 2).join(', ') + (key.ip_restrictions.length > 2 ? '...' : '')
                        : 'None';
                    const usageCount = key.usage_count || 0;
                    
                    const toggleText = key.is_active ? 'Deactivate' : 'Activate';
                    const toggleClass = key.is_active ? 'btn-warning' : 'btn-success';
                    
                    html += `<tr>
                        <td><strong>${key.name}</strong></td>
                        <td><code>${key.key_preview}</code></td>
                        <td><small title="${Array.isArray(key.endpoint_permissions) ? key.endpoint_permissions.join(', ') : 'None'}">${permissions}</small></td>
                        <td><strong style="color: #4CAF50;" title="Admin sessions bypass API key validation">${usageCount}</strong></td>
                        <td><small>${rateLimit}</small></td>
                        <td><small title="${Array.isArray(key.ip_restrictions) ? key.ip_restrictions.join(', ') : 'None'}">${ipRestrictions}</small></td>
                        <td><small>${new Date(key.created_at).toLocaleDateString()}</small></td>
                        <td>${status}</td>
                        <td style="white-space: nowrap;">
                            <button class="btn" style="padding: 6px 12px; font-size: 12px; background: #2196F3;" 
                                    onclick="showApiKeyDetails(${key.id})">📊 Details</button>
                        </td>
                    </tr>`;
                });
                html += '</table></div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p>No API keys found</p>';
            }
        })
        .catch(err => {
            console.log('API keys loading failed:', err);
            document.getElementById('api-keys-list').innerHTML = '<p>Error loading API keys</p>';
        });
}

function showCreateApiKey() {
    document.getElementById('create-api-key').style.display = 'block';
    document.querySelector('button[onclick="showCreateApiKey()"]').style.display = 'none';
    loadAvailableEndpoints();
}

function loadAvailableEndpoints() {
    fetch('/api/endpoints/available')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.endpoints) {
                renderEndpointsGrid(data.endpoints);
            } else {
                document.getElementById('endpoints-loading').textContent = 'Failed to load endpoints';
            }
        })
        .catch(err => {
            document.getElementById('endpoints-loading').textContent = 'Error loading endpoints';
        });
}

function renderEndpointsGrid(endpoints) {
    const container = document.getElementById('endpoints-grid');
    const loading = document.getElementById('endpoints-loading');
    
    // Group endpoints by category
    const categories = {};
    endpoints.forEach(endpoint => {
        if (!categories[endpoint.category]) {
            categories[endpoint.category] = [];
        }
        categories[endpoint.category].push(endpoint);
    });
    
    let html = `
        <div class="endpoints-actions">
            <div>
                <button type="button" class="btn" style="padding: 6px 12px; font-size: 12px;" onclick="selectAllEndpoints()">Select All</button>
                <button type="button" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="selectNoEndpoints()">Select None</button>
            </div>
        </div>
    `;
    
    Object.keys(categories).forEach(category => {
        html += `<div class="endpoint-category">
            <h4>${category}</h4>`;
        
        categories[category].forEach(endpoint => {
            const methodClass = `method-${endpoint.method.toLowerCase()}`;
            html += `
                <div class="endpoint-item">
                    <input type="checkbox" id="endpoint-${endpoint.id}" value="${endpoint.id}">
                    <span class="endpoint-method ${methodClass}">${endpoint.method}</span>
                    <div class="endpoint-info">
                        <div class="endpoint-name">${endpoint.name}</div>
                        <div class="endpoint-description">${endpoint.description}</div>
                        <div class="endpoint-path">${endpoint.path}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    loading.style.display = 'none';
    container.style.display = 'block';
}

function selectAllEndpoints() {
    const checkboxes = document.querySelectorAll('#endpoints-grid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function selectNoEndpoints() {
    const checkboxes = document.querySelectorAll('#endpoints-grid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function showApiKeySuccess(apiKey) {
    const successDiv = document.getElementById('api-key-success');
    const keyInput = document.getElementById('generated-api-key');
    const confirmBtn = document.getElementById('confirm-api-key-btn');
    const confirmText = document.getElementById('confirm-btn-text');
    
    // Set the API key
    keyInput.value = apiKey;
    
    // Show the success message
    successDiv.style.display = 'block';
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Start 5-second countdown
    let countdown = 5;
    confirmBtn.disabled = true;
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'countdown-progress';
    progressBar.style.width = '100%';
    confirmBtn.style.position = 'relative';
    confirmBtn.appendChild(progressBar);
    
    const countdownInterval = setInterval(() => {
        countdown--;
        confirmText.textContent = `I've saved the key securely (${countdown})`;
        progressBar.style.width = `${(countdown / 5) * 100}%`;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            confirmBtn.disabled = false;
            confirmText.textContent = "I've saved the key securely ✓";
            progressBar.remove();
            confirmBtn.style.background = '#4CAF50';
        }
    }, 1000);
}

function copyApiKey() {
    const keyInput = document.getElementById('generated-api-key');
    keyInput.select();
    document.execCommand('copy');
    
    // Visual feedback
    const copyBtn = event.target;
    const originalText = copyBtn.textContent;
    const originalClass = copyBtn.className;
    
    copyBtn.textContent = '✓ Copied!';
    copyBtn.className = originalClass + ' copy-success';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.className = originalClass;
    }, 2000);
}

function confirmApiKeyReceived() {
    const successDiv = document.getElementById('api-key-success');
    
    // Fade out animation
    successDiv.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    successDiv.style.opacity = '0';
    successDiv.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translateY(0)';
        successDiv.style.transition = '';
        
        // Clear the API key from memory
        document.getElementById('generated-api-key').value = '';
    }, 300);
}

function hideCreateApiKey() {
    document.getElementById('create-api-key').style.display = 'none';
    document.querySelector('button[onclick="showCreateApiKey()"]').style.display = 'inline-block';
    clearCreateApiKeyForm();
}

function createApiKey() {
    const name = document.getElementById('key-name').value;
    const expiration = document.getElementById('key-expiration').value;
    const rateLimit = document.getElementById('rate-limit').value;
    const ipRestrictions = document.getElementById('ip-restrictions').value;
    const description = document.getElementById('key-description').value;
    
    if (!name) {
        alert('Please enter a name for the API key');
        return;
    }
    
    // Collect endpoint permissions from checkboxes
    const endpointPermissions = [];
    const checkboxes = document.querySelectorAll('#endpoints-grid input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        endpointPermissions.push(cb.value);
    });
    
    if (endpointPermissions.length === 0) {
        alert('Please select at least one endpoint permission');
        return;
    }
    
    // Calculate expiration days
    let expireDays = 0;
    if (expiration !== 'never') {
        expireDays = parseInt(expiration);
    }
    
    // Prepare IP restrictions array
    const ipList = ipRestrictions ? 
        ipRestrictions.split(',').map(ip => ip.trim()).filter(ip => ip) : 
        [];
    
    const apiKeyData = {
        name: name,
        endpoint_permissions: endpointPermissions,
        expires_days: expireDays,
        rate_limit: rateLimit === 'unlimited' ? 0 : parseInt(rateLimit),
        ip_restrictions: ipList,
        description: description
    };
    
    fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeyData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close form and show success message instead of alert
            hideCreateApiKey();
            clearCreateApiKeyForm();
            showApiKeySuccess(data.api_key);
            loadApiKeys();
        } else {
            alert('Failed to create API key: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        alert('Failed to create API key: ' + err.message);
    });
}

function clearCreateApiKeyForm() {
    document.getElementById('key-name').value = '';
    document.getElementById('key-expiration').value = 'never';
    document.getElementById('rate-limit').value = '60';
    document.getElementById('ip-restrictions').value = '';
    document.getElementById('key-description').value = '';
    
    // Reset endpoint permissions checkboxes
    const checkboxes = document.querySelectorAll('#endpoints-grid input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Reset endpoints grid
    document.getElementById('endpoints-grid').style.display = 'none';
    document.getElementById('endpoints-loading').style.display = 'block';
    document.getElementById('endpoints-loading').textContent = 'Loading endpoints...';
}

function toggleApiKey(keyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    fetch(`/api/api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadApiKeys();
            alert(`API key ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        } else {
            alert('Failed to update API key status: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        alert('Failed to update API key status: ' + err.message);
    });
}

function showApiKeyDetails(keyId) {
    console.log('Loading details for API key:', keyId);
    
    // Show loading state
    const detailsHtml = `
        <div class="section" style="margin-top: 20px;">
            <h3>API Key Usage Details</h3>
            <div style="text-align: center; padding: 40px;">
                <div style="color: #666;">Loading usage details...</div>
            </div>
        </div>
    `;
    
    const existingDetails = document.querySelector('.api-key-details');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'api-key-details';
    detailsDiv.innerHTML = detailsHtml;
    
    // Find the correct container - the api-keys tab pane
    const apiKeysTab = document.getElementById('api-keys');
    if (apiKeysTab) {
        apiKeysTab.appendChild(detailsDiv);
    } else {
        console.error('Could not find api-keys container');
        alert('Could not display API key details - container not found');
        return;
    }
    
    // Scroll to details
    detailsDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Fetch usage details
    fetch(`/api/api-keys/${keyId}/usage`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderApiKeyDetails(keyId, data);
            } else {
                alert('Failed to load usage details: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading usage details:', error);
            alert('Failed to load usage details');
        });
}

function getSuccessRateColor(successRateStr) {
    const rate = parseFloat(successRateStr || '0');
    if (rate >= 90) return '#4CAF50';
    if (rate >= 70) return '#FF9800';
    return '#f44336';
}

function renderApiKeyDetails(keyId, data) {
    const stats = data.stats || {};
    const logs = data.logs || [];
    const keyInfo = data.key_info || {};
    
    const toggleText = keyInfo.is_active ? 'Deactivate' : 'Activate';
    const toggleClass = keyInfo.is_active ? 'btn-warning' : 'btn-success';
    
    const detailsHtml = `
        <div class="section" style="margin-top: 20px; background: #2d2d2d; border-radius: 10px; padding: 20px; border: 1px solid #444;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #4CAF50; margin: 0;">API Key Details: ${keyInfo.name || 'Unknown'}</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn ${toggleClass}" style="padding: 8px 16px; font-size: 13px;" 
                            onclick="toggleApiKeyFromDetails(${keyId}, '${keyInfo.is_active ? 'active' : 'inactive'}')">${toggleText}</button>
                    <button class="btn btn-danger" style="padding: 8px 16px; font-size: 13px;" 
                            onclick="deleteApiKeyFromDetails(${keyId})">🗑️ Delete</button>
                    <button class="btn" style="background: #666; padding: 8px 16px; font-size: 13px;" 
                            onclick="closeApiKeyDetails()">✕ Close</button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="card" style="padding: 15px; background: #1a1a1a; border: 1px solid #444; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2196F3;">Total Requests</h4>
                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${stats.total_requests || 0}</div>
                </div>
                <div class="card" style="padding: 15px; background: #1a1a1a; border: 1px solid #444; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2196F3;">Last Used</h4>
                    <div style="font-size: 14px; color: #ccc;">${stats.last_used ? new Date(stats.last_used).toLocaleString() : 'Never'}</div>
                </div>
                <div class="card" style="padding: 15px; background: #1a1a1a; border: 1px solid #444; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2196F3;">Success Rate</h4>
                    <div style="font-size: 16px; font-weight: bold; color: ${getSuccessRateColor(stats.success_rate)};">${stats.success_rate || '0%'}</div>
                </div>
                <div class="card" style="padding: 15px; background: #1a1a1a; border: 1px solid #444; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2196F3;">Avg Response Time</h4>
                    <div style="font-size: 14px; color: #ccc;">${stats.avg_response_time || '0ms'}</div>
                </div>
            </div>
            
            <div style="background: #1a1a1a; border: 1px solid #444; border-radius: 8px; padding: 15px;">
                <h4 style="color: #4CAF50; margin-top: 0;">Recent Usage (Last 50 requests)</h4>
                ${logs.length > 0 ? renderUsageLogs(logs) : '<div style="text-align: center; padding: 20px; color: #888;">No usage data available</div>'}
            </div>
        </div>
    `;
    
    const existingDetails = document.querySelector('.api-key-details');
    if (existingDetails) {
        existingDetails.innerHTML = detailsHtml;
    }
}

function renderUsageLogs(logs) {
    let html = `
        <div class="table-container">
        <table class="table" style="font-size: 12px; background: #2d2d2d;">
            <tr style="background: #333;">
                <th style="color: #ccc;">Timestamp</th>
                <th style="color: #ccc;">Method</th>
                <th style="color: #ccc;">Endpoint</th>
                <th style="color: #ccc;">IP Address</th>
                <th style="color: #ccc;">Status</th>
                <th style="color: #ccc;">Response Time</th>
                <th style="color: #ccc;">Payload Size</th>
            </tr>`;
    
    logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const method = log.method || 'GET';
        const path = log.path || '/';
        const ip = log.ip_address || 'Unknown';
        const status = log.response_status || 200;
        const responseTime = log.response_time_ms ? `${log.response_time_ms}ms` : '-';
        const payloadSize = log.payload_size ? `${log.payload_size}B` : '-';
        
        const statusColor = status >= 200 && status < 300 ? '#4CAF50' : 
                           status >= 400 ? '#f44336' : '#FF9800';
        
        const methodColor = {
            'GET': '#2196F3',
            'POST': '#4CAF50', 
            'PATCH': '#9C27B0',
            'DELETE': '#f44336',
            'PUT': '#FF9800'
        }[method] || '#666';
        
        html += `<tr style="border-bottom: 1px solid #444;">
            <td style="color: #ccc;"><small>${timestamp}</small></td>
            <td><code style="background: ${methodColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${method}</code></td>
            <td><code style="font-size: 11px; color: #ccc; background: #1a1a1a; padding: 2px 4px; border-radius: 3px;">${path}</code></td>
            <td style="color: #ccc;"><small>${ip}</small></td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${status}</span></td>
            <td style="color: #ccc;"><small>${responseTime}</small></td>
            <td style="color: #ccc;"><small>${payloadSize}</small></td>
        </tr>`;
    });
    
    html += '</table></div>';
    return html;
}

function closeApiKeyDetails() {
    const existingDetails = document.querySelector('.api-key-details');
    if (existingDetails) {
        existingDetails.remove();
    }
}

function toggleApiKeyFromDetails(keyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    fetch(`/api/api-keys/${keyId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload the details to show updated status
            showApiKeyDetails(keyId);
            // Also reload the main list
            loadApiKeys();
            alert(`API key ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        } else {
            alert('Failed to update API key status: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        alert('Failed to update API key status: ' + err.message);
    });
}

function deleteApiKeyFromDetails(keyId) {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
        fetch(`/api/api-keys/${keyId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close the details panel
                closeApiKeyDetails();
                // Reload the main list
                loadApiKeys();
                alert('API key deleted successfully');
            } else {
                alert('Failed to delete API key: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            alert('Failed to delete API key: ' + err.message);
        });
    }
}

function deleteApiKey(keyId) {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
        fetch(`/api/api-keys/${keyId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadApiKeys();
                alert('API key deleted successfully');
            } else {
                alert('Failed to delete API key: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            alert('Failed to delete API key: ' + err.message);
        });
    }
}

// Endpoints functions
function loadEndpoints() {
    // Load all available endpoints from the API
    fetch('/api/endpoints/available')
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.endpoints) {
                throw new Error('Failed to load endpoints from API');
            }
            
            // Load configured endpoints status
            fetch('/api/endpoints/status')
                .then(statusResponse => statusResponse.json())
                .then(configData => {
                    const endpoints = data.endpoints;
                    
                    let html = '<table class="table"><tr><th>Method</th><th>Path</th><th>Name</th><th>Category</th><th>Description</th><th>Status</th><th>Actions</th></tr>';
                    
                    // Group endpoints by category - include ALL categories
                    const categories = ['Auth', 'Users', 'Articles', 'Lists', 'Categories', 'Favorites', 'Admin', 'Database', 'Monitoring'];
                    categories.forEach(category => {
                        const categoryEndpoints = endpoints.filter(ep => ep.category === category);
                        if (categoryEndpoints.length > 0) {
                            categoryEndpoints.forEach((endpoint, index) => {
                                const configKey = `${endpoint.method}:${endpoint.path}`;
                                const config = configData.success && configData.configurations[configKey] ? configData.configurations[configKey] : null;
                                
                                const status = config ? (config.enabled ? 'Configured & Enabled' : 'Configured & Disabled') : 'Available';
                                const statusColor = config ? (config.enabled ? '#4CAF50' : '#ff9800') : '#2196F3';
                                
                                html += `<tr>
                                    <td><span class="method-badge method-${endpoint.method}">${endpoint.method}</span></td>
                                    <td><code>${endpoint.path}</code></td>
                                    <td><strong>${endpoint.name}</strong></td>
                                    <td><span class="category-badge" style="background: ${getCategoryColor(endpoint.category)};">${endpoint.category}</span></td>
                                    <td><small>${endpoint.description}</small></td>
                                    <td><span style="color: ${statusColor};">✅ ${status}</span></td>
                                    <td>
                                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="configureEndpoint('${endpoint.method}', '${endpoint.path}', ${config ? JSON.stringify(config).replace(/"/g, '&quot;') : 'null'})">Configure</button>
                                        <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-left: 3px;" onclick="testEndpoint('${endpoint.method}', '${endpoint.path}')">Test</button>
                                    </td>
                                </tr>`;
                            });
                        }
                    });
                    html += '</table>';
                    
                    // Add summary info
                    const summary = `<div style="margin-bottom: 15px; padding: 15px; background: #2d2d2d; border-radius: 8px; border: 1px solid #4CAF50;">
                        <h3 style="color: #4CAF50; margin: 0 0 10px 0;">📊 Endpoints Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div><strong style="color: #2196F3;">Total Endpoints:</strong> <span style="color: #4CAF50; font-size: 18px; font-weight: bold;">${endpoints.length}</span></div>
                            <div><strong style="color: #2196F3;">Categories:</strong> <span style="color: #4CAF50; font-weight: bold;">${categories.filter(cat => endpoints.some(ep => ep.category === cat)).length}</span></div>
                        </div>
                    </div>`;
                    
                    document.getElementById('endpoints-list').innerHTML = summary + html;
                })
                .catch(configErr => {
                    console.log('Endpoint status loading failed, showing endpoints without status:', configErr);
                    // Show endpoints without status information
                    const endpoints = data.endpoints;
                    
                    let html = '<table class="table"><tr><th>Method</th><th>Path</th><th>Name</th><th>Category</th><th>Description</th><th>Actions</th></tr>';
                    endpoints.forEach((endpoint) => {
                        html += `<tr>
                            <td><span class="method-badge method-${endpoint.method}">${endpoint.method}</span></td>
                            <td><code>${endpoint.path}</code></td>
                            <td><strong>${endpoint.name}</strong></td>
                            <td><span class="category-badge" style="background: ${getCategoryColor(endpoint.category)};">${endpoint.category}</span></td>
                            <td><small>${endpoint.description}</small></td>
                            <td>
                                <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="configureEndpoint('${endpoint.method}', '${endpoint.path}', null)">Configure</button>
                                <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-left: 3px;" onclick="testEndpoint('${endpoint.method}', '${endpoint.path}')">Test</button>
                            </td>
                        </tr>`;
                    });
                    html += '</table>';
                    
                    const summary = `<div style="margin-bottom: 15px; padding: 15px; background: #2d2d2d; border-radius: 8px; border: 1px solid #4CAF50;">
                        <h3 style="color: #4CAF50; margin: 0 0 10px 0;">📊 Endpoints Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div><strong style="color: #2196F3;">Total Endpoints:</strong> <span style="color: #4CAF50; font-size: 18px; font-weight: bold;">${endpoints.length}</span></div>
                            <div><strong style="color: #2196F3;">Available:</strong> <span style="color: #4CAF50; font-weight: bold;">${endpoints.length}</span></div>
                        </div>
                    </div>`;
                    
                    document.getElementById('endpoints-list').innerHTML = summary + html;
                });
        })
        .catch(err => {
            console.log('Endpoints loading failed completely, using fallback:', err);
            // Ultimate fallback to static endpoints if API fails
            const endpoints = [
                { method: 'GET', path: '/api/users', name: 'List Users', category: 'Users', description: 'List all users' },
                { method: 'POST', path: '/api/users', name: 'Create User', category: 'Users', description: 'Create new user' },
                { method: 'GET', path: '/api/articles', name: 'List Articles', category: 'Articles', description: 'List all articles' },
                { method: 'GET', path: '/api/lists', name: 'List Shopping Lists', category: 'Lists', description: 'List shopping lists' },
                { method: 'GET', path: '/api/categories', name: 'List Categories', category: 'Categories', description: 'List categories' },
                { method: 'GET', path: '/api/stats', name: 'Database Statistics', category: 'Admin', description: 'Get database statistics' }
            ];
            
            let html = '<div style="color: #f44336; margin-bottom: 10px;">⚠️ Could not load endpoints from API. Showing limited fallback list.</div>';
            html += '<table class="table"><tr><th>Method</th><th>Path</th><th>Name</th><th>Category</th><th>Description</th><th>Actions</th></tr>';
            endpoints.forEach((endpoint) => {
                html += `<tr>
                    <td><span class="method-badge method-${endpoint.method}">${endpoint.method}</span></td>
                    <td><code>${endpoint.path}</code></td>
                    <td><strong>${endpoint.name}</strong></td>
                    <td><span class="category-badge" style="background: ${getCategoryColor(endpoint.category)};">${endpoint.category}</span></td>
                    <td><small>${endpoint.description}</small></td>
                    <td>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="testEndpoint('${endpoint.method}', '${endpoint.path}')">Test</button>
                    </td>
                </tr>`;
            });
            html += '</table>';
            
            document.getElementById('endpoints-list').innerHTML = html;
        });
}

// Helper function to get colors for categories
function getCategoryColor(category) {
    const colors = {
        'Auth': '#FF5722',
        'Users': '#2196F3',
        'Articles': '#4CAF50', 
        'Lists': '#FF9800',
        'Categories': '#9C27B0',
        'Favorites': '#E91E63',
        'Admin': '#F44336',
        'Database': '#607D8B',
        'Monitoring': '#00BCD4'
    };
    return colors[category] || '#666';
}

function configureEndpoint(method, path, existingConfig) {
    // Parse existing config if provided
    let config = null;
    if (existingConfig && typeof existingConfig === 'string') {
        try {
            config = JSON.parse(existingConfig.replace(/&quot;/g, '"'));
        } catch (e) {
            console.log('Failed to parse existing config:', e);
        }
    } else if (existingConfig && typeof existingConfig === 'object') {
        config = existingConfig;
    }
    
    // Show configuration modal with existing values
    const configHtml = `
        <div id="endpoint-config-modal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: #2d2d2d; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px;">
                <h3 style="color: #4CAF50; margin-top: 0;">Configure Endpoint</h3>
                <p><strong>Method:</strong> ${method}</p>
                <p><strong>Path:</strong> ${path}</p>
                ${config ? `<p style="color: #4CAF50;">✓ Previously configured at ${new Date(config.configured_at).toLocaleString()}</p>` : ''}
                
                <div class="form-group">
                    <label>Rate Limiting (requests/minute):</label>
                    <input type="number" id="rate-limit" value="${config ? config.rate_limit : 60}" min="1" max="1000">
                </div>
                
                <div class="form-group">
                    <label>Require Authentication:</label>
                    <select id="auth-required">
                        <option value="false" ${config && !config.auth_required ? 'selected' : ''}>No</option>
                        <option value="true" ${config && config.auth_required ? 'selected' : ''}>Yes</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Cache TTL (seconds):</label>
                    <input type="number" id="cache-ttl" value="${config ? config.cache_ttl : 300}" min="0">
                </div>
                
                <div class="form-group">
                    <label>Enabled:</label>
                    <select id="endpoint-enabled">
                        <option value="true" ${!config || config.enabled ? 'selected' : ''}>Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="saveEndpointConfig('${method}', '${path}')">Save Configuration</button>
                    <button class="btn btn-danger" onclick="closeEndpointConfig()" style="margin-left: 10px;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', configHtml);
}

function saveEndpointConfig(method, path) {
    const config = {
        method: method,
        path: path,
        rateLimit: document.getElementById('rate-limit').value,
        authRequired: document.getElementById('auth-required').value === 'true',
        cacheTtl: document.getElementById('cache-ttl').value,
        enabled: document.getElementById('endpoint-enabled').value === 'true'
    };
    
    // Send config to server
    fetch('/api/endpoints/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        alert(`Endpoint ${method} ${path} configured successfully`);
        closeEndpointConfig();
        loadEndpoints();
    })
    .catch(err => {
        alert('Failed to configure endpoint: ' + err.message);
    });
}

function testEndpoint(method, path) {
    fetch(path, { method: method })
        .then(response => {
            const statusText = response.ok ? 'Success' : 'Error';
            const statusColor = response.ok ? '#4CAF50' : '#f44336';
            alert(`Test ${method} ${path}: ${statusText} (${response.status})`);
        })
        .catch(err => {
            alert(`Test ${method} ${path} failed: ${err.message}`);
        });
}

function closeEndpointConfig() {
    const modal = document.getElementById('endpoint-config-modal');
    if (modal) modal.remove();
}

// Users functions
function loadUsers() {
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            let html = '<table class="table"><tr><th>ID</th><th>Username</th><th>Email</th><th>Created</th><th>Actions</th></tr>';
            if (data.users && data.users.length > 0) {
                data.users.forEach(user => {
                    html += `<tr>
                        <td>${user.id || '-'}</td>
                        <td>${user.username || user.name || '-'}</td>
                        <td>${user.email || '-'}</td>
                        <td>${user.created_at || user.created || '-'}</td>
                        <td>
                            <button class="btn" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                        </td>
                    </tr>`;
                });
            } else {
                html += '<tr><td colspan="5">No users found</td></tr>';
            }
            html += '</table>';
            document.getElementById('users-list').innerHTML = html;
        })
        .catch(err => {
            console.log('Users loading failed:', err);
            document.getElementById('users-list').innerHTML = '<p>Error loading users</p>';
        });
}

// Logs functions
function loadLogs() {
    fetch('/api/logs')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('logs-list');
            if (data.logs && data.logs.length > 0) {
                let html = '';
                data.logs.forEach(log => {
                    html += `<div class="log-entry">
                        <div class="log-timestamp">${log.timestamp}</div>
                        <div>${log.message}</div>
                    </div>`;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p>No logs available</p>';
            }
        })
        .catch(err => {
            console.log('Logs loading failed:', err);
            document.getElementById('logs-list').innerHTML = '<p>Error loading logs</p>';
        });
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        fetch('/api/logs', { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert('Logs cleared successfully');
                loadLogs();
            })
            .catch(err => {
                alert('Failed to clear logs: ' + err.message);
            });
    }
}

// Database functions
function loadDatabaseInfo() {
    fetch('/api/database/info')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('database-info');
            let html = `
                <h3 class="section-title">Database Overview</h3>
                <p><strong>Path:</strong> ${data.path}</p>
                <p><strong>Size:</strong> ${data.size}</p>
                <p><strong>Tables:</strong> ${data.tables ? data.tables.length : 0}</p>
                
                <div style="margin: 20px 0;">
                    <button class="btn" onclick="runDatabaseTest('integrity')">Test Integrity</button>
                    <button class="btn" onclick="runDatabaseTest('foreign_keys')">Check Foreign Keys</button>
                    <button class="btn" onclick="analyzeDatabase()">Analyze Database</button>
                    <button class="btn btn-danger" onclick="backupDatabase()">Backup Database</button>
                </div>
            `;
            
            if (data.tables && data.tables.length > 0) {
                html += '<h3 class="section-title">Tables</h3><table class="table"><tr><th>Table</th><th>Rows</th><th>Actions</th></tr>';
                data.tables.forEach(table => {
                    html += `<tr>
                        <td>${table.name}</td>
                        <td>${table.rows}</td>
                        <td>
                            <button class="btn" style="padding: 6px 12px; font-size: 12px;" onclick="showTableDetails('${table.name}')">Details</button>
                        </td>
                    </tr>`;
                });
                html += '</table>';
            }
            
            container.innerHTML = html;
        })
        .catch(err => {
            console.log('Database info loading failed:', err);
            document.getElementById('database-info').innerHTML = '<p>Error loading database information</p>';
        });
}

function runDatabaseTest(testType) {
    fetch(`/api/database/test/${testType}`)
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'db-test-results';
            resultDiv.innerHTML = `
                <h4>Test Results: ${testType}</h4>
                <p class="${data.success ? 'test-success' : 'test-error'}">
                    ${data.success ? '✅' : '❌'} ${data.message}
                </p>
                ${data.details ? `<pre>${data.details}</pre>` : ''}
            `;
            document.getElementById('database-info').appendChild(resultDiv);
        })
        .catch(err => {
            alert('Test failed: ' + err.message);
        });
}

function showTableDetails(tableName) {
    fetch(`/api/database/table/${tableName}`)
        .then(response => response.json())
        .then(data => {
            alert(`Table: ${tableName}\nColumns: ${data.columns ? data.columns.join(', ') : 'Unknown'}\nRows: ${data.row_count || 'Unknown'}`);
        })
        .catch(err => {
            alert('Failed to get table details: ' + err.message);
        });
}

function analyzeDatabase() {
    fetch('/api/database/analyze')
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'db-test-results';
            resultDiv.innerHTML = `
                <h4>Database Analysis</h4>
                <p>Total Size: ${data.total_size || 'Unknown'}</p>
                <p>Total Records: ${data.total_records || 'Unknown'}</p>
                <p>Analysis completed at: ${new Date().toLocaleString()}</p>
            `;
            document.getElementById('database-info').appendChild(resultDiv);
        })
        .catch(err => {
            alert('Analysis failed: ' + err.message);
        });
}

function backupDatabase() {
    if (confirm('Create a backup of the database?')) {
        fetch('/api/database/backup', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                alert('Backup created successfully: ' + data.backup_file);
            })
            .catch(err => {
                alert('Backup failed: ' + err.message);
            });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data for overview tab
    loadStats();
});

// ===============================
// LABOR TAB FUNCTIONS
// ===============================

let laborIntervals = {};

function loadLaborTab() {
    console.log('Loading Labor tab...');
    
    // Load API keys for selection
    refreshApiKeys();
    
    // Load available endpoints
    loadEndpointsForTesting();
    
    // Start monitoring intervals
    startMonitoring();
}

// API Testing Functions
function refreshApiKeys() {
    fetch('/api/api-keys')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('selected-api-key');
            select.innerHTML = '<option value="">No API Key Selected</option>';
            
            if (data.success && data.keys) {
                data.keys.forEach(key => {
                    if (key.is_active) {
                        const option = document.createElement('option');
                        option.value = key.id;
                        option.textContent = `${key.name} (${key.key_preview})`;
                        select.appendChild(option);
                    }
                });
            }
        })
        .catch(err => console.error('Failed to load API keys:', err));
}

function loadSelectedKeyStats() {
    const keyId = document.getElementById('selected-api-key').value;
    const statsDiv = document.getElementById('selected-key-stats');
    
    if (!keyId) {
        statsDiv.innerHTML = '<p>Select an API key to see statistics</p>';
        return;
    }
    
    fetch(`/api/api-keys/${keyId}/usage`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statsDiv.innerHTML = `
                    <div class="key-stats-grid">
                        <div class="stat-item">
                            <strong>Total Requests:</strong> ${data.stats.total_requests}
                        </div>
                        <div class="stat-item">
                            <strong>Success Rate:</strong> ${data.stats.success_rate}
                        </div>
                        <div class="stat-item">
                            <strong>Avg Response:</strong> ${data.stats.avg_response_time}
                        </div>
                        <div class="stat-item">
                            <strong>Last Used:</strong> ${data.stats.last_used ? new Date(data.stats.last_used).toLocaleString() : 'Never'}
                        </div>
                    </div>
                `;
            } else {
                statsDiv.innerHTML = '<p style="color: #f44336;">Failed to load key statistics</p>';
            }
        })
        .catch(err => {
            console.error('Failed to load key stats:', err);
            statsDiv.innerHTML = '<p style="color: #f44336;">Error loading statistics</p>';
        });
}

function loadEndpointsForTesting() {
    fetch('/api/endpoints/available')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('endpoint-checkboxes');
            container.innerHTML = '';
            
            if (data.success && data.endpoints) {
                data.endpoints.forEach(endpoint => {
                    const div = document.createElement('div');
                    div.className = 'checkbox-item';
                    div.innerHTML = `
                        <label>
                            <input type="checkbox" value="${endpoint.method}:${endpoint.path}" data-method="${endpoint.method}" data-path="${endpoint.path}">
                            <span class="method-tag ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                            ${endpoint.path}
                            <small>${endpoint.description || ''}</small>
                        </label>
                    `;
                    container.appendChild(div);
                });
            }
        })
        .catch(err => console.error('Failed to load endpoints:', err));
}

function runApiTests() {
    const keyId = document.getElementById('selected-api-key').value;
    const testType = document.querySelector('input[name="test-type"]:checked').value;
    const selectedEndpoints = Array.from(document.querySelectorAll('#endpoint-checkboxes input:checked'));
    
    if (!keyId) {
        alert('Please select an API key first');
        return;
    }
    
    if (selectedEndpoints.length === 0) {
        alert('Please select at least one endpoint to test');
        return;
    }
    
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<div class="test-running">🧪 Running tests...</div>';
    
    // Get the API key details for the actual key value
    fetch(`/api/api-keys`)
        .then(response => response.json())
        .then(data => {
            const selectedKey = data.keys.find(k => k.id == keyId);
            if (!selectedKey) {
                throw new Error('Selected API key not found');
            }
            
            // Run tests sequentially
            runTestSequence(selectedEndpoints, testType, selectedKey.key_preview);
        })
        .catch(err => {
            resultsDiv.innerHTML = `<div class="test-error">❌ Error: ${err.message}</div>`;
        });
}

async function runTestSequence(endpoints, testType, apiKey) {
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<div class="test-results-container"></div>';
    const container = resultsDiv.querySelector('.test-results-container');
    
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const method = endpoint.dataset.method;
        const path = endpoint.dataset.path;
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'test-result-item';
        resultDiv.innerHTML = `
            <div class="test-header">
                <span class="method-tag ${method.toLowerCase()}">${method}</span>
                <span class="path">${path}</span>
                <span class="status">Testing...</span>
            </div>
            <div class="test-details">Running ${testType} test...</div>
        `;
        container.appendChild(resultDiv);
        
        try {
            const result = await runSingleTest(method, path, testType, apiKey);
            updateTestResult(resultDiv, result);
        } catch (error) {
            updateTestResult(resultDiv, {
                success: false,
                error: error.message,
                statusCode: 0,
                responseTime: 0
            });
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function runSingleTest(method, path, testType, apiKey) {
    const startTime = performance.now();
    
    const options = {
        method: method,
        headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
        }
    };
    
    // Add test data for POST/PATCH requests
    if (method === 'POST' || method === 'PATCH') {
        options.body = JSON.stringify(getTestData(path));
    }
    
    try {
        const response = await fetch(path, options);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let responseData;
        try {
            responseData = await response.json();
        } catch {
            responseData = await response.text();
        }
        
        return {
            success: response.ok,
            statusCode: response.status,
            responseTime: Math.round(responseTime),
            responseData: responseData,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        const endTime = performance.now();
        return {
            success: false,
            error: error.message,
            statusCode: 0,
            responseTime: Math.round(endTime - startTime)
        };
    }
}

function getTestData(path) {
    // Return appropriate test data based on endpoint
    if (path.includes('/users')) {
        return { username: 'testuser', email: 'test@example.com' };
    }
    if (path.includes('/lists')) {
        return { name: 'Test List', description: 'Test description' };
    }
    if (path.includes('/articles')) {
        return { name: 'Test Article', category_id: 1 };
    }
    if (path.includes('/categories')) {
        return { name: 'Test Category', emoji: '🧪' };
    }
    return {};
}

function updateTestResult(resultDiv, result) {
    const statusClass = result.success ? 'success' : 'error';
    const statusIcon = result.success ? '✅' : '❌';
    
    resultDiv.querySelector('.status').innerHTML = `${statusIcon} ${result.statusCode}`;
    resultDiv.querySelector('.status').className = `status ${statusClass}`;
    
    const detailsHtml = `
        <div class="test-response">
            <div class="response-meta">
                <span>Status: ${result.statusCode}</span>
                <span>Time: ${result.responseTime}ms</span>
                ${result.error ? `<span class="error">Error: ${result.error}</span>` : ''}
            </div>
            ${result.responseData ? `
                <div class="response-body">
                    <strong>Response:</strong>
                    <pre><code>${JSON.stringify(result.responseData, null, 2)}</code></pre>
                </div>
            ` : ''}
        </div>
    `;
    
    resultDiv.querySelector('.test-details').innerHTML = detailsHtml;
}

// Monitoring Functions
function startMonitoring() {
    // Clear existing intervals
    Object.values(laborIntervals).forEach(interval => clearInterval(interval));
    laborIntervals = {};
    
    // Update ping tests every 30 seconds
    laborIntervals.ping = setInterval(updatePingTests, 30000);
    
    // Update statistics every 10 seconds
    laborIntervals.stats = setInterval(updateStatistics, 10000);
    
    // Update response times every 15 seconds
    laborIntervals.responseTime = setInterval(() => {
        calculateAPIResponseTime();
        calculateBackendResponseTime();
    }, 15000);
    
    // Initial loads
    updatePingTests();
    updateStatistics();
    checkFrontendStatus();
    calculateAPIResponseTime();
    calculateBackendResponseTime();
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function updatePingTests() {
    // Check backend status separately for each component
    const backendStatus = document.getElementById('backend-status');
    const apiBackendStatus = document.getElementById('api-backend-status');
    
    const isMainBackendOnline = backendStatus && backendStatus.innerHTML.includes('Running');
    const isApiBackendOnline = apiBackendStatus && apiBackendStatus.innerHTML.includes('Running');
    
    // Main Backend (Einkaufsliste) ping tests - only if main backend is actually running
    if (!isMainBackendOnline) {
        setPingDisplay('google-ping', 'Server nicht erreichbar');
        setPingDisplay('cloudflare-ping', 'Server nicht erreichbar');
        setPingDisplay('backend-frontend-ping', 'Server nicht erreichbar');
    } else {
        // Test pings using main backend server (would need its own endpoints)
        // For now, disable these since main backend is offline
        setPingDisplay('google-ping', 'Server offline');
        setPingDisplay('cloudflare-ping', 'Server offline');
        setPingDisplay('backend-frontend-ping', 'Server offline');
    }
    
    // API Backend ping tests - only if API backend is running
    if (!isApiBackendOnline) {
        setPingDisplay('api-google-ping', 'Server nicht erreichbar');
        setPingDisplay('api-cloudflare-ping', 'Server nicht erreichbar');
        setPingDisplay('api-avg-response-time', 'Server nicht erreichbar');
    } else {
        // Test Google ping for API backend
        try {
            const result = await fetch('/api/ping/google');
            if (result.ok) {
                const data = await result.json();
                setPingDisplay('api-google-ping', formatPingResult(data));
            } else {
                throw new Error('Request failed');
            }
        } catch (err) {
            setPingDisplay('api-google-ping', '<span class="error">Fehler</span>');
        }
        
        // Test Cloudflare ping for API backend
        try {
            const result = await fetch('/api/ping/cloudflare');
            if (result.ok) {
                const data = await result.json();
                setPingDisplay('api-cloudflare-ping', formatPingResult(data));
            } else {
                throw new Error('Request failed');
            }
        } catch (err) {
            setPingDisplay('api-cloudflare-ping', '<span class="error">Fehler</span>');
        }
        
        // Calculate and display average response time for API backend
        await calculateAPIResponseTime();
    }
}

async function calculateAPIResponseTime() {
    try {
        const startTime = performance.now();
        const response = await fetch('/api/stats');
        const endTime = performance.now();
        
        if (response.ok) {
            const responseTime = endTime - startTime;
            setPingDisplay('api-avg-response-time', `<span class="ping-time">${responseTime.toFixed(1)}ms</span><br><small>Last request</small>`);
        } else {
            setPingDisplay('api-avg-response-time', '<span class="error">Fehler</span>');
        }
    } catch (err) {
        setPingDisplay('api-avg-response-time', '<span class="error">Fehler</span>');
    }
}

async function calculateBackendResponseTime() {
    try {
        // Test with a simple HTTP request to the main backend (port 4000)
        const testUrl = 'http://18.197.100.102:4000/api/ping'; // or similar simple endpoint
        
        const startTime = performance.now();
        const response = await fetch(testUrl, { mode: 'no-cors' });
        const endTime = performance.now();
        
        const responseTime = endTime - startTime;
        setPingDisplay('backend-avg-response-time', `<span class="ping-time">${responseTime.toFixed(1)}ms</span><br><small>Last request</small>`);
    } catch (err) {
        // If we can't reach the backend directly, show unavailable
        setPingDisplay('backend-avg-response-time', '<span class="error">Backend nicht erreichbar</span>');
    }
}

function setPingDisplay(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

function formatPingResult(data) {
    if (data.success) {
        if (data.average_time) {
            return `<span class="ping-time">${data.average_time.toFixed(1)}ms</span><br><small>${data.results.length} pings</small>`;
        } else if (data.results && data.results.length > 0) {
            const avgPing = data.results.reduce((sum, r) => sum + r.time, 0) / data.results.length;
            return `<span class="ping-time">${avgPing.toFixed(1)}ms</span><br><small>${data.results.length} pings</small>`;
        } else {
            return '<span class="ping-time">OK</span>';
        }
    } else {
        return `<span class="error">${data.error || 'Fehler'}</span>`;
    }
}

function updateStatistics() {
    // Try to fetch backend statistics first to determine if API server is online
    fetch('/api/stats/detailed')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // API Server is online - update API backend statistics
                updateApiBackendStatus(true, data);
                
                // Check if main backend (port 4000) is reachable for its own stats
                checkMainBackendStatus();
            } else {
                throw new Error('API Server returned error');
            }
        })
        .catch(err => {
            console.error('Failed to load API backend stats:', err);
            // API Server is offline - update both to offline
            updateBackendStatus(false);
            updateApiBackendStatus(false);
        });
}

function checkMainBackendStatus() {
    // Try to reach the main backend on port 4000 with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    fetch('http://18.197.100.102:4000/api/uptime', {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
    })
        .then(response => {
            clearTimeout(timeoutId);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Main backend not reachable: ${response.status}`);
            }
        })
        .then(data => {
            // Main backend is online
            updateBackendStatus(true, data);
        })
        .catch(err => {
            clearTimeout(timeoutId);
            // Main backend is offline - this is expected, suppress console noise
            if (err.name !== 'AbortError' && !err.message.includes('Failed to fetch')) {
                console.warn('Main backend offline (expected):', err.message);
            }
            updateBackendStatus(false);
        });
}

function checkFrontendStatus() {
    // Check if backend is online first
    const backendStatus = document.getElementById('backend-status');
    const isBackendOnline = backendStatus && backendStatus.innerHTML.includes('Running');
    
    if (!isBackendOnline) {
        const statusDiv = document.getElementById('frontend-status');
        const uptimeDiv = document.getElementById('frontend-uptime');
        if (statusDiv) statusDiv.innerHTML = '<span class="status-dot red"></span><span>Server nicht erreichbar</span>';
        if (uptimeDiv) uptimeDiv.textContent = 'Server nicht erreichbar';
        return;
    }
    
    // Try to ping the frontend through backend
    fetch('/api/frontend/status')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const statusDiv = document.getElementById('frontend-status');
            const uptimeDiv = document.getElementById('frontend-uptime');
            
            if (data.success) {
                if (statusDiv) statusDiv.innerHTML = '<span class="status-dot green"></span><span>Running</span>';
                
                // For frontend, we could use sessionStorage start time
                const frontendStartTime = sessionStorage.getItem('frontendStartTime');
                if (frontendStartTime && uptimeDiv) {
                    const uptime = Date.now() - parseInt(frontendStartTime);
                    uptimeDiv.textContent = formatUptime(uptime);
                }
            } else {
                if (statusDiv) statusDiv.innerHTML = '<span class="status-dot red"></span><span>Offline</span>';
                if (uptimeDiv) uptimeDiv.textContent = 'Offline';
            }
        })
        .catch(err => {
            const statusDiv = document.getElementById('frontend-status');
            const uptimeDiv = document.getElementById('frontend-uptime');
            if (statusDiv) statusDiv.innerHTML = '<span class="status-dot red"></span><span>Nicht erreichbar</span>';
            if (uptimeDiv) uptimeDiv.textContent = 'Nicht erreichbar';
        });
}

function updateBackendStatus(isOnline, data = null) {
    const statusDiv = document.getElementById('backend-status');
    const uptimeDiv = document.getElementById('backend-uptime');
    const totalRequestsDiv = document.getElementById('total-requests');
    const totalErrorsDiv = document.getElementById('total-errors');
    const memoryUsageDiv = document.getElementById('memory-usage');
    
    if (statusDiv) {
        if (isOnline && data) {
            statusDiv.innerHTML = '<span class="status-dot green"></span><span>Running</span>';
            
            // Update uptime with real server uptime
            if (data.uptime_seconds && uptimeDiv) {
                uptimeDiv.textContent = formatUptime(data.uptime_seconds * 1000);
            }
            
            // Update statistics
            if (totalRequestsDiv) totalRequestsDiv.textContent = data.total_requests || 0;
            if (totalErrorsDiv) totalErrorsDiv.textContent = data.total_errors || 0;
            if (memoryUsageDiv) memoryUsageDiv.textContent = data.memory_usage || 'N/A';
        } else {
            statusDiv.innerHTML = '<span class="status-dot red"></span><span>Server nicht erreichbar</span>';
            
            // Set all stats to "Server nicht erreichbar"
            if (totalRequestsDiv) totalRequestsDiv.textContent = 'Server nicht erreichbar';
            if (totalErrorsDiv) totalErrorsDiv.textContent = 'Server nicht erreichbar';
            if (memoryUsageDiv) memoryUsageDiv.textContent = 'Server nicht erreichbar';
            if (uptimeDiv) uptimeDiv.textContent = 'Server nicht erreichbar';
        }
    }
}

function updateApiBackendStatus(isOnline, data = null) {
    const statusDiv = document.getElementById('api-backend-status');
    const uptimeDiv = document.getElementById('api-backend-uptime');
    const totalRequestsDiv = document.getElementById('api-total-requests');
    const totalErrorsDiv = document.getElementById('api-total-errors');
    const memoryUsageDiv = document.getElementById('api-memory-usage');
    
    if (statusDiv) {
        if (isOnline && data) {
            statusDiv.innerHTML = '<span class="status-dot green"></span><span>Running</span>';
            
            // Update uptime with real server uptime
            if (data.uptime_seconds && uptimeDiv) {
                uptimeDiv.textContent = formatUptime(data.uptime_seconds * 1000);
            }
            
            // Update statistics
            if (totalRequestsDiv) totalRequestsDiv.textContent = data.total_requests || 0;
            if (totalErrorsDiv) totalErrorsDiv.textContent = data.total_errors || 0;
            if (memoryUsageDiv) memoryUsageDiv.textContent = data.memory_usage || 'N/A';
        } else {
            statusDiv.innerHTML = '<span class="status-dot red"></span><span>Server nicht erreichbar</span>';
            
            // Set all stats to "Server nicht erreichbar"
            if (totalRequestsDiv) totalRequestsDiv.textContent = 'Server nicht erreichbar';
            if (totalErrorsDiv) totalErrorsDiv.textContent = 'Server nicht erreichbar';
            if (memoryUsageDiv) memoryUsageDiv.textContent = 'Server nicht erreichbar';
            if (uptimeDiv) uptimeDiv.textContent = 'Server nicht erreichbar';
        }
    }
}
