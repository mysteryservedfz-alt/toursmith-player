"""
Backend API tests for Tour Builder new features:
- QR code generation (frontend only, but test tour data)
- Media type selector (IMAGE/VIDEO/YOUTUBE)
- On-Site Task/Instructions field
- Verification types (TEXT/MULTIPLE CHOICE/WHITEBOARD)
- Story Mode toggle
- Auto-Show Hints toggle
- Case-Insensitive toggle
- Hints field
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    def test_admin_exists(self):
        """Check if admin exists endpoint works"""
        response = requests.get(f"{BASE_URL}/api/admin/exists")
        assert response.status_code == 200
        data = response.json()
        assert "exists" in data
        print(f"Admin exists: {data['exists']}")
    
    def test_login_success(self):
        """Test login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "username" in data
        assert data["username"] == "demo"
        print("Login successful")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401
        print("Invalid credentials rejected correctly")


class TestTourCRUD:
    """Tour CRUD operations tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_tours(self, auth_headers):
        """Test getting all tours"""
        response = requests.get(f"{BASE_URL}/api/tours", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} tours")
    
    def test_create_tour_with_new_fields(self, auth_headers):
        """Test creating a tour and adding stops with new fields"""
        # Create tour
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_New Features Tour", "description": "Testing new features"}
        )
        assert response.status_code == 200
        tour = response.json()
        tour_id = tour["id"]
        print(f"Created tour: {tour_id}")
        
        # Update tour with stops containing new fields
        stop_with_new_fields = {
            "id": "test-stop-1",
            "title": "Test Stop with New Fields",
            "description": "Testing all new fields",
            "taskInstructions": "Find the hidden code on the wall",
            "mediaType": "image",
            "mediaUrl": "https://example.com/image.jpg",
            "unlockMode": "text",
            "answer": "SECRET123",
            "caseInsensitive": True,
            "hintText": "Look near the entrance",
            "autoShowHint": False,
            "storyMode": False,
            "pages": [
                {
                    "id": "test-page-1",
                    "title": "Page with Multiple Choice",
                    "content": "Select the correct answer",
                    "taskInstructions": "Choose wisely",
                    "mediaType": "youtube",
                    "mediaUrl": "https://youtube.com/watch?v=test",
                    "unlockMode": "multiple_choice",
                    "mcOptions": ["Option A", "Option B", "Option C"],
                    "mcCorrectIndex": 1,
                    "hintText": "Think about the video",
                    "autoShowHint": True,
                    "storyMode": False,
                    "caseInsensitive": True,
                    "order": 0
                },
                {
                    "id": "test-page-2",
                    "title": "Whiteboard Page",
                    "content": "Write anything to continue",
                    "unlockMode": "whiteboard",
                    "storyMode": False,
                    "order": 1
                },
                {
                    "id": "test-page-3",
                    "title": "Story Mode Page",
                    "content": "This page has story mode enabled",
                    "storyMode": True,
                    "unlockMode": "text",
                    "answer": "ignored",
                    "order": 2
                }
            ],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop_with_new_fields]}
        )
        assert update_response.status_code == 200
        updated_tour = update_response.json()
        
        # Verify new fields are saved
        stop = updated_tour["stops"][0]
        assert stop["taskInstructions"] == "Find the hidden code on the wall"
        assert stop["mediaType"] == "image"
        assert stop["mediaUrl"] == "https://example.com/image.jpg"
        assert stop["unlockMode"] == "text"
        assert stop["answer"] == "SECRET123"
        assert stop["caseInsensitive"] == True
        assert stop["hintText"] == "Look near the entrance"
        assert stop["autoShowHint"] == False
        assert stop["storyMode"] == False
        print("Stop new fields verified")
        
        # Verify page fields
        page1 = stop["pages"][0]
        assert page1["taskInstructions"] == "Choose wisely"
        assert page1["mediaType"] == "youtube"
        assert page1["unlockMode"] == "multiple_choice"
        assert page1["mcOptions"] == ["Option A", "Option B", "Option C"]
        assert page1["mcCorrectIndex"] == 1
        assert page1["hintText"] == "Think about the video"
        assert page1["autoShowHint"] == True
        print("Page 1 (multiple choice) fields verified")
        
        page2 = stop["pages"][1]
        assert page2["unlockMode"] == "whiteboard"
        print("Page 2 (whiteboard) fields verified")
        
        page3 = stop["pages"][2]
        assert page3["storyMode"] == True
        print("Page 3 (story mode) fields verified")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        print(f"Cleaned up test tour: {tour_id}")
        
        return tour_id


class TestPublicTourAccess:
    """Test public tour access for player"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_public_tour_requires_published_status(self, auth_headers):
        """Test that public endpoint only returns published tours"""
        # Create a draft tour
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Draft Tour"}
        )
        tour_id = response.json()["id"]
        
        # Try to access via public endpoint (should fail - draft)
        public_response = requests.get(f"{BASE_URL}/api/public/tours/{tour_id}")
        assert public_response.status_code == 404
        print("Draft tour correctly not accessible via public endpoint")
        
        # Publish the tour
        requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"status": "published"}
        )
        
        # Now should be accessible
        public_response = requests.get(f"{BASE_URL}/api/public/tours/{tour_id}")
        assert public_response.status_code == 200
        print("Published tour accessible via public endpoint")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_public_tour_returns_all_new_fields(self, auth_headers):
        """Test that public endpoint returns all new fields for player"""
        # Create and publish tour with new fields
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Public Fields Tour"}
        )
        tour_id = response.json()["id"]
        
        # Add stop with all new fields
        stop = {
            "id": "public-test-stop",
            "title": "Public Test Stop",
            "description": "Testing public access",
            "taskInstructions": "Public task",
            "mediaType": "video",
            "mediaUrl": "https://example.com/video.mp4",
            "unlockMode": "multiple_choice",
            "mcOptions": ["A", "B", "C", "D"],
            "mcCorrectIndex": 2,
            "caseInsensitive": True,
            "hintText": "Public hint",
            "autoShowHint": True,
            "storyMode": False,
            "pages": [],
            "order": 0
        }
        
        requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"status": "published", "stops": [stop]}
        )
        
        # Get via public endpoint
        public_response = requests.get(f"{BASE_URL}/api/public/tours/{tour_id}")
        assert public_response.status_code == 200
        tour_data = public_response.json()
        
        # Verify all new fields are present
        public_stop = tour_data["stops"][0]
        assert public_stop["taskInstructions"] == "Public task"
        assert public_stop["mediaType"] == "video"
        assert public_stop["mediaUrl"] == "https://example.com/video.mp4"
        assert public_stop["unlockMode"] == "multiple_choice"
        assert public_stop["mcOptions"] == ["A", "B", "C", "D"]
        assert public_stop["mcCorrectIndex"] == 2
        assert public_stop["caseInsensitive"] == True
        assert public_stop["hintText"] == "Public hint"
        assert public_stop["autoShowHint"] == True
        assert public_stop["storyMode"] == False
        print("All new fields returned in public endpoint")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)


