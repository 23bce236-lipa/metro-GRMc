import axios from 'axios'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'grmc_access_token'

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem(STORAGE_KEY)
  return token?.trim() || null
}

const persistAccessToken = (token) => {
  if (typeof window === 'undefined') return

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

let accessToken = getStoredAccessToken()

export class ApiClientError extends Error {
  constructor(message, { code = 'NETWORK_ERROR', status = null } = {}) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

export function setAccessToken(token) {
  accessToken = token?.trim() || null
  persistAccessToken(accessToken)
}

export function getAccessToken() {
  return accessToken || getStoredAccessToken()
}

export function getCurrentUser() {
  const token = getAccessToken()
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=')
    const binaryPayload = atob(paddedPayload)
    const payloadBytes = Uint8Array.from(binaryPayload, (character) => character.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes))
    if (!payload?.sub || !['Citizen', 'Tech', 'Admin'].includes(payload.role)) return null
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearAccessToken()
      return null
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function normalizeApiError(error) {
  const status = error.response?.status ?? null
  const apiError = error.response?.data?.error

  return new ApiClientError(
    apiError?.message || (status ? 'The request could not be completed.' : 'Unable to reach the asset service.'),
    { code: apiError?.code || 'NETWORK_ERROR', status },
  )
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = accessToken || getStoredAccessToken()
  if (token) {
    accessToken = token
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error)

    if ([401, 500].includes(normalizedError.status)) {
      toast.error(normalizedError.message)
    }

    return Promise.reject(normalizedError)
  },
)

export const authApi = {
  async register(data) {
    const response = await apiClient.post('/auth/register', data)
    const { token, user } = response.data
    if (token) setAccessToken(token)
    return { token, user, ...response.data }
  },
  async login(data) {
    const response = await apiClient.post('/auth/login', data)
    const { token, user } = response.data
    if (token) setAccessToken(token)
    return { token, user, ...response.data }
  },
}

export const assetApi = {
  async getAssets(params = {}) {
    const response = await apiClient.get('/assets', { params })
    return response.data
  },
  async getAssetTimeline(assetId) {
    const response = await apiClient.get(`/assets/${assetId}`)
    return response.data
  },
  async reportAsset(assetId, notes) {
    const response = await apiClient.post(`/assets/${assetId}/report`, { notes })
    return response.data
  },
  async fixAsset(assetId, notes) {
    const response = await apiClient.post(`/assets/${assetId}/fix`, { notes })
    return response.data
  },
}

export default apiClient
