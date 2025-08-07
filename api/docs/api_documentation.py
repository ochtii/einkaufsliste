#!/usr/bin/env python3
"""
Complete API Documentation Generator
Generates comprehensive documentation for all API endpoints
"""

def get_complete_api_documentation():
    """Generate complete API documentation with examples"""
    
    return {
        "title": "Einkaufsliste API Documentation",
        "version": "3.0",
        "description": "Complete REST API for Shopping List Management System",
        "base_url": "http://54.93.86.38:5000",
        "authentication": {
            "type": "API Key",
            "header": "X-API-Key",
            "description": "Most endpoints require API key authentication. Admin endpoints can also use session authentication."
        },
        "categories": {
            "Auth": {
                "description": "Authentication and user registration endpoints",
                "endpoints": [
                    {
                        "id": "captcha_get",
                        "method": "GET",
                        "path": "/api/captcha",
                        "name": "Generate Captcha",
                        "description": "Generate a captcha image for user registration to prevent automated registration",
                        "authentication": "None",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Captcha generated successfully",
                                "example": {
                                    "success": True,
                                    "captcha_id": "abc123",
                                    "captcha_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
                                    "expires_in": 300
                                }
                            },
                            "500": {
                                "description": "Internal server error",
                                "example": {"error": "Failed to generate captcha"}
                            }
                        }
                    },
                    {
                        "id": "register_post",
                        "method": "POST",
                        "path": "/api/register",
                        "name": "User Registration",
                        "description": "Register a new user account with username, email, password and captcha verification",
                        "authentication": "None",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "username": {"type": "string", "required": True, "description": "Unique username (3-50 characters)"},
                                "email": {"type": "string", "required": True, "description": "Valid email address"},
                                "password": {"type": "string", "required": True, "description": "Password (minimum 8 characters)"},
                                "captcha_id": {"type": "string", "required": True, "description": "Captcha ID from /api/captcha"},
                                "captcha_solution": {"type": "string", "required": True, "description": "User's captcha solution"}
                            },
                            "example": {
                                "username": "john_doe",
                                "email": "john@example.com",
                                "password": "SecurePass123!",
                                "captcha_id": "abc123",
                                "captcha_solution": "ABCD"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "User registered successfully",
                                "example": {
                                    "success": True,
                                    "message": "User registered successfully",
                                    "user_uuid": "550e8400-e29b-41d4-a716-446655440000"
                                }
                            },
                            "400": {
                                "description": "Invalid input data",
                                "example": {"error": "Username already exists"}
                            },
                            "422": {
                                "description": "Validation error",
                                "example": {"error": "Invalid captcha solution"}
                            }
                        }
                    },
                    {
                        "id": "login_post",
                        "method": "POST",
                        "path": "/api/login",
                        "name": "User Login",
                        "description": "Authenticate user with username/email and password, returns JWT token for subsequent requests",
                        "authentication": "None",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "username": {"type": "string", "required": True, "description": "Username or email address"},
                                "password": {"type": "string", "required": True, "description": "User password"}
                            },
                            "example": {
                                "username": "john_doe",
                                "password": "SecurePass123!"
                            }
                        },
                        "response": {
                            "200": {
                                "description": "Login successful",
                                "example": {
                                    "success": True,
                                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                    "user": {
                                        "uuid": "550e8400-e29b-41d4-a716-446655440000",
                                        "username": "john_doe",
                                        "email": "john@example.com"
                                    },
                                    "expires_in": 3600
                                }
                            },
                            "401": {
                                "description": "Invalid credentials",
                                "example": {"error": "Invalid username or password"}
                            }
                        }
                    },
                    {
                        "id": "logout_post",
                        "method": "POST",
                        "path": "/api/logout",
                        "name": "User Logout",
                        "description": "Logout user and invalidate JWT token",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Logout successful",
                                "example": {
                                    "success": True,
                                    "message": "Logged out successfully"
                                }
                            },
                            "401": {
                                "description": "Not authenticated",
                                "example": {"error": "Authentication required"}
                            }
                        }
                    }
                ]
            },
            "Users": {
                "description": "User management and profile endpoints",
                "endpoints": [
                    {
                        "id": "users_get",
                        "method": "GET",
                        "path": "/api/users",
                        "name": "List Users",
                        "description": "Retrieve all registered users (admin only)",
                        "authentication": "Required (API Key or Admin Session)",
                        "parameters": {
                            "limit": {"type": "integer", "required": False, "description": "Maximum number of users to return (default: 50)"},
                            "offset": {"type": "integer", "required": False, "description": "Number of users to skip (default: 0)"}
                        },
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Users retrieved successfully",
                                "example": {
                                    "users": [
                                        {
                                            "uuid": "550e8400-e29b-41d4-a716-446655440000",
                                            "id": 1,
                                            "username": "john_doe",
                                            "email": "john@example.com",
                                            "created_at": "2025-01-01T10:00:00Z"
                                        }
                                    ]
                                }
                            },
                            "401": {
                                "description": "Unauthorized",
                                "example": {"error": "API key required"}
                            }
                        }
                    },
                    {
                        "id": "users_post",
                        "method": "POST",
                        "path": "/api/users",
                        "name": "Create User",
                        "description": "Create a new user account (admin only)",
                        "authentication": "Required (API Key or Admin Session)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "username": {"type": "string", "required": True},
                                "email": {"type": "string", "required": True},
                                "password": {"type": "string", "required": True}
                            },
                            "example": {
                                "username": "jane_doe",
                                "email": "jane@example.com",
                                "password": "SecurePass456!"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "User created successfully",
                                "example": {
                                    "success": True,
                                    "user_uuid": "550e8400-e29b-41d4-a716-446655440001"
                                }
                            }
                        }
                    },
                    {
                        "id": "user_profile_get",
                        "method": "GET",
                        "path": "/api/user/profile",
                        "name": "User Profile",
                        "description": "Get current authenticated user's profile information",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Profile retrieved successfully",
                                "example": {
                                    "user": {
                                        "uuid": "550e8400-e29b-41d4-a716-446655440000",
                                        "username": "john_doe",
                                        "email": "john@example.com",
                                        "created_at": "2025-01-01T10:00:00Z",
                                        "last_login": "2025-01-07T15:30:00Z"
                                    }
                                }
                            }
                        }
                    },
                    {
                        "id": "change_password_post",
                        "method": "POST",
                        "path": "/api/change-password",
                        "name": "Change Password",
                        "description": "Change the current user's password",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "current_password": {"type": "string", "required": True},
                                "new_password": {"type": "string", "required": True}
                            },
                            "example": {
                                "current_password": "OldPass123!",
                                "new_password": "NewSecurePass456!"
                            }
                        },
                        "response": {
                            "200": {
                                "description": "Password changed successfully",
                                "example": {
                                    "success": True,
                                    "message": "Password updated successfully"
                                }
                            }
                        }
                    },
                    {
                        "id": "change_username_post",
                        "method": "POST",
                        "path": "/api/change-username",
                        "name": "Change Username",
                        "description": "Change the current user's username",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "new_username": {"type": "string", "required": True}
                            },
                            "example": {
                                "new_username": "john_doe_new"
                            }
                        },
                        "response": {
                            "200": {
                                "description": "Username changed successfully",
                                "example": {
                                    "success": True,
                                    "message": "Username updated successfully"
                                }
                            }
                        }
                    }
                ]
            },
            "Articles": {
                "description": "Article and shopping item management",
                "endpoints": [
                    {
                        "id": "articles_get",
                        "method": "GET",
                        "path": "/api/articles",
                        "name": "List Articles",
                        "description": "Retrieve all articles with optional filtering",
                        "authentication": "Required (API Key)",
                        "parameters": {
                            "category_uuid": {"type": "string", "required": False, "description": "Filter by category UUID"},
                            "user_uuid": {"type": "string", "required": False, "description": "Filter by user UUID"},
                            "search": {"type": "string", "required": False, "description": "Search in article names"}
                        },
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Articles retrieved successfully",
                                "example": {
                                    "articles": [
                                        {
                                            "uuid": "article-uuid-1",
                                            "name": "Milk",
                                            "category_uuid": "category-uuid-1",
                                            "user_uuid": "user-uuid-1",
                                            "created_at": "2025-01-01T10:00:00Z"
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        "id": "articles_post",
                        "method": "POST",
                        "path": "/api/articles",
                        "name": "Create Article",
                        "description": "Create a new article/shopping item",
                        "authentication": "Required (API Key)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "name": {"type": "string", "required": True, "description": "Article name"},
                                "category_uuid": {"type": "string", "required": False, "description": "Category UUID"},
                                "user_uuid": {"type": "string", "required": False, "description": "User UUID"}
                            },
                            "example": {
                                "name": "Organic Apples",
                                "category_uuid": "category-uuid-fruits",
                                "user_uuid": "user-uuid-1"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "Article created successfully",
                                "example": {
                                    "success": True,
                                    "message": "Article created successfully",
                                    "article": {
                                        "uuid": "new-article-uuid",
                                        "name": "Organic Apples",
                                        "category_uuid": "category-uuid-fruits",
                                        "user_uuid": "user-uuid-1"
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "Lists": {
                "description": "Shopping list management endpoints",
                "endpoints": [
                    {
                        "id": "lists_get",
                        "method": "GET",
                        "path": "/api/lists",
                        "name": "List Shopping Lists",
                        "description": "Get all shopping lists for the authenticated user",
                        "authentication": "Required (API Key)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Lists retrieved successfully",
                                "example": {
                                    "lists": [
                                        {
                                            "uuid": "list-uuid-1",
                                            "name": "Weekly Groceries",
                                            "user_uuid": "user-uuid-1",
                                            "created_at": "2025-01-01T10:00:00Z"
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        "id": "lists_post",
                        "method": "POST",
                        "path": "/api/lists",
                        "name": "Create List",
                        "description": "Create a new shopping list",
                        "authentication": "Required (API Key)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "name": {"type": "string", "required": True, "description": "List name"},
                                "user_uuid": {"type": "string", "required": False, "description": "User UUID"}
                            },
                            "example": {
                                "name": "Weekend Shopping",
                                "user_uuid": "user-uuid-1"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "List created successfully",
                                "example": {
                                    "success": True,
                                    "message": "List created successfully",
                                    "list": {
                                        "uuid": "new-list-uuid",
                                        "name": "Weekend Shopping",
                                        "user_uuid": "user-uuid-1"
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "Categories": {
                "description": "Product category management",
                "endpoints": [
                    {
                        "id": "categories_get",
                        "method": "GET",
                        "path": "/api/categories",
                        "name": "List Categories",
                        "description": "Get all product categories",
                        "authentication": "Required (API Key)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Categories retrieved successfully",
                                "example": {
                                    "categories": [
                                        {
                                            "uuid": "category-uuid-1",
                                            "name": "Fruits",
                                            "icon": "🍎",
                                            "color": "#ff6b6b"
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            },
            "Favorites": {
                "description": "User favorite articles management",
                "endpoints": [
                    {
                        "id": "favorites_get",
                        "method": "GET",
                        "path": "/api/favorites",
                        "name": "List Favorites",
                        "description": "Get user's favorite articles",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Favorites retrieved successfully",
                                "example": {
                                    "favorites": [
                                        {
                                            "uuid": "favorite-uuid-1",
                                            "article_uuid": "article-uuid-1",
                                            "article_name": "Milk",
                                            "created_at": "2025-01-01T10:00:00Z"
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        "id": "favorites_post",
                        "method": "POST",
                        "path": "/api/favorites",
                        "name": "Add Favorite",
                        "description": "Add an article to user's favorites",
                        "authentication": "Required (JWT Token)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "article_uuid": {"type": "string", "required": True, "description": "UUID of article to favorite"}
                            },
                            "example": {
                                "article_uuid": "article-uuid-1"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "Article added to favorites",
                                "example": {
                                    "success": True,
                                    "message": "Article added to favorites"
                                }
                            }
                        }
                    }
                ]
            },
            "Admin": {
                "description": "Administrative endpoints for system management",
                "endpoints": [
                    {
                        "id": "stats_get",
                        "method": "GET",
                        "path": "/api/stats",
                        "name": "System Statistics",
                        "description": "Get comprehensive system statistics including API keys, requests, and endpoints",
                        "authentication": "Required (API Key or Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Statistics retrieved successfully",
                                "example": {
                                    "api_keys": 5,
                                    "api_requests": "15/150",
                                    "endpoints": "59/59",
                                    "db_size": "245.67 KB",
                                    "db_modified": "2025-01-07 15:30:00"
                                }
                            }
                        }
                    },
                    {
                        "id": "api_keys_get",
                        "method": "GET",
                        "path": "/api/api-keys",
                        "name": "List API Keys",
                        "description": "View all API keys with their permissions and usage statistics (admin only)",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "API keys retrieved successfully",
                                "example": {
                                    "success": True,
                                    "keys": [
                                        {
                                            "id": 1,
                                            "name": "Frontend App Key",
                                            "key_preview": "ak_1234...5678",
                                            "endpoint_permissions": ["users_get", "articles_get"],
                                            "usage_count": 42,
                                            "rate_limit": 60,
                                            "ip_restrictions": [],
                                            "created_at": "2025-01-01T10:00:00Z",
                                            "is_active": True
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        "id": "api_keys_post",
                        "method": "POST",
                        "path": "/api/api-keys",
                        "name": "Create API Key",
                        "description": "Generate a new API key with specified permissions and restrictions",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": {
                            "required": True,
                            "content_type": "application/json",
                            "schema": {
                                "name": {"type": "string", "required": True, "description": "Descriptive name for the API key"},
                                "endpoint_permissions": {"type": "array", "required": True, "description": "List of endpoint IDs this key can access"},
                                "expires_days": {"type": "integer", "required": False, "description": "Number of days until expiration (0 = never)"},
                                "rate_limit": {"type": "integer", "required": False, "description": "Requests per minute (0 = unlimited)"},
                                "ip_restrictions": {"type": "array", "required": False, "description": "List of allowed IP addresses"},
                                "description": {"type": "string", "required": False, "description": "Optional description"}
                            },
                            "example": {
                                "name": "Mobile App Key",
                                "endpoint_permissions": ["users_get", "articles_get", "lists_get"],
                                "expires_days": 365,
                                "rate_limit": 100,
                                "ip_restrictions": ["192.168.1.0/24"],
                                "description": "API key for mobile application"
                            }
                        },
                        "response": {
                            "201": {
                                "description": "API key created successfully",
                                "example": {
                                    "success": True,
                                    "api_key": "ak_1234567890abcdef1234567890abcdef12345678",
                                    "message": "API key created successfully",
                                    "key_id": 2
                                }
                            }
                        }
                    }
                ]
            },
            "Database": {
                "description": "Database management and analysis endpoints",
                "endpoints": [
                    {
                        "id": "database_info_get",
                        "method": "GET",
                        "path": "/api/database/info",
                        "name": "Database Information",
                        "description": "Get database structure, table information, and statistics",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Database info retrieved successfully",
                                "example": {
                                    "path": "../backend/db.sqlite",
                                    "size": "245.67 KB",
                                    "tables": [
                                        {
                                            "name": "users",
                                            "rows": 15
                                        },
                                        {
                                            "name": "articles",
                                            "rows": 142
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        "id": "database_test_get",
                        "method": "GET",
                        "path": "/api/database/test/{type}",
                        "name": "Database Tests",
                        "description": "Run database connectivity and integrity tests",
                        "authentication": "Required (Admin Session)",
                        "parameters": {
                            "type": {"type": "string", "required": True, "description": "Test type: 'integrity' or 'foreign_keys'"}
                        },
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Test completed successfully",
                                "example": {
                                    "success": True,
                                    "message": "Database integrity check passed",
                                    "details": "All tables and indexes are valid"
                                }
                            }
                        }
                    }
                ]
            },
            "Monitoring": {
                "description": "System monitoring and health check endpoints",
                "endpoints": [
                    {
                        "id": "stats_detailed_get",
                        "method": "GET",
                        "path": "/api/stats/detailed",
                        "name": "Detailed System Statistics",
                        "description": "Get comprehensive system statistics for monitoring dashboards",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Detailed stats retrieved successfully",
                                "example": {
                                    "success": True,
                                    "uptime_seconds": 3600,
                                    "total_requests": 1500,
                                    "total_errors": 5,
                                    "memory_usage": "45.2 MB",
                                    "ping_google": "15ms",
                                    "ping_cloudflare": "12ms"
                                }
                            }
                        }
                    },
                    {
                        "id": "ping_google_get",
                        "method": "GET",
                        "path": "/api/ping/google",
                        "name": "Google Ping Test",
                        "description": "Test network connectivity to Google DNS (8.8.8.8)",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Ping test completed",
                                "example": {
                                    "success": True,
                                    "target": "google",
                                    "results": [
                                        {"time": 15.2, "status": "success"},
                                        {"time": 14.8, "status": "success"},
                                        {"time": 16.1, "status": "success"}
                                    ],
                                    "average_time": 15.4
                                }
                            }
                        }
                    },
                    {
                        "id": "ping_cloudflare_get",
                        "method": "GET",
                        "path": "/api/ping/cloudflare",
                        "name": "Cloudflare Ping Test",
                        "description": "Test network connectivity to Cloudflare DNS (1.1.1.1)",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Ping test completed",
                                "example": {
                                    "success": True,
                                    "target": "cloudflare",
                                    "results": [
                                        {"time": 12.1, "status": "success"},
                                        {"time": 11.9, "status": "success"},
                                        {"time": 12.3, "status": "success"}
                                    ],
                                    "average_time": 12.1
                                }
                            }
                        }
                    },
                    {
                        "id": "ping_frontend_get",
                        "method": "GET",
                        "path": "/api/ping/frontend",
                        "name": "Frontend Ping Test",
                        "description": "Test connectivity to the frontend server",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Frontend connectivity test completed",
                                "example": {
                                    "success": True,
                                    "target": "frontend",
                                    "status": "reachable",
                                    "response_time": 5.2
                                }
                            }
                        }
                    },
                    {
                        "id": "ping_backend_get",
                        "method": "GET",
                        "path": "/api/ping/backend",
                        "name": "Backend Ping Test",
                        "description": "Test connectivity to the main backend server (port 4000)",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Backend connectivity test completed",
                                "example": {
                                    "success": True,
                                    "target": "backend",
                                    "results": [
                                        {"time": 2.1, "status": "success"},
                                        {"time": 1.9, "status": "success"},
                                        {"time": 2.3, "status": "success"}
                                    ],
                                    "average_time": 2.1
                                }
                            },
                            "500": {
                                "description": "Backend not reachable",
                                "example": {
                                    "success": False,
                                    "target": "backend",
                                    "error": "Backend server (Port 4000) nicht erreichbar"
                                }
                            }
                        }
                    },
                    {
                        "id": "frontend_status_get",
                        "method": "GET",
                        "path": "/api/frontend/status",
                        "name": "Frontend Status Check",
                        "description": "Check if the frontend server is running and accessible",
                        "authentication": "Required (Admin Session)",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Frontend status check completed",
                                "example": {
                                    "success": True,
                                    "status": "online",
                                    "port": 3000,
                                    "message": "Frontend detected on port 3000"
                                }
                            }
                        }
                    },
                    {
                        "id": "uptime_get",
                        "method": "GET",
                        "path": "/api/uptime",
                        "name": "Server Uptime",
                        "description": "Get backend server uptime information",
                        "authentication": "None",
                        "parameters": {},
                        "request_body": None,
                        "response": {
                            "200": {
                                "description": "Uptime information retrieved",
                                "example": {
                                    "uptime_seconds": 3600,
                                    "uptime_formatted": "1h 0m 0s",
                                    "started_at": "2025-01-07T14:30:00Z"
                                }
                            }
                        }
                    }
                ]
            }
        },
        "error_codes": {
            "400": "Bad Request - Invalid input data or malformed request",
            "401": "Unauthorized - Authentication required or invalid credentials",
            "403": "Forbidden - Insufficient permissions for the requested operation",
            "404": "Not Found - Requested resource does not exist",
            "405": "Method Not Allowed - HTTP method not supported for this endpoint",
            "422": "Unprocessable Entity - Request data validation failed",
            "429": "Too Many Requests - Rate limit exceeded",
            "500": "Internal Server Error - Server-side error occurred"
        },
        "rate_limiting": {
            "description": "API endpoints are rate-limited based on API key configuration",
            "default_limit": "60 requests per minute",
            "headers": {
                "X-RateLimit-Limit": "Maximum requests per minute",
                "X-RateLimit-Remaining": "Remaining requests in current window",
                "X-RateLimit-Reset": "Time when rate limit resets"
            }
        },
        "examples": {
            "authentication": {
                "api_key": {
                    "description": "Include API key in request headers",
                    "example": "curl -H 'X-API-Key: ak_1234567890abcdef' http://54.93.86.38:5000/api/users"
                },
                "session": {
                    "description": "Use session authentication for admin endpoints",
                    "example": "Access /admin first to establish session, then make requests"
                }
            }
        }
    }

def get_api_documentation():
    """
    Return the complete API documentation structure
    """
    return get_complete_api_documentation()

# Alias for backwards compatibility
API_DOCUMENTATION = get_complete_api_documentation()
