import requests
import sys
import uuid
import time
from datetime import datetime

class AgriMarketTester:
    def __init__(self, base_url="https://1206913e-7435-45b8-8589-796d4d984a68.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.farmer_id = None
        self.buyer_id = None
        self.produce_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_farmer(self):
        """Test farmer registration"""
        timestamp = int(time.time())
        farmer_data = {
            "name": f"Test Farmer {timestamp}",
            "email": f"farmer{timestamp}@test.com",
            "password": "Password123!",
            "role": "farmer",
            "phone": f"+233{timestamp}",
            "region": "accra"
        }
        
        success, response = self.run_test(
            "Register Farmer",
            "POST",
            "auth/register",
            200,
            data=farmer_data
        )
        
        if success and 'access_token' in response:
            self.farmer_token = response['access_token']
            self.farmer_id = response['user']['id']
            print(f"Farmer registered with ID: {self.farmer_id}")
            return True
        return False

    def test_register_buyer(self):
        """Test buyer registration"""
        timestamp = int(time.time())
        buyer_data = {
            "name": f"Test Buyer {timestamp}",
            "email": f"buyer{timestamp}@test.com",
            "password": "Password123!",
            "role": "buyer",
            "phone": f"+233{timestamp}",
            "region": "accra"
        }
        
        success, response = self.run_test(
            "Register Buyer",
            "POST",
            "auth/register",
            200,
            data=buyer_data
        )
        
        if success and 'access_token' in response:
            self.buyer_token = response['access_token']
            self.buyer_id = response['user']['id']
            print(f"Buyer registered with ID: {self.buyer_id}")
            return True
        return False

    def test_login_farmer(self, email, password):
        """Test farmer login"""
        success, response = self.run_test(
            "Farmer Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response['user']
            return True
        return False

    def test_login_buyer(self, email, password):
        """Test buyer login"""
        success, response = self.run_test(
            "Buyer Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response['user']
            return True
        return False

    def test_create_produce(self):
        """Test creating produce listing"""
        produce_data = {
            "title": f"Test Produce {uuid.uuid4().hex[:8]}",
            "category": "vegetables",
            "description": "Fresh vegetables from the farm",
            "price": 25.50,
            "quantity": 100,
            "unit": "kg",
            "image_data": None
        }
        
        success, response = self.run_test(
            "Create Produce",
            "POST",
            "produce",
            200,
            data=produce_data
        )
        
        if success and 'id' in response:
            self.produce_id = response['id']
            print(f"Produce created with ID: {self.produce_id}")
            return True
        return False

    def test_get_produce(self):
        """Test getting all produce"""
        success, response = self.run_test(
            "Get All Produce",
            "GET",
            "produce",
            200
        )
        
        if success and isinstance(response, list):
            print(f"Found {len(response)} produce listings")
            return True
        return False

    def test_get_produce_by_id(self):
        """Test getting produce by ID"""
        if not self.produce_id:
            print("❌ No produce ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Produce by ID",
            "GET",
            f"produce/{self.produce_id}",
            200
        )
        
        return success

    def test_create_order(self):
        """Test creating an order"""
        if not self.produce_id:
            print("❌ No produce ID available for testing")
            return False
            
        order_data = {
            "produce_id": self.produce_id,
            "quantity": 5
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.order_id = response['id']
            print(f"Order created with ID: {self.order_id}")
            return True
        return False

    def test_get_orders(self):
        """Test getting user orders"""
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"Found {len(response)} orders")
            return True
        return False

    def test_dashboard_stats(self):
        """Test getting dashboard stats"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"Dashboard stats: {response}")
            return True
        return False

def main():
    # Setup
    tester = AgriMarketTester()
    
    # Test farmer registration and login
    if not tester.test_register_farmer():
        print("❌ Farmer registration failed, stopping tests")
        return 1
    
    # Test buyer registration
    if not tester.test_register_buyer():
        print("❌ Buyer registration failed, stopping tests")
        return 1
    
    # Use farmer token for produce creation
    tester.token = tester.farmer_token
    
    # Test produce creation
    if not tester.test_create_produce():
        print("❌ Produce creation failed, stopping tests")
        return 1
    
    # Test getting produce
    tester.test_get_produce()
    tester.test_get_produce_by_id()
    
    # Switch to buyer token for order creation
    tester.token = tester.buyer_token
    
    # Test order creation
    if not tester.test_create_order():
        print("❌ Order creation failed, stopping tests")
        return 1
    
    # Test getting orders
    tester.test_get_orders()
    
    # Test dashboard stats
    tester.test_dashboard_stats()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())