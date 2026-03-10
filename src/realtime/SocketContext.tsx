import { createContext, type ReactNode, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/auth'

const WS_URL =
  import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const SocketContext = createContext<Socket | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
      return
    }

    const newSocket = io(WS_URL, {
      path: '/ws/socket.io/',
      // Send cookies for session-based auth (Ory, etc.)
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })

    newSocket.on('connect', () => {
      console.debug('[socket.io] connected', newSocket.id)
    })

    newSocket.on('connect_error', (err) => {
      console.warn('[socket.io] connect_error', err.message)
    })

    newSocket.on('disconnect', (reason) => {
      console.debug('[socket.io] disconnected', reason)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}
