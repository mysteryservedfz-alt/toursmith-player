#!/usr/bin/env python3
"""
Tour Generator Backend API Testing Suite
Tests all CRUD operations, authentication, and tour management features
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Use the public endpoint from frontend .env
BACKEND_URL = "https://mystery-served.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class TourGeneratorTester:
    def __init__(self):
        self.token = None
        self.username = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_tour_id = None
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, auth_required: bool = True) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{API_BASE}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_admin_exists_check(self):
        """Test checking if admin exists"""
        success, data = self.make_request('GET', '/admin/exists', auth_required=False)
        self.log_test("Admin exists check", success, 
                     f"Response: {data}" if not success else "")
        return success, data
    
    def test_admin_setup(self, username: str = "testadmin", password: str = "testpass123"):
        """Test admin account setup"""
        success, data = self.make_request('POST', '/admin/setup', 
                                        {"username": username, "password": password}, 
                                        expected_status=200, auth_required=False)
        
        if success and 'token' in data:
            self.token = data['token']
            self.username = data['username']
            self.log_test("Admin setup", True)
        else:
            self.log_test("Admin setup", False, f"Response: {data}")
        
        return success, data
    
    def test_admin_login(self, username: str = "testadmin", password: str = "testpass123"):
        """Test admin login"""
        success, data = self.make_request('POST', '/admin/login', 
                                        {"username": username, "password": password}, 
                                        expected_status=200, auth_required=False)
        
        if success and 'token' in data:
            self.token = data['token']
            self.username = data['username']
            self.log_test("Admin login", True)
        else:
            self.log_test("Admin login", False, f"Response: {data}")
        
        return success, data
    
    def test_get_tours(self):
        """Test getting all tours"""
        success, data = self.make_request('GET', '/tours')
        self.log_test("Get tours", success, 
                     f"Response: {data}" if not success else f"Found {len(data)} tours")
        return success, data
    
    def test_create_tour(self):
        """Test creating a new tour"""
        tour_data = {
            "title": "Test Tour",
            "description": "A test tour for API testing"
        }
        success, data = self.make_request('POST', '/tours', tour_data, expected_status=200)
        
        if success and 'id' in data:
            self.created_tour_id = data['id']
            self.log_test("Create tour", True, f"Created tour ID: {self.created_tour_id}")
        else:
            self.log_test("Create tour", False, f"Response: {data}")
        
        return success, data
    
    def test_get_single_tour(self):
        """Test getting a single tour by ID"""
        if not self.created_tour_id:
            self.log_test("Get single tour", False, "No tour ID available")
            return False, {}
        
        success, data = self.make_request('GET', f'/tours/{self.created_tour_id}')
        self.log_test("Get single tour", success, 
                     f"Response: {data}" if not success else f"Retrieved tour: {data.get('title', 'N/A')}")
        return success, data
    
    def test_update_tour(self):
        """Test updating a tour"""
        if not self.created_tour_id:
            self.log_test("Update tour", False, "No tour ID available")
            return False, {}
        
        update_data = {
            "title": "Updated Test Tour",
            "status": "published",
            "stops": [
                {
                    "id": "stop-1",
                    "title": "First Stop",
                    "description": "Test stop description",
                    "unlockMode": "none",
                    "pages": [
                        {
                            "id": "page-1",
                            "title": "Welcome Page",
                            "content": "Welcome to our test tour!",
                            "unlockMode": None,
                            "audioUrl": "https://example.com/audio.mp3",
                            "order": 0
                        }
                    ],
                    "order": 0
                }
            ]
        }
        
        success, data = self.make_request('PUT', f'/tours/{self.created_tour_id}', update_data)
        self.log_test("Update tour", success, 
                     f"Response: {data}" if not success else f"Updated tour: {data.get('title', 'N/A')}")
        return success, data
    
    def test_duplicate_tour(self):
        """Test duplicating a tour"""
        if not self.created_tour_id:
            self.log_test("Duplicate tour", False, "No tour ID available")
            return False, {}
        
        success, data = self.make_request('POST', f'/tours/{self.created_tour_id}/duplicate', 
                                        expected_status=200)
        self.log_test("Duplicate tour", success, 
                     f"Response: {data}" if not success else f"Duplicated tour ID: {data.get('id', 'N/A')}")
        return success, data
    
    def test_public_tour_access(self):
        """Test accessing published tour without authentication"""
        if not self.created_tour_id:
            self.log_test("Public tour access", False, "No tour ID available")
            return False, {}
        
        success, data = self.make_request('GET', f'/public/tours/{self.created_tour_id}', 
                                        auth_required=False)
        self.log_test("Public tour access", success, 
                     f"Response: {data}" if not success else f"Public tour: {data.get('title', 'N/A')}")
        return success, data
    
    def test_delete_tour(self):
        """Test deleting a tour"""
        if not self.created_tour_id:
            self.log_test("Delete tour", False, "No tour ID available")
            return False, {}
        
        success, data = self.make_request('DELETE', f'/tours/{self.created_tour_id}')
        self.log_test("Delete tour", success, 
                     f"Response: {data}" if not success else "Tour deleted successfully")
        return success, data
    
    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test 404 for non-existent tour
        success, data = self.make_request('GET', '/tours/nonexistent-id', expected_status=404)
        self.log_test("404 handling", success, 
                     f"Expected 404, got: {data}" if not success else "Correctly returned 404")
        
        # Test unauthorized access
        old_token = self.token
        self.token = "invalid-token"
        success, data = self.make_request('GET', '/tours', expected_status=401)
        self.token = old_token
        self.log_test("401 handling", success, 
                     f"Expected 401, got: {data}" if not success else "Correctly returned 401")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Tour Generator Backend API Tests")
        print(f"📡 Testing endpoint: {API_BASE}")
        print("=" * 60)
        
        # Check if admin exists first
        admin_exists_success, admin_data = self.test_admin_exists_check()
        
        if admin_exists_success:
            admin_exists = admin_data.get('exists', False)
            
            if not admin_exists:
                # Setup new admin
                self.test_admin_setup()
            else:
                # Try to login with test credentials
                login_success, _ = self.test_admin_login()
                if not login_success:
                    # If login fails, try with provided credentials
                    self.test_admin_login("admin", "admin123")
        
        # Only proceed if we have authentication
        if not self.token:
            print("❌ Cannot proceed without authentication")
            return self.generate_report()
        
        # Run tour management tests
        self.test_get_tours()
        self.test_create_tour()
        self.test_get_single_tour()
        self.test_update_tour()
        self.test_public_tour_access()
        self.test_duplicate_tour()
        self.test_invalid_endpoints()
        self.test_delete_tour()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            success_rate = 100
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": success_rate,
            "failed_tests": failed_tests,
            "all_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = TourGeneratorTester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["success_rate"] == 100 else 1

if __name__ == "__main__":
    sys.exit(main())