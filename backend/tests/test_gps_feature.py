"""
Backend API tests for GPS Lock Feature:
- GPS fields in Tour model (welcomeGpsEnabled, welcomeGpsLat, welcomeGpsLng, welcomeGpsRadiusMeters)
- GPS settings save to database correctly
- Public tour API returns GPS fields correctly
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGPSFeature:
    """GPS Lock Feature tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_create_tour_with_gps_enabled(self, auth_headers):
        """Test creating a tour with GPS enabled and all GPS fields"""
        # Create tour
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_GPS Tour", "description": "Testing GPS feature"}
        )
        assert response.status_code == 200
        tour = response.json()
        tour_id = tour["id"]
        print(f"Created tour: {tour_id}")
        
        # Update tour with GPS fields
        gps_data = {
            "welcomeTitle": "Welcome to GPS Tour",
            "welcomeBody": "This tour requires GPS verification",
            "welcomeGpsEnabled": True,
            "welcomeGpsLat": 40.7128,
            "welcomeGpsLng": -74.0060,
            "welcomeGpsRadiusMeters": 200
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json=gps_data
        )
        assert update_response.status_code == 200
        updated_tour = update_response.json()
        
        # Verify GPS fields are saved
        assert updated_tour["welcomeGpsEnabled"] == True
        assert updated_tour["welcomeGpsLat"] == 40.7128
        assert updated_tour["welcomeGpsLng"] == -74.0060
        assert updated_tour["welcomeGpsRadiusMeters"] == 200
        print("GPS fields saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
        print(f"Cleaned up test tour: {tour_id}")
    
    def test_gps_radius_range(self, auth_headers):
        """Test GPS radius accepts values in valid range (10-5000m)"""
        # Create tour
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_GPS Radius Tour"}
        )
        tour_id = response.json()["id"]
        
        # Test minimum radius (10m)
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"welcomeGpsEnabled": True, "welcomeGpsRadiusMeters": 10}
        )
        assert update_response.status_code == 200
        assert update_response.json()["welcomeGpsRadiusMeters"] == 10
        print("Minimum radius (10m) accepted")
        
        # Test maximum radius (5000m)
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"welcomeGpsRadiusMeters": 5000}
        )
        assert update_response.status_code == 200
        assert update_response.json()["welcomeGpsRadiusMeters"] == 5000
        print("Maximum radius (5000m) accepted")
        
        # Test default radius (100m)
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"welcomeGpsRadiusMeters": None}
        )
        # When None, should use default or keep previous value
        assert update_response.status_code == 200
        print("Null radius handled correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_gps_coordinates_precision(self, auth_headers):
        """Test GPS coordinates maintain precision"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_GPS Precision Tour"}
        )
        tour_id = response.json()["id"]
        
        # Test with high precision coordinates
        precise_lat = 40.78293456789
        precise_lng = -73.96543210987
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={
                "welcomeGpsEnabled": True,
                "welcomeGpsLat": precise_lat,
                "welcomeGpsLng": precise_lng
            }
        )
        assert update_response.status_code == 200
        data = update_response.json()
        
        # Check precision is maintained (at least 5 decimal places)
        assert abs(data["welcomeGpsLat"] - precise_lat) < 0.00001
        assert abs(data["welcomeGpsLng"] - precise_lng) < 0.00001
        print(f"Coordinate precision maintained: {data['welcomeGpsLat']}, {data['welcomeGpsLng']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_public_tour_returns_gps_fields(self, auth_headers):
        """Test that public endpoint returns GPS fields for player"""
        # Create and publish tour with GPS
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Public GPS Tour"}
        )
        tour_id = response.json()["id"]
        
        # Add GPS settings and publish
        requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={
                "status": "published",
                "welcomeTitle": "GPS Required Tour",
                "welcomeGpsEnabled": True,
                "welcomeGpsLat": 51.5074,
                "welcomeGpsLng": -0.1278,
                "welcomeGpsRadiusMeters": 150
            }
        )
        
        # Get via public endpoint
        public_response = requests.get(f"{BASE_URL}/api/public/tours/{tour_id}")
        assert public_response.status_code == 200
        tour_data = public_response.json()
        
        # Verify GPS fields are present
        assert tour_data["welcomeGpsEnabled"] == True
        assert tour_data["welcomeGpsLat"] == 51.5074
        assert tour_data["welcomeGpsLng"] == -0.1278
        assert tour_data["welcomeGpsRadiusMeters"] == 150
        print("Public endpoint returns all GPS fields")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_gps_disabled_by_default(self, auth_headers):
        """Test that GPS is disabled by default for new tours"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Default GPS Tour"}
        )
        assert response.status_code == 200
        tour = response.json()
        
        # GPS should be disabled by default
        assert tour.get("welcomeGpsEnabled", False) == False
        print("GPS disabled by default for new tours")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour['id']}", headers=auth_headers)
    
    def test_existing_gps_tour(self):
        """Test the existing GPS-enabled tour (a8d45806-5132-410d-9e96-275606cf0761)"""
        tour_id = "a8d45806-5132-410d-9e96-275606cf0761"
        
        response = requests.get(f"{BASE_URL}/api/public/tours/{tour_id}")
        # Skip if tour doesn't exist (may have been deleted)
        if response.status_code == 404:
            pytest.skip("GPS test tour not found - may have been deleted")
        assert response.status_code == 200
        tour = response.json()
        
        # Verify GPS is enabled
        assert tour["welcomeGpsEnabled"] == True
        assert tour["welcomeGpsLat"] is not None
        assert tour["welcomeGpsLng"] is not None
        assert tour["welcomeGpsRadiusMeters"] is not None
        
        print(f"Existing GPS tour verified:")
        print(f"  - GPS Enabled: {tour['welcomeGpsEnabled']}")
        print(f"  - Lat: {tour['welcomeGpsLat']}")
        print(f"  - Lng: {tour['welcomeGpsLng']}")
        print(f"  - Radius: {tour['welcomeGpsRadiusMeters']}m")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
