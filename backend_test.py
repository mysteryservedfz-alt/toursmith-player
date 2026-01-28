#!/usr/bin/env python3
"""
Toursmith Admin Backend API Testing
Tests all CRUD operations, authentication, and special features
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class ToursmithAPITester:
    def __init__(self, base_url="https://checkpoint-revert.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_email = f"admin_{datetime.now().strftime('%H%M%S')}@test.com"
        self.admin_password = "TestAdmin123!"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
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
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, use_auth: bool = True) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
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
    
    def test_health_check(self):
        """Test API health endpoint"""
        success, data = self.make_request('GET', '', use_auth=False)
        self.log_test("API Health Check", success, 
                     "" if success else f"Error: {data.get('error', 'Unknown')}")
        return success
    
    def test_admin_setup(self):
        """Test admin setup endpoint"""
        success, data = self.make_request('POST', 'auth/setup', 
                                        {"email": self.admin_email, "password": self.admin_password},
                                        expected_status=200, use_auth=False)
        self.log_test("Admin Setup", success,
                     "" if success else f"Error: {data.get('detail', data.get('error', 'Unknown'))}")
        return success
    
    def test_admin_login(self):
        """Test admin login and get token"""
        success, data = self.make_request('POST', 'auth/login',
                                        {"email": self.admin_email, "password": self.admin_password},
                                        expected_status=200, use_auth=False)
        if success and 'token' in data:
            self.token = data['token']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, 
                         f"Error: {data.get('detail', data.get('error', 'No token received'))}")
            return False
    
    def test_auth_protection(self):
        """Test that protected endpoints require authentication"""
        # Test without token
        success, data = self.make_request('GET', 'tours', use_auth=False, expected_status=401)
        self.log_test("Auth Protection (No Token)", success,
                     "" if success else "Endpoint not properly protected")
        
        # Test with invalid token
        old_token = self.token
        self.token = "invalid_token"
        success, data = self.make_request('GET', 'tours', expected_status=401)
        self.log_test("Auth Protection (Invalid Token)", success,
                     "" if success else "Invalid token accepted")
        self.token = old_token
        
        return success
    
    def test_get_me(self):
        """Test get current user endpoint"""
        success, data = self.make_request('GET', 'auth/me')
        if success and data.get('email') == self.admin_email:
            self.log_test("Get Current User", True)
            return True
        else:
            self.log_test("Get Current User", False, 
                         f"Error: {data.get('detail', 'Email mismatch')}")
            return False
    
    def test_tours_crud(self):
        """Test complete Tours CRUD operations"""
        tour_id = None
        
        # 1. Create Tour
        tour_data = {
            "name": "Test Tour",
            "city": "Test City", 
            "difficulty": "medium",
            "intro_story": "This is a test tour story"
        }
        success, data = self.make_request('POST', 'tours', tour_data, expected_status=200)
        if success and 'id' in data:
            tour_id = data['id']
            self.log_test("Create Tour", True)
        else:
            self.log_test("Create Tour", False, f"Error: {data.get('detail', 'No ID returned')}")
            return False
        
        # 2. Get All Tours
        success, data = self.make_request('GET', 'tours')
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("Get All Tours", True)
        else:
            self.log_test("Get All Tours", False, "No tours returned")
        
        # 3. Get Single Tour
        success, data = self.make_request('GET', f'tours/{tour_id}')
        if success and data.get('id') == tour_id:
            self.log_test("Get Single Tour", True)
        else:
            self.log_test("Get Single Tour", False, f"Error: {data.get('detail', 'Tour not found')}")
        
        # 4. Update Tour
        update_data = {"name": "Updated Test Tour", "difficulty": "hard"}
        success, data = self.make_request('PATCH', f'tours/{tour_id}', update_data)
        if success and data.get('name') == "Updated Test Tour":
            self.log_test("Update Tour", True)
        else:
            self.log_test("Update Tour", False, f"Error: {data.get('detail', 'Update failed')}")
        
        # 5. Delete Tour (will test later after stops)
        return tour_id
    
    def test_stops_crud(self, tour_id: str):
        """Test complete Stops CRUD operations"""
        stop_id = None
        
        # 1. Create Stop
        stop_data = {
            "tour_id": tour_id,
            "title": "Test Stop",
            "guest_instructions": "Test instructions",
            "puzzle_text": "Test puzzle",
            "answer_code": "TEST123",
            "hints": "Test hints"
        }
        success, data = self.make_request('POST', f'tours/{tour_id}/stops', stop_data)
        if success and 'id' in data:
            stop_id = data['id']
            self.log_test("Create Stop", True)
        else:
            self.log_test("Create Stop", False, f"Error: {data.get('detail', 'No ID returned')}")
            return None
        
        # 2. Get All Stops for Tour
        success, data = self.make_request('GET', f'tours/{tour_id}/stops')
        if success and isinstance(data, list) and len(data) > 0:
            self.log_test("Get Tour Stops", True)
        else:
            self.log_test("Get Tour Stops", False, "No stops returned")
        
        # 3. Update Stop
        update_data = {"title": "Updated Test Stop", "answer_code": "UPDATED123"}
        success, data = self.make_request('PATCH', f'stops/{stop_id}', update_data)
        if success and data.get('title') == "Updated Test Stop":
            self.log_test("Update Stop", True)
        else:
            self.log_test("Update Stop", False, f"Error: {data.get('detail', 'Update failed')}")
        
        return stop_id
    
    def test_reorder_stops(self, tour_id: str):
        """Test stop reordering functionality"""
        # Create multiple stops first
        stop_ids = []
        for i in range(3):
            stop_data = {
                "tour_id": tour_id,
                "title": f"Stop {i+1}",
                "guest_instructions": f"Instructions {i+1}",
                "puzzle_text": f"Puzzle {i+1}",
                "answer_code": f"CODE{i+1}",
                "hints": f"Hint {i+1}"
            }
            success, data = self.make_request('POST', f'tours/{tour_id}/stops', stop_data)
            if success and 'id' in data:
                stop_ids.append(data['id'])
        
        if len(stop_ids) < 3:
            self.log_test("Create Multiple Stops for Reorder", False, "Failed to create stops")
            return False
        
        # Reorder stops (reverse order)
        reorder_data = {"stop_ids": list(reversed(stop_ids))}
        success, data = self.make_request('POST', f'tours/{tour_id}/stops/reorder', reorder_data)
        self.log_test("Reorder Stops", success,
                     "" if success else f"Error: {data.get('detail', 'Reorder failed')}")
        
        return success
    
    def test_duplicate_tour(self, tour_id: str):
        """Test tour duplication functionality"""
        success, data = self.make_request('POST', f'tours/{tour_id}/duplicate')
        if success and 'id' in data and data['name'].endswith('(Copy)'):
            self.log_test("Duplicate Tour", True)
            return data['id']  # Return new tour ID
        else:
            self.log_test("Duplicate Tour", False, 
                         f"Error: {data.get('detail', 'Duplication failed')}")
            return None
    
    def test_delete_operations(self, tour_id: str, stop_id: str, duplicate_tour_id: str):
        """Test delete operations"""
        # Delete Stop
        success, data = self.make_request('DELETE', f'stops/{stop_id}', expected_status=200)
        self.log_test("Delete Stop", success,
                     "" if success else f"Error: {data.get('detail', 'Delete failed')}")
        
        # Delete Original Tour
        success, data = self.make_request('DELETE', f'tours/{tour_id}', expected_status=200)
        self.log_test("Delete Tour", success,
                     "" if success else f"Error: {data.get('detail', 'Delete failed')}")
        
        # Delete Duplicate Tour
        if duplicate_tour_id:
            success, data = self.make_request('DELETE', f'tours/{duplicate_tour_id}', expected_status=200)
            self.log_test("Delete Duplicate Tour", success,
                         "" if success else f"Error: {data.get('detail', 'Delete failed')}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting Toursmith Admin API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print(f"👤 Admin email: {self.admin_email}")
        print("-" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ API not accessible, stopping tests")
            return False
        
        # Authentication flow
        if not self.test_admin_setup():
            print("❌ Admin setup failed, stopping tests")
            return False
            
        if not self.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return False
        
        # Auth protection
        self.test_auth_protection()
        self.test_get_me()
        
        # CRUD operations
        tour_id = self.test_tours_crud()
        if not tour_id:
            print("❌ Tour CRUD failed, stopping tests")
            return False
        
        stop_id = self.test_stops_crud(tour_id)
        if not stop_id:
            print("❌ Stop CRUD failed, continuing with limited tests")
        
        # Special features
        self.test_reorder_stops(tour_id)
        duplicate_tour_id = self.test_duplicate_tour(tour_id)
        
        # Cleanup
        self.test_delete_operations(tour_id, stop_id, duplicate_tour_id)
        
        # Results
        print("-" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    """Main test execution"""
    tester = ToursmithAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "base_url": tester.base_url,
        "admin_email": tester.admin_email,
        "tests_run": tester.tests_run,
        "tests_passed": tester.tests_passed,
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_results": tester.test_results
    }
    
    with open('/app/test_reports/backend_api_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())