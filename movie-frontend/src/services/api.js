import axios from 'axios';

const API_URL = 'http://localhost:8000/api';  // Adjust this to match your Django backend URL

// Debug the API URL
console.log('API URL configured as:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Remove withCredentials since we're using token-based auth
  withCredentials: false
});

// Add request interceptor with more detailed logging
api.interceptors.request.use((config) => {
  console.log('Request interceptor - Initial config:', {
    url: config.url,
    method: config.method,
    headers: config.headers
  });

  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token ? {
    raw: token,
    length: token.length,
    preview: token.substring(0, 20) + '...'
  } : 'No token found');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  } else {
    console.warn('No token available for request:', config.url);
  }

  // Handle FormData content type automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    console.log('FormData detected, removed Content-Type header');
  }
  
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      // Clear auth data on 401 responses
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  login: '/token/',
  register: '/register/',
  refreshToken: '/token/refresh/',

  // Admin endpoints
  adminMovies: '/admin/movies/',
  adminShows: '/admin/shows/',
  adminSeats: '/admin/seats/',

  // User endpoints
  movies: '/movies/',
  shows: '/shows/',
  bookings: '/bookings/',  // Updated to match Django URL pattern
  seats: '/seats/'
};

export const loginUser = async (credentials, isAdmin = false) => {
  try {
    console.log('Attempting login with credentials:', {
      username: credentials.username,
      hasPassword: !!credentials.password,
      isAdmin
    });
    
    const response = await api.post(endpoints.login, {
      username: credentials.username,
      password: credentials.password
    });
    console.log('Login response:', response.data);
    
    if (!response.data || !response.data.access) {
      throw new Error('No access token received from server');
    }

    // Store the token
    const token = response.data.access.trim();
    localStorage.setItem('token', token);

    // Create user data from the login response
    const userData = {
      username: credentials.username,
      is_admin: isAdmin
    };

    // Return both token and user data
    return {
      access: token,
      user: userData
    };
  } catch (error) {
    console.error('Login error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    localStorage.removeItem('token');
    api.defaults.headers.common['Authorization'] = '';
    throw error.response?.data || { detail: error.message || 'An error occurred during login' };
  }
};

export const registerUser = async (userData) => {
  try {
    console.log('Attempting registration with data:', {
      username: userData.username,
      hasPassword: !!userData.password
    });
    
    const response = await api.post(endpoints.register, {
      username: userData.username,
      password: userData.password
    });
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error.response?.data || { detail: 'An error occurred during registration' };
  }
};

// Movie API calls for users (read-only operations)
export const movieAPI = {
  getAll: () => api.get(endpoints.movies),
  getOne: (id) => api.get(`${endpoints.movies}${id}/`),
  getShows: (movieId) => api.get(`${endpoints.movies}${movieId}/shows/`),
};

// Admin API functions
export const adminMovieAPI = {
  getAll: async () => {
    try {
      const response = await api.get(endpoints.adminMovies);
      console.log('Admin movies response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin movies:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`${endpoints.adminMovies}${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin movie:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  getShows: async () => {
    try {
      const response = await api.get(endpoints.adminShows);
      console.log('Admin shows response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin shows:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post(endpoints.adminMovies, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin movie:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`${endpoints.adminMovies}${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating admin movie:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`${endpoints.adminMovies}${id}/`);
    } catch (error) {
      console.error('Error deleting admin movie:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  createShow: async (data) => {
    try {
      const response = await api.post(endpoints.adminShows, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin show:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  },

  createSeat: async (data) => {
    try {
      const response = await api.post(endpoints.adminSeats, data);
      return response.data;
    } catch (error) {
      console.error('Error creating admin seat:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can access this area.');
      }
      throw error;
    }
  }
};

// Show API calls for users
export const showAPI = {
  getAll: () => api.get(endpoints.shows),
  getOne: (id) => api.get(`${endpoints.shows}${id}/`),
  getBookedSeats: async (id) => {
    console.log('Fetching booked seats for show:', id);
    try {
      const bookedSeatsResponse = await api.get(`/shows/${id}/booked-seats/`);
      console.log('Raw booked seats response:', bookedSeatsResponse);
      
      // Ensure booked_seats is always an array of numbers
      let bookedSeats = [];
      if (bookedSeatsResponse.data && bookedSeatsResponse.data.booked_seats) {
        if (Array.isArray(bookedSeatsResponse.data.booked_seats)) {
          bookedSeats = bookedSeatsResponse.data.booked_seats.map(seat => parseInt(seat));
        } else if (typeof bookedSeatsResponse.data.booked_seats === 'object') {
          bookedSeats = Object.values(bookedSeatsResponse.data.booked_seats).map(seat => parseInt(seat));
        }
      }
      
      console.log('Processed booked seats:', bookedSeats);
      
      return {
        data: {
          booked_seats: bookedSeats
        }
      };
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      throw error;
    }
  },
  create: async (data) => {
    console.log('Creating show with data:', data);
    try {
      const response = await api.post(endpoints.adminShows, data);
      console.log('Show creation response:', response);
      return response;
    } catch (error) {
      console.error('Show creation error:', error);
      throw error;
    }
  },
  createSeat: async (data) => {
    console.log('Creating seat with data:', data);
    try {
      const response = await api.post(endpoints.adminSeats, data);
      console.log('Seat creation response:', response);
      return response;
    } catch (error) {
      console.error('Seat creation error:', error);
      throw error;
    }
  },
  update: async (id, data) => {
    console.log('Updating show:', id, 'with data:', data);
    try {
      const response = await api.put(`${endpoints.adminShows}${id}/`, data);
      console.log('Show update response:', response);
      return response;
    } catch (error) {
      console.error('Show update error:', error);
      throw error;
    }
  },
  delete: (id) => api.delete(`${endpoints.adminShows}${id}/`),
  bookTicket: async (showId, bookingData) => {
    console.log('Booking ticket with data:', { showId, bookingData });
    try {
      // First check if the seat is already booked
      const bookedSeatsResponse = await showAPI.getBookedSeats(showId);
      console.log('Booked seats response raw:', bookedSeatsResponse);
      
      const bookedSeats = bookedSeatsResponse.data.booked_seats;
      const seatNumber = parseInt(bookingData.seat);

      console.log('Current booked seats:', bookedSeats);
      console.log('Attempting to book seat:', seatNumber);

      // Get all seats for this show to find the seat ID
      const seatsResponse = await api.get(`${endpoints.adminSeats}?show_id=${showId}`);
      console.log('Seats response:', seatsResponse.data);
      
      const seat = seatsResponse.data.find(s => s.seat_number === seatNumber);
      console.log('Found seat:', seat);
      
      if (!seat) {
        throw new Error('Seat not found for this show');
      }

      // Check if the seat is already booked
      if (seat.is_booked) {
        const error = new Error('This seat is already booked');
        error.response = { data: { error: 'This seat is already booked' } };
        throw error;
      }
      
      // Make the booking request with the correct seat ID
      const bookingPayload = {
        show: parseInt(showId),
        seat: seat.id
      };
      console.log('Sending booking request with payload:', bookingPayload);
      
      const response = await api.post(endpoints.bookings, bookingPayload);
      console.log('Booking response:', response.data);
      return response;
    } catch (error) {
      console.error('Booking error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        error: error
      });
      
      // If it's already a properly formatted error, throw it as is
      if (error.response?.data?.error) {
        throw error;
      }
      
      // Handle other errors
      if (error.response?.status === 404) {
        throw new Error('Show or seat not found. Please try again.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Seat is already booked or invalid.');
      } else {
        throw new Error('Failed to book ticket. Please try again later.');
      }
    }
  }
};

// Seat API calls
export const seatAPI = {
  getAll: () => api.get('/seats/'),
  getOne: (id) => api.get(`/seats/${id}/`),
  create: (data) => api.post('/seats/', data),
  update: (id, data) => api.put(`/seats/${id}/`, data),
  delete: (id) => api.delete(`/seats/${id}/`),
};

// Booking API calls
export const bookingAPI = {
  getAll: () => api.get(endpoints.bookings),
  create: async (data) => {
    console.log('Creating booking with data:', data);
    try {
      const response = await api.post(endpoints.bookings, data);
      console.log('Booking creation response:', response);
      return response;
    } catch (error) {
      console.error('Booking creation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },
  getOne: (id) => api.get(`${endpoints.bookings}${id}/`),
  getUserBookings: () => api.get(`${endpoints.bookings}user/`),
};

export default api; 