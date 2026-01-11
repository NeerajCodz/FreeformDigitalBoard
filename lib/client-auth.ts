'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { DatabaseUser } from '@/lib/auth'

export function useDatabaseUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3

    async function syncUser() {
      if (!isLoaded) return

      if (!clerkUser) {
        if (isMounted) {
          setDbUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Call API to sync user with database
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.status === 401) {
          // Not authenticated on server (e.g., missing cookies)
          if (isMounted) {
            setDbUser(null)
          }
          return
        } else if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to sync user (${response.status})`)
        }

        const userData = await response.json()
        if (isMounted) {
          setDbUser(userData)
        }
      } catch (err) {
        console.error('Error syncing user:', err)
        
        // Retry logic for network errors
        if (retryCount < maxRetries && err instanceof TypeError && err.message === 'Failed to fetch') {
          retryCount++
          console.log(`Retrying sync (${retryCount}/${maxRetries})...`)
          setTimeout(syncUser, 1000 * retryCount) // Exponential backoff
          return
        }
        
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to sync user')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    syncUser()

    return () => {
      isMounted = false
    }
  }, [clerkUser, isLoaded])

  return {
    user: dbUser,
    isLoading,
    error,
    isAuthenticated: !!dbUser,
  }
}

export function useDatabaseUserQuery() {
  const { user: clerkUser, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3

    async function fetchUser() {
      if (!isLoaded) return

      if (!clerkUser) {
        if (isMounted) {
          setDbUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        })
        
        if (response.status === 404) {
          // User doesn't exist in database yet
          if (isMounted) {
            setDbUser(null)
          }
        } else if (response.status === 401) {
          // Not authenticated; treat as no user without error
          if (isMounted) {
            setDbUser(null)
          }
        } else if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch user (${response.status})`)
        } else {
          const userData = await response.json()
          if (isMounted) {
            setDbUser(userData)
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        
        // Retry logic for network errors
        if (retryCount < maxRetries && err instanceof TypeError && err.message === 'Failed to fetch') {
          retryCount++
          console.log(`Retrying fetch (${retryCount}/${maxRetries})...`)
          setTimeout(fetchUser, 1000 * retryCount) // Exponential backoff
          return
        }
        
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch user')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      isMounted = false
    }
  }, [clerkUser, isLoaded])

  return {
    user: dbUser,
    isLoading,
    error,
    isAuthenticated: !!dbUser,
  }
}
