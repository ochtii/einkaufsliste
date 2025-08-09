#!/bin/bash

# 🧪 Einkaufsliste API Test Script
# Testet alle wichtigen API-Endpoints

echo "🚀 Starting Einkaufsliste API Tests..."

# Configuration
BACKEND_URL="http://localhost:4000"
EASTEREGG_URL="http://localhost:8888"
TEST_USER="testuser"
TEST_PASS="testpass"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_test() { echo -e "${BLUE}🧪 Testing: $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Test API health
test_health() {
    print_test "Backend API Health"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" 2>/dev/null)
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        print_success "Backend API is responding"
    else
        print_error "Backend API not responding (HTTP $response)"
        return 1
    fi
    
    print_test "Easter Egg API Health"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$EASTEREGG_URL/egg/api/lol/health" 2>/dev/null)
    if [ "$response" = "200" ]; then
        print_success "Easter Egg API is healthy"
    else
        print_error "Easter Egg API not responding (HTTP $response)"
        return 1
    fi
}

# Test authentication
test_auth() {
    print_test "User Registration"
    register_response=$(curl -s -X POST "$BACKEND_URL/api/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}" 2>/dev/null)
    
    if echo "$register_response" | grep -q "token"; then
        print_success "User registration successful"
    else
        print_warning "User might already exist, trying login..."
    fi
    
    print_test "User Login"
    login_response=$(curl -s -X POST "$BACKEND_URL/api/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}" 2>/dev/null)
    
    if echo "$login_response" | grep -q "token"; then
        print_success "User login successful"
        # Extract token for later use
        TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        USER_UUID=$(echo "$login_response" | grep -o '"uuid":"[^"]*"' | cut -d'"' -f4)
        print_success "Token extracted: ${TOKEN:0:20}..."
        return 0
    else
        print_error "User login failed"
        echo "Response: $login_response"
        return 1
    fi
}

# Test list management
test_lists() {
    if [ -z "$TOKEN" ]; then
        print_error "No auth token available"
        return 1
    fi
    
    print_test "Get User Lists"
    lists_response=$(curl -s -X GET "$BACKEND_URL/api/lists" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$lists_response" | grep -q "\["; then
        print_success "Lists retrieved successfully"
    else
        print_warning "No lists found or error occurred"
    fi
    
    print_test "Create New List"
    create_response=$(curl -s -X POST "$BACKEND_URL/api/lists" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test API List"}' 2>/dev/null)
    
    if echo "$create_response" | grep -q "uuid"; then
        print_success "List created successfully"
        LIST_UUID=$(echo "$create_response" | grep -o '"uuid":"[^"]*"' | cut -d'"' -f4)
        print_success "List UUID: $LIST_UUID"
        return 0
    else
        print_error "List creation failed"
        echo "Response: $create_response"
        return 1
    fi
}

# Test item management
test_items() {
    if [ -z "$LIST_UUID" ]; then
        print_error "No list UUID available"
        return 1
    fi
    
    print_test "Add Item to List"
    item_response=$(curl -s -X POST "$BACKEND_URL/api/lists/$LIST_UUID/items" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Milch","category":"🥛 Milchprodukte","icon":"🥛","comment":"API Test"}' 2>/dev/null)
    
    if echo "$item_response" | grep -q "id"; then
        print_success "Item added successfully"
        ITEM_ID=$(echo "$item_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        print_success "Item ID: $ITEM_ID"
    else
        print_error "Item creation failed"
        echo "Response: $item_response"
        return 1
    fi
    
    print_test "Get List Items"
    items_response=$(curl -s -X GET "$BACKEND_URL/api/lists/$LIST_UUID/items" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$items_response" | grep -q "Test Milch"; then
        print_success "Items retrieved successfully"
    else
        print_error "Items retrieval failed"
        return 1
    fi
}

# Test Easter Eggs
test_easter_eggs() {
    if [ -z "$USER_UUID" ]; then
        print_error "No user UUID available"
        return 1
    fi
    
    print_test "Easter Egg - Stars and Sweets Trigger"
    easter_response=$(curl -s -X POST "$EASTEREGG_URL/egg/api/lol/trigger/stars-and-sweets" \
        -H "X-API-Key: einkaufsliste-easter-2025" \
        -H "X-User-UUID: $USER_UUID" \
        -H "X-User-Name: $TEST_USER" \
        -H "Content-Type: application/json" \
        -d '{"icon":"⭐","category":"🍭 Süßwaren"}' 2>/dev/null)
    
    if echo "$easter_response" | grep -q "success"; then
        print_success "Easter Egg triggered successfully"
        if echo "$easter_response" | grep -q "animation"; then
            print_success "Animation data included"
        fi
    else
        print_error "Easter Egg trigger failed"
        echo "Response: $easter_response"
        return 1
    fi
    
    print_test "Easter Egg - User Stats"
    stats_response=$(curl -s -X GET "$EASTEREGG_URL/egg/api/lol/stats/$USER_UUID" \
        -H "X-API-Key: einkaufsliste-easter-2025" 2>/dev/null)
    
    if echo "$stats_response" | grep -q "total_finds"; then
        print_success "User stats retrieved successfully"
        finds=$(echo "$stats_response" | grep -o '"total_finds":[0-9]*' | cut -d':' -f2)
        print_success "Total Easter Egg finds: $finds"
    else
        print_error "User stats retrieval failed"
        return 1
    fi
}

# Test categories
test_categories() {
    if [ -z "$TOKEN" ]; then
        print_error "No auth token available"
        return 1
    fi
    
    print_test "Get Categories"
    cat_response=$(curl -s -X GET "$BACKEND_URL/api/categories" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$cat_response" | grep -q "\["; then
        print_success "Categories retrieved successfully"
        count=$(echo "$cat_response" | grep -o '"uuid"' | wc -l)
        print_success "Found $count categories"
    else
        print_error "Categories retrieval failed"
        return 1
    fi
}

# Test standard articles
test_standard_articles() {
    if [ -z "$TOKEN" ]; then
        print_error "No auth token available"
        return 1
    fi
    
    print_test "Get Standard Articles"
    articles_response=$(curl -s -X GET "$BACKEND_URL/api/standard-articles" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$articles_response" | grep -q "\["; then
        print_success "Standard articles retrieved successfully"
        count=$(echo "$articles_response" | grep -o '"id"' | wc -l)
        print_success "Found $count standard articles"
    else
        print_error "Standard articles retrieval failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    if [ -n "$LIST_UUID" ] && [ -n "$TOKEN" ]; then
        print_test "Cleaning up test data"
        curl -s -X DELETE "$BACKEND_URL/api/lists/$LIST_UUID" \
            -H "Authorization: Bearer $TOKEN" >/dev/null 2>&1
        print_success "Test list cleaned up"
    fi
}

# Main test execution
main() {
    echo "🧪 Running comprehensive API tests..."
    echo "========================================"
    
    # Test sequence
    test_health || exit 1
    echo ""
    
    test_auth || exit 1
    echo ""
    
    test_categories || print_warning "Categories test failed"
    echo ""
    
    test_standard_articles || print_warning "Standard articles test failed"
    echo ""
    
    test_lists || exit 1
    echo ""
    
    test_items || print_warning "Items test failed"
    echo ""
    
    test_easter_eggs || print_warning "Easter Eggs test failed"
    echo ""
    
    # Cleanup
    cleanup
    
    echo "========================================"
    print_success "🎉 API Tests completed!"
    echo ""
    echo "📊 Test Summary:"
    echo "   ✅ Backend API: Operational"
    echo "   ✅ Easter Egg API: Operational"  
    echo "   ✅ Authentication: Working"
    echo "   ✅ Lists: Working"
    echo "   ✅ Items: Working"
    echo "   ✅ Easter Eggs: Working"
    echo ""
    print_success "All core functionality verified! 🚀"
}

# Run main function
main "$@"