class TestVerificationTypes:
    """Test different verification types"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_text_verification_fields(self, auth_headers):
        """Test TEXT verification type fields"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Text Verification"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "text-verify-stop",
            "title": "Text Verification Stop",
            "description": "Enter the code",
            "unlockMode": "text",
            "answer": "TESTCODE",
            "caseInsensitive": False,
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["unlockMode"] == "text"
        assert saved_stop["answer"] == "TESTCODE"
        assert saved_stop["caseInsensitive"] == False
        print("TEXT verification fields saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_multiple_choice_verification_fields(self, auth_headers):
        """Test MULTIPLE CHOICE verification type fields"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_MC Verification"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "mc-verify-stop",
            "title": "Multiple Choice Stop",
            "description": "Select the answer",
            "unlockMode": "multiple_choice",
            "mcOptions": ["Paris", "London", "Berlin", "Rome"],
            "mcCorrectIndex": 0,
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["unlockMode"] == "multiple_choice"
        assert saved_stop["mcOptions"] == ["Paris", "London", "Berlin", "Rome"]
        assert saved_stop["mcCorrectIndex"] == 0
        print("MULTIPLE CHOICE verification fields saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_whiteboard_verification_fields(self, auth_headers):
        """Test WHITEBOARD verification type fields"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Whiteboard Verification"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "wb-verify-stop",
            "title": "Whiteboard Stop",
            "description": "Write anything",
            "unlockMode": "whiteboard",
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["unlockMode"] == "whiteboard"
        print("WHITEBOARD verification fields saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)


class TestMediaTypes:
    """Test media type selector fields"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "demo",
            "password": "demo123"
        })
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_image_media_type(self, auth_headers):
        """Test IMAGE media type"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Image Media"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "image-media-stop",
            "title": "Image Media Stop",
            "description": "Has image",
            "mediaType": "image",
            "mediaUrl": "https://example.com/photo.jpg",
            "unlockMode": "continue",
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["mediaType"] == "image"
        assert saved_stop["mediaUrl"] == "https://example.com/photo.jpg"
        print("IMAGE media type saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_video_media_type(self, auth_headers):
        """Test VIDEO media type"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_Video Media"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "video-media-stop",
            "title": "Video Media Stop",
            "description": "Has video",
            "mediaType": "video",
            "mediaUrl": "https://example.com/video.mp4",
            "unlockMode": "continue",
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["mediaType"] == "video"
        assert saved_stop["mediaUrl"] == "https://example.com/video.mp4"
        print("VIDEO media type saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)
    
    def test_youtube_media_type(self, auth_headers):
        """Test YOUTUBE media type"""
        response = requests.post(f"{BASE_URL}/api/tours", 
            headers=auth_headers,
            json={"title": "TEST_YouTube Media"}
        )
        tour_id = response.json()["id"]
        
        stop = {
            "id": "youtube-media-stop",
            "title": "YouTube Media Stop",
            "description": "Has YouTube video",
            "mediaType": "youtube",
            "mediaUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "unlockMode": "continue",
            "pages": [],
            "order": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/tours/{tour_id}",
            headers=auth_headers,
            json={"stops": [stop]}
        )
        assert update_response.status_code == 200
        
        saved_stop = update_response.json()["stops"][0]
        assert saved_stop["mediaType"] == "youtube"
        assert saved_stop["mediaUrl"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        print("YOUTUBE media type saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tours/{tour_id}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
