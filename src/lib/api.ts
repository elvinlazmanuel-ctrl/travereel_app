/**
 * API helper for making authenticated requests
 * Automatically attaches JWT token to requests
 */

interface FetchOptions extends RequestInit {
  requireAuth?: boolean
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
  const { requireAuth = false, headers = {}, ...restOptions } = options

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  if (token || requireAuth) {
    if (!token) {
      throw new Error('Authentication required')
    }
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, config)

  // Handle unauthorized responses
  if (response.status === 401) {
    // Clear invalid token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      // Optionally redirect to login
      // window.location.href = '/'
    }
    throw new Error('Unauthorized')
  }

  return response
}

/**
 * Helper for GET requests
 */
export async function apiGet(url: string, options?: FetchOptions) {
  return apiFetch(url, { ...options, method: 'GET' })
}

/**
 * Helper for POST requests
 */
export async function apiPost(url: string, data?: any, options?: FetchOptions) {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Helper for PUT requests
 */
export async function apiPut(url: string, data?: any, options?: FetchOptions) {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string, options?: FetchOptions) {
  return apiFetch(url, { ...options, method: 'DELETE' })
}
