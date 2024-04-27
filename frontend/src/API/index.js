import axios from 'axios'
import toast from 'react-hot-toast'
export const APIs = async (method, url, data, options = {}, isAuthenticated) => {
  try {
    let response

    const config = {
      headers: options.headers || {}, // Initialize headers as an empty object if not provided
      ...options.options
    }

    if (isAuthenticated) {
      const userToken = JSON.parse(localStorage.getItem('user'))?.token
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`
      }
    }

    switch (method) {
      case 'GET':
        response = await axios.get(url, config)
        break
      case 'POST':
        response = await axios.post(url, data, config)
        break
      case 'PUT':
        response = await axios.put(url, data, config)
        break
      case 'DELETE':
        response = await axios.delete(url, config)
        break
      default:
        break
    }
    if (response && response.status >= 200 && response.status < 300) {
      return response.data
    } else {
      throw new Error('Request failed with status: ' + response.status)
    }
  } catch (error) {
    throw handleAPIError(error) // Handle errors using a separate function
  }
}

const handleAPIError = error => {
  if (error.response) {
    const { status } = error.response
    if (status === 401 || status === 403) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (error.response.data && error.response.data.length === 0) {
      return toast.error('No data found', {
        icon: `ℹ`
      })
    }

    toast.error(error.response.data.message || error.response.data.error)
    return error.response.data.error || error.response.data.message
  } else if (error.request) {
    toast.error('No response received from server')
    return { error: 'No response received from server', status: null }
  } else {
    toast.error(error.message)
    return { error: error.message, status: null }
  }
}
