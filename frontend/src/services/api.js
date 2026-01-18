import axios from 'axios';

// This creates a central instance of axios
export const api = axios.create({
  // Your FastAPI server address
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a response interceptor to make error handling easier
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // This extracts the specific error message from FastAPI if it exists
    const message = error.response?.data?.detail || error.message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);