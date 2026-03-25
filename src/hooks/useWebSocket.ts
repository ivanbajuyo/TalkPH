'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  userId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  onNotification?: (notification: any) => void;
  onNewPost?: (post: any) => void;
  onNewComment?: (data: any) => void;
  onUserOnline?: (user: any) => void;
  onUserOffline?: (user: any) => void;
  onPostReaction?: (data: any) => void;
}

interface OnlineUser {
  id: string;
  socketId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: Date;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    userId,
    username,
    displayName,
    avatarUrl,
    onNotification,
    onNewPost,
    onNewComment,
    onUserOnline,
    onUserOffline,
    onPostReaction,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Initialize socket connection
  useEffect(() => {
    // Get WebSocket URL from environment or use local gateway
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
    const isProduction = !!wsUrl;

    // In production, connect to the WebSocket service URL
    // In development, use local gateway with XTransformPort
    const socketUrl = isProduction
      ? wsUrl
      : '/?XTransformPort=3003';

    const socketOptions = {
      path: '/',
      transports: ['websocket', 'polling'] as const,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    socketRef.current = isProduction
      ? io(socketUrl, socketOptions)
      : io(socketUrl, socketOptions);

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);

      // Authenticate if user info is available
      if (userId && username && displayName) {
        socket.emit('authenticate', {
          userId,
          username,
          displayName,
          avatarUrl,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Online users
    socket.on('online_users', (data: { users: OnlineUser[] }) => {
      setOnlineUsers(data.users);
    });

    socket.on('user_online', (user: OnlineUser) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
      onUserOnline?.(user);
    });

    socket.on('user_offline', (user: { userId: string; username: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== user.userId));
      onUserOffline?.(user);
    });

    // Notifications
    socket.on('notification', (notification: any) => {
      onNotification?.(notification);
    });

    socket.on('global_notification', (notification: any) => {
      onNotification?.(notification);
    });

    // Posts
    socket.on('post_created', (post: any) => {
      onNewPost?.(post);
    });

    socket.on('post_modified', (data: any) => {
      console.log('Post modified:', data);
    });

    socket.on('post_removed', (data: any) => {
      console.log('Post removed:', data);
    });

    // Comments
    socket.on('post_comment', (data: any) => {
      onNewComment?.(data);
    });

    socket.on('comment_added', (comment: any) => {
      onNewComment?.(comment);
    });

    // Reactions
    socket.on('post_reaction', (data: any) => {
      onPostReaction?.(data);
    });

    // Admin messages
    socket.on('admin_message', (data: any) => {
      onNotification?.({
        type: 'system',
        title: 'Admin Message',
        message: data.message,
        ...data,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, username, displayName, avatarUrl]);

  // Emit functions
  const emitNewPost = useCallback((post: any) => {
    socketRef.current?.emit('new_post', { post });
  }, []);

  const emitNewComment = useCallback((postId: string, comment: any) => {
    socketRef.current?.emit('new_comment', { postId, comment });
  }, []);

  const emitReaction = useCallback((postId: string, reactionType: string, count: number) => {
    socketRef.current?.emit('reaction_added', { postId, reactionType, count });
  }, []);

  const joinPost = useCallback((postId: string) => {
    socketRef.current?.emit('join_post', { postId });
  }, []);

  const leavePost = useCallback((postId: string) => {
    socketRef.current?.emit('leave_post', { postId });
  }, []);

  const emitTyping = useCallback((postId: string, isTyping: boolean) => {
    if (isTyping) {
      socketRef.current?.emit('typing_start', { postId, username });
    } else {
      socketRef.current?.emit('typing_stop', { postId, username });
    }
  }, [username]);

  const sendPrivateMessage = useCallback((toUserId: string, message: any) => {
    socketRef.current?.emit('private_message', { toUserId, message });
  }, []);

  return {
    isConnected,
    onlineUsers,
    emitNewPost,
    emitNewComment,
    emitReaction,
    joinPost,
    leavePost,
    emitTyping,
    sendPrivateMessage,
  };
}
