import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchApi, ApiError } from '../client'

describe('API client', () => {
  // Save original fetch
  const originalFetch = global.fetch

  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch
  })

  describe('fetchApi', () => {
    it('returns JSON response for successful request', async () => {
      const mockData = { id: '1', name: 'Test User' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await fetchApi<typeof mockData>('/users/1')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('returns undefined for 204 No Content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await fetchApi<void>('/users/1', { method: 'DELETE' })

      expect(result).toBeUndefined()
    })

    it('throws ApiError with detail message from response', async () => {
      const errorDetail = 'User not found'

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: errorDetail }),
      })

      await expect(fetchApi('/users/invalid-id')).rejects.toThrow(ApiError)

      try {
        await fetchApi('/users/invalid-id')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        if (error instanceof ApiError) {
          expect(error.status).toBe(404)
          expect(error.statusText).toBe('Not Found')
          expect(error.message).toBe(errorDetail)
        }
      }
    })

    it('throws ApiError with message field if detail not present', async () => {
      const errorMessage = 'Something went wrong'

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: errorMessage }),
      })

      try {
        await fetchApi('/users')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        if (error instanceof ApiError) {
          expect(error.message).toBe(errorMessage)
        }
      }
    })

    it('throws ApiError with status and statusText when JSON parse fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      try {
        await fetchApi('/users')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        if (error instanceof ApiError) {
          expect(error.status).toBe(400)
          expect(error.statusText).toBe('Bad Request')
          expect(error.message).toBe('400 Bad Request')
        }
      }
    })

    it('includes custom headers in request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      await fetchApi('/users', {
        headers: {
          Authorization: 'Bearer token',
        },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
        })
      )
    })

    it('includes custom request options', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({}),
      })

      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('uses API_BASE_URL from environment', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      await fetchApi('/users')

      // Should call with base URL + endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/users$/),
        expect.any(Object)
      )
    })
  })

  describe('ApiError', () => {
    it('creates error with status and statusText', () => {
      const error = new ApiError(404, 'Not Found')

      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ApiError')
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
      expect(error.message).toBe('404 Not Found')
    })

    it('creates error with custom message', () => {
      const customMessage = 'User not found'
      const error = new ApiError(404, 'Not Found', customMessage)

      expect(error.message).toBe(customMessage)
      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
    })

    it('is throwable and catchable', () => {
      expect(() => {
        throw new ApiError(500, 'Internal Server Error')
      }).toThrow(ApiError)
    })
  })
})
