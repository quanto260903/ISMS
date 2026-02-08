import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Mark that we're handling a 401 error (để middleware không redirect)
      sessionStorage.setItem('401_error', 'true')
      
      // Clear all authentication data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear cookies
      document.cookie = 'token=; path=/; max-age=0'
      document.cookie = 'userRole=; path=/; max-age=0'
      
      // Redirect to unauthorized page
      window.location.href = '/unauthorized'
    }
    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
