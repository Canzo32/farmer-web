import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('home');
  const [produce, setProduce] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set axios authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getCurrentUser();
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error getting current user:', error);
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentView('home');
  };

  const LoginForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const response = await axios.post('/auth/login', formData);
        const { access_token, user } = response.data;
        
        setToken(access_token);
        setUser(user);
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        setCurrentView('dashboard');
      } catch (error) {
        setError(error.response?.data?.detail || 'Login failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-800">Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentView('register')}
            className="text-green-600 hover:text-green-800"
          >
            Don't have an account? Register here
          </button>
        </div>
      </div>
    );
  };

  const RegisterForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'buyer',
      region: 'accra'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const response = await axios.post('/auth/register', formData);
        const { access_token, user } = response.data;
        
        setToken(access_token);
        setUser(user);
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        setCurrentView('dashboard');
      } catch (error) {
        setError(error.response?.data?.detail || 'Registration failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-800">Register</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Region
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({...formData, region: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="accra">Accra</option>
              <option value="ashanti">Ashanti</option>
              <option value="western">Western</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentView('login')}
            className="text-green-600 hover:text-green-800"
          >
            Already have an account? Login here
          </button>
        </div>
      </div>
    );
  };

  const AddProduceForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      category: 'vegetables',
      description: '',
      price: '',
      quantity: '',
      unit: 'kg',
      image_data: ''
    });

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1];
          setFormData({...formData, image_data: base64});
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const submitData = {
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity)
        };
        
        await axios.post('/produce', submitData);
        alert('Produce listed successfully!');
        setCurrentView('dashboard');
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to create produce listing');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-800">Add New Produce</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="livestock">Livestock</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              rows="3"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Price (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="kg">kg</option>
                <option value="bags">bags</option>
                <option value="pieces">pieces</option>
                <option value="bundles">bundles</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Produce'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const Dashboard = () => {
    useEffect(() => {
      fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
      try {
        const [statsResponse, ordersResponse] = await Promise.all([
          axios.get('/dashboard/stats'),
          axios.get('/orders')
        ]);
        
        setStats(statsResponse.data);
        setOrders(ordersResponse.data);
        
        if (user?.role === 'farmer') {
          const produceResponse = await axios.get(`/produce/farmer/${user.id}`);
          setProduce(produceResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-800">
              Welcome, {user?.name}!
            </h2>
            {user?.role === 'farmer' && (
              <button
                onClick={() => setCurrentView('add-produce')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + Add Produce
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'farmer' && (
              <>
                <div className="bg-green-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Total Produce</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.total_produce || 0}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Active Listings</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.active_produce || 0}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Pending Orders</h3>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_orders || 0}</p>
                </div>
              </>
            )}
            {user?.role === 'buyer' && (
              <>
                <div className="bg-green-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Total Orders</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.total_orders || 0}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Pending Orders</h3>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_orders || 0}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Completed Orders</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed_orders || 0}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-green-800">Recent Orders</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold">{order.produce_title}</h4>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'farmer' ? `Buyer: ${order.buyer_name}` : `Farmer: ${order.farmer_name}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {order.quantity} | Total: GHS {order.total_amount}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {user?.role === 'farmer' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-green-800">My Produce</h3>
              <div className="space-y-3">
                {produce.slice(0, 5).map((item) => (
                  <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-gray-600">
                      Category: {item.category} | Price: GHS {item.price}/{item.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} {item.unit}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MarketPlace = () => {
    const [allProduce, setAllProduce] = useState([]);
    const [filteredProduce, setFilteredProduce] = useState([]);
    const [filters, setFilters] = useState({
      category: '',
      region: '',
      search: ''
    });

    useEffect(() => {
      fetchProduce();
    }, []);

    useEffect(() => {
      filterProduce();
    }, [allProduce, filters]);

    const fetchProduce = async () => {
      try {
        const response = await axios.get('/produce');
        setAllProduce(response.data);
        setFilteredProduce(response.data);
      } catch (error) {
        console.error('Error fetching produce:', error);
      }
    };

    const filterProduce = () => {
      let filtered = allProduce;

      if (filters.category) {
        filtered = filtered.filter(item => item.category === filters.category);
      }

      if (filters.region) {
        filtered = filtered.filter(item => item.region === filters.region);
      }

      if (filters.search) {
        filtered = filtered.filter(item => 
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setFilteredProduce(filtered);
    };

    const handleOrder = async (produceId, quantity = 1) => {
      if (!user) {
        alert('Please login to place an order');
        return;
      }

      if (user.role !== 'buyer') {
        alert('Only buyers can place orders');
        return;
      }

      try {
        await axios.post('/orders', {
          produce_id: produceId,
          quantity: quantity
        });
        alert('Order placed successfully!');
      } catch (error) {
        alert(error.response?.data?.detail || 'Error placing order');
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6 text-green-800">Marketplace</h2>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                placeholder="Search produce..."
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Categories</option>
                <option value="grains">Grains</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="livestock">Livestock</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({...filters, region: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Regions</option>
                <option value="accra">Accra</option>
                <option value="ashanti">Ashanti</option>
                <option value="western">Western</option>
              </select>
            </div>
          </div>
        </div>

        {/* Produce Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProduce.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {item.image_data && (
                <img
                  src={`data:image/jpeg;base64,${item.image_data}`}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold text-green-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {item.category} • {item.region}
                  </span>
                  <span className="text-sm text-gray-500">
                    Code: {item.unique_code}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-green-600">
                    GHS {item.price}/{item.unit}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.quantity} {item.unit} available
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Farmer: {item.farmer_name}
                </p>
                {user && user.role === 'buyer' && (
                  <button
                    onClick={() => handleOrder(item.id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Order Now
                  </button>
                )}
                {!user && (
                  <button
                    onClick={() => setCurrentView('login')}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                  >
                    Login to Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HomePage = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-green-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  Ghana's Premier Agricultural Marketplace
                </h1>
                <p className="text-xl mb-6">
                  Connecting farmers, suppliers, and buyers across Accra, Ashanti, and Western regions. 
                  Fresh produce, fair prices, direct from farm to table.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => setCurrentView('register')}
                    className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
                  >
                    Join as Farmer
                  </button>
                  <button
                    onClick={() => setCurrentView('marketplace')}
                    className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600"
                  >
                    Browse Produce
                  </button>
                </div>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1567471945805-069e09c11098?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxHaGFuYSUyMGZhcm1lcnN8ZW58MHx8fGdyZWVufDE3NTIxNzIxMzZ8MA&ixlib=rb-4.1.0&q=85"
                  alt="Ghana Farmers"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-green-800">
              Why Choose Our Platform?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fresh Produce</h3>
                <p className="text-gray-600">
                  Direct from farms with quality guaranteed through photo verification
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fair Pricing</h3>
                <p className="text-gray-600">
                  Fixed prices set by farmers, supporting mobile money payments
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Regional Coverage</h3>
                <p className="text-gray-600">
                  Serving Accra, Ashanti, and Western regions of Ghana
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-green-100 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4 text-green-800">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-gray-700">
              Join thousands of farmers and buyers already using our platform
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setCurrentView('register')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Register Now
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-600 hover:text-white"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Navbar = () => {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-green-800">AgriMarket Ghana</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-green-600"
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView('marketplace')}
                className="text-gray-600 hover:text-green-600"
              >
                Marketplace
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="text-gray-600 hover:text-green-600"
                  >
                    Dashboard
                  </button>
                  <span className="text-gray-600">Hi, {user.name}!</span>
                  <button
                    onClick={logout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView('login')}
                    className="text-gray-600 hover:text-green-600"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-6">
        {currentView === 'home' && <HomePage />}
        {currentView === 'login' && <LoginForm />}
        {currentView === 'register' && <RegisterForm />}
        {currentView === 'dashboard' && user && <Dashboard />}
        {currentView === 'marketplace' && <MarketPlace />}
      </div>
    </div>
  );
}

export default App;