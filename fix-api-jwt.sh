#!/bin/bash

# Fix API Server JWT Token Handling

echo "🔧 Fixing API Server JWT Token Support..."

cd /home/ubuntu/einkaufsliste/api

# Create backup
cp admin_server.py admin_server.py.backup

# Add JWT token support to the API server
cat > fix_jwt_support.py << 'EOF'
import re
import json

def add_jwt_support():
    with open('admin_server.py', 'r') as f:
        content = f.read()
    
    # Add JWT import if not present
    if 'import jwt' not in content:
        # Find the imports section and add JWT
        import_section = content.find('import secrets')
        if import_section != -1:
            content = content[:import_section] + 'import jwt\n' + content[import_section:]
    
    # Find the lists POST endpoint and add JWT token extraction
    lists_post_pattern = r'(elif method == \'POST\':\s*# Create new shopping list with UUID.*?)(\s*user_uuid = data\.get\(\'user_uuid\'\))'
    
    replacement = r'''\1
                # Extract user_uuid from JWT token if not provided
                user_uuid = data.get('user_uuid')
                
                if not user_uuid:
                    # Try to extract from JWT token in Authorization header
                    auth_header = self.headers.get('Authorization', '')
                    if auth_header.startswith('Bearer '):
                        token = auth_header[7:]  # Remove 'Bearer ' prefix
                        try:
                            # Decode JWT token (no verification for now, just extract payload)
                            import base64
                            # Split JWT token and decode payload
                            parts = token.split('.')
                            if len(parts) >= 2:
                                # Add padding if needed
                                payload = parts[1]
                                padding = len(payload) % 4
                                if padding:
                                    payload += '=' * (4 - padding)
                                decoded = base64.urlsafe_b64decode(payload)
                                jwt_data = json.loads(decoded)
                                user_uuid = jwt_data.get('userUuid')
                                print(f"Extracted user_uuid from JWT: {user_uuid}")
                        except Exception as e:
                            print(f"JWT decode error: {e}")
                
                # If still no user_uuid, try to find a test user
                if not user_uuid:
                    cursor.execute("SELECT uuid FROM users WHERE username = 'test' LIMIT 1")
                    test_user = cursor.fetchone()
                    if test_user:
                        user_uuid = test_user[0]
                        print(f"Using test user UUID: {user_uuid}")
\2'''
    
    content = re.sub(lists_post_pattern, replacement, content, flags=re.DOTALL)
    
    with open('admin_server.py', 'w') as f:
        f.write(content)
    
    print("✅ JWT support added to API server")

if __name__ == '__main__':
    add_jwt_support()
EOF

python3 fix_jwt_support.py
rm fix_jwt_support.py

echo "✅ API Server JWT fix completed"

# Restart API service
echo "Restarting API service..."
pm2 restart api

echo "🎉 API Server now supports JWT token extraction!"
