import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface OnlineUser {
  id: string
  socketId: string
  username: string
  displayName: string
  avatarUrl?: string
  joinedAt: Date
}

interface Notification {
  id: string
  type: 'post_reply' | 'comment_reply' | 'post_reaction' | 'mention' | 'new_post' | 'system'
  title: string
  message: string
  data?: any
  createdAt: Date
}

// Store for online users
const onlineUsers = new Map<string, OnlineUser>()
const userSockets = new Map<string, Set<string>>() // userId -> Set of socketIds

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const createNotification = (type: Notification['type'], title: string, message: string, data?: any): Notification => ({
  id: generateId(),
  type,
  title,
  message,
  data,
  createdAt: new Date()
})

// Log online users count
const logOnlineUsers = () => {
  console.log(`👥 Online users: ${onlineUsers.size}`)
}

io.on('connection', (socket: Socket) => {
  console.log(`✅ User connected: ${socket.id}`)

  // ==================== AUTHENTICATION ====================
  socket.on('authenticate', (data: { userId: string; username: string; displayName: string; avatarUrl?: string }) => {
    const { userId, username, displayName, avatarUrl } = data

    // Store user info
    const user: OnlineUser = {
      id: userId,
      socketId: socket.id,
      username,
      displayName,
      avatarUrl,
      joinedAt: new Date()
    }

    onlineUsers.set(socket.id, user)

    // Track multiple sockets for same user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId)!.add(socket.id)

    // Join user's personal room for targeted notifications
    socket.join(`user:${userId}`)

    // Broadcast online status
    io.emit('user_online', { userId, username, displayName, avatarUrl })
    
    // Send current online users to the newly connected user
    const usersList = Array.from(onlineUsers.values())
    socket.emit('online_users', { users: usersList })

    logOnlineUsers()
  })

  // ==================== POSTS ====================
  socket.on('new_post', (data: { post: any }) => {
    // Broadcast new post to all users
    io.emit('post_created', data.post)
    console.log(`📝 New post: ${data.post?.title || 'Untitled'}`)
  })

  socket.on('post_updated', (data: { postId: string; updates: any }) => {
    io.emit('post_modified', { postId: data.postId, updates: data.updates })
  })

  socket.on('post_deleted', (data: { postId: string }) => {
    io.emit('post_removed', { postId: data.postId })
  })

  // ==================== COMMENTS ====================
  socket.on('new_comment', (data: { postId: string; comment: any }) => {
    // Broadcast to post room
    io.to(`post:${data.postId}`).emit('comment_added', data.comment)
    
    // Also emit globally for feed updates
    io.emit('post_comment', { postId: data.postId, comment: data.comment })
    console.log(`💬 New comment on post: ${data.postId}`)
  })

  socket.on('join_post', (data: { postId: string }) => {
    socket.join(`post:${data.postId}`)
  })

  socket.on('leave_post', (data: { postId: string }) => {
    socket.leave(`post:${data.postId}`)
  })

  // ==================== REACTIONS ====================
  socket.on('reaction_added', (data: { postId: string; reactionType: string; count: number }) => {
    io.emit('post_reaction', { postId: data.postId, reactionType: data.reactionType, count: data.count })
  })

  // ==================== NOTIFICATIONS ====================
  socket.on('send_notification', (data: { userId: string; notification: Notification }) => {
    io.to(`user:${data.userId}`).emit('notification', data.notification)
  })

  socket.on('broadcast_notification', (data: { notification: Notification }) => {
    io.emit('global_notification', data.notification)
  })

  // ==================== TYPING INDICATORS ====================
  socket.on('typing_start', (data: { postId: string; username: string }) => {
    socket.to(`post:${data.postId}`).emit('user_typing', { username: data.username, postId: data.postId })
  })

  socket.on('typing_stop', (data: { postId: string; username: string }) => {
    socket.to(`post:${data.postId}`).emit('user_stopped_typing', { username: data.username, postId: data.postId })
  })

  // ==================== CHAT / DIRECT MESSAGES ====================
  socket.on('private_message', (data: { toUserId: string; message: any }) => {
    io.to(`user:${data.toUserId}`).emit('private_message', data.message)
  })

  // ==================== LIVE PRESENCE ====================
  socket.on('heartbeat', () => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      // Update last activity
      user.joinedAt = new Date()
    }
  })

  // ==================== ADMIN EVENTS ====================
  socket.on('admin_broadcast', (data: { message: string; type: string }) => {
    io.emit('admin_message', { message: data.message, type: data.type, timestamp: new Date() })
    console.log(`📢 Admin broadcast: ${data.message}`)
  })

  // ==================== DISCONNECT ====================
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id)
    
    if (user) {
      // Remove from online users
      onlineUsers.delete(socket.id)
      
      // Remove from userSockets
      const userSocketSet = userSockets.get(user.id)
      if (userSocketSet) {
        userSocketSet.delete(socket.id)
        if (userSocketSet.size === 0) {
          userSockets.delete(user.id)
          // User is completely offline, broadcast offline status
          io.emit('user_offline', { userId: user.id, username: user.username })
        }
      }
      
      console.log(`❌ User disconnected: ${user.username}`)
      logOnlineUsers()
    } else {
      console.log(`❌ Socket disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`⚠️ Socket error (${socket.id}):`, error)
  })
})

// Health check endpoint
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      onlineUsers: onlineUsers.size,
      timestamp: new Date().toISOString()
    }))
  }
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003
httpServer.listen(PORT, () => {
  console.log(`🚀 TalkPH WebSocket Server running on port ${PORT}`)
  console.log(`📡 Ready for real-time connections`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down server...')
  io.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down server...')
  io.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})
