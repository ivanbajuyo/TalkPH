'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useAppStore, type View, type Post } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Home,
  Search,
  Plus,
  Bell,
  User,
  Menu,
  TrendingUp,
  Clock,
  MessageCircle,
  Heart,
  ChevronRight,
  X,
  Image as ImageIcon,
  Video,
  FileQuestion,
  AlertTriangle,
  Lightbulb,
  Calendar,
  HelpCircle,
  Building,
  Megaphone,
  CheckCircle,
  ThumbsUp,
  Smile,
  Frown,
  Angry,
  Surprised,
  Sparkles,
  MoreHorizontal,
  Bookmark,
  Share2,
  Flag,
  Trash2,
  Edit,
  Settings,
  Users,
  Shield,
  BarChart3,
  FileText,
  Globe,
  MapPin,
  Hash,
  Eye,
  EyeOff,
  Send,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  Reply,
  ChevronDown,
  Loader2,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// ============ ICONS MAPPING ============
const categoryIcons: Record<string, React.ReactNode> = {
  'MessageCircle': <MessageCircle className="w-5 h-5" />,
  'GraduationCap': <Users className="w-5 h-5" />,
  'Briefcase': <Users className="w-5 h-5" />,
  'Building2': <Building className="w-5 h-5" />,
  'Landmark': <Building className="w-5 h-5" />,
  'Bus': <Globe className="w-5 h-5" />,
  'Heart': <Heart className="w-5 h-5" />,
  'TrendingUp': <TrendingUp className="w-5 h-5" />,
  'Cpu': <Lightbulb className="w-5 h-5" />,
  'Leaf': <Globe className="w-5 h-5" />,
  'Home': <Home className="w-5 h-5" />,
  'BookOpen': <FileText className="w-5 h-5" />,
  'Plane': <Globe className="w-5 h-5" />,
  'Users': <Users className="w-5 h-5" />,
  'Music': <Sparkles className="w-5 h-5" />,
  'ShoppingBag': <Heart className="w-5 h-5" />,
  'Lightbulb': <Lightbulb className="w-5 h-5" />,
};

const postTypeIcons: Record<string, React.ReactNode> = {
  'discussion': <MessageCircle className="w-4 h-4" />,
  'question': <FileQuestion className="w-4 h-4" />,
  'concern': <AlertTriangle className="w-4 h-4" />,
  'suggestion': <Lightbulb className="w-4 h-4" />,
  'poll': <BarChart3 className="w-4 h-4" />,
  'community_alert': <Megaphone className="w-4 h-4" />,
  'event': <Calendar className="w-4 h-4" />,
  'help_request': <HelpCircle className="w-4 h-4" />,
  'barangay_concern': <Building className="w-4 h-4" />,
  'civic_feedback': <CheckCircle className="w-4 h-4" />,
};

const reactionEmojis: Record<string, { emoji: string; label: string }> = {
  'like': { emoji: '👍', label: 'Like' },
  'love': { emoji: '❤️', label: 'Love' },
  'funny': { emoji: '😂', label: 'Funny' },
  'wow': { emoji: '😮', label: 'Wow' },
  'sad': { emoji: '😢', label: 'Sad' },
  'angry': { emoji: '😡', label: 'Angry' },
  'support': { emoji: '🙌', label: 'Support' },
  'helpful': { emoji: '✅', label: 'Helpful' },
  'needs_attention': { emoji: '⚠️', label: 'Needs Attention' },
};

// ============ MAIN APP ============
export default function PHOpenForum() {
  const {
    user,
    setUser,
    authModal,
    setAuthModal,
    currentView,
    setCurrentView,
    selectedPostId,
    setSelectedPostId,
    selectedUsername,
    setSelectedUsername,
    posts,
    setPosts,
    addPost,
    categories,
    setCategories,
    notifications,
    setNotifications,
    selectedCategory,
    setSelectedCategory,
    selectedPostType,
    setSelectedPostType,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsLoading,
    createPostOpen,
    setCreatePostOpen,
  } = useAppStore();

  const { theme, setTheme } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [footerModal, setFooterModal] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    checkAuth();
  }, []);

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedPostType, sortBy, searchQuery]);

  // Fetch notifications for logged-in users
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Fetch post detail when selected
  useEffect(() => {
    if (selectedPostId) {
      fetchPostDetail(selectedPostId);
    }
  }, [selectedPostId]);

  // Fetch profile when selected
  useEffect(() => {
    if (selectedUsername && currentView === 'profile') {
      // Profile data is fetched in the profile view
    }
  }, [selectedUsername, currentView]);

  // Fetch admin data
  useEffect(() => {
    if (currentView === 'admin' && user?.role === 'admin') {
      fetchAdminStats();
      fetchAdminUsers();
      fetchAdminReports();
    }
  }, [currentView, user]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          displayName: data.user.name,
          avatarUrl: data.user.image,
          role: data.user.role,
          isVerified: true,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPostType) params.append('postType', selectedPostType);
      params.append('sortBy', sortBy);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '20');

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      setSelectedPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setAdminStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setAdminUsers(data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchAdminReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      setAdminReports(data);
    } catch (error) {
      console.error('Error fetching admin reports:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.ok) {
        await checkAuth();
        setAuthModal(null);
        toast.success('Welcome back!');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleRegister = async (data: { email: string; username: string; displayName: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success('Account created! Please login.');
        setAuthModal('login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
      setCurrentView('home');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleCreatePost = async (postData: any) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      
      const post = await res.json();
      
      if (res.ok) {
        addPost(post);
        setCreatePostOpen(false);
        toast.success('Post created successfully!');
        fetchPosts();
      } else {
        toast.error(post.error || 'Failed to create post');
      }
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reactionType }),
      });
      
      fetchPosts();
      if (selectedPostId) fetchPostDetail(selectedPostId);
      toast.success('Reaction added!');
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId }),
      });
      
      if (res.ok) {
        if (selectedPostId) fetchPostDetail(selectedPostId);
        toast.success('Vote recorded!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to vote');
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleComment = async () => {
    if (!user || !selectedPostId || !commentText.trim()) return;

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: selectedPostId, body: commentText }),
      });
      
      setCommentText('');
      fetchPostDetail(selectedPostId);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      
      const data = await res.json();
      toast.success(data.saved ? 'Post saved!' : 'Post removed from saved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast.success('Post deleted successfully');
        setSelectedPostId(null);
        setSelectedPost(null);
        setCurrentView('home');
        fetchPosts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete post');
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeFeed />;
      case 'post':
        return <PostDetailView />;
      case 'profile':
        return <ProfileView />;
      case 'notifications':
        return <NotificationsView />;
      case 'saved':
        return <SavedPostsView />;
      case 'categories':
        return <CategoriesView />;
      case 'search':
        return <SearchView />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HomeFeed />;
    }
  };

  // ============ SUB-COMPONENTS ============
  
  const HomeFeed = () => (
    <div className="space-y-4 fade-in">
      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={!selectedPostType ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPostType(null)}
          className="shrink-0"
        >
          All
        </Button>
        <Button
          variant={selectedPostType === 'discussion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPostType('discussion')}
          className="shrink-0"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Discussions
        </Button>
        <Button
          variant={selectedPostType === 'question' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPostType('question')}
          className="shrink-0"
        >
          <FileQuestion className="w-4 h-4 mr-1" />
          Questions
        </Button>
        <Button
          variant={selectedPostType === 'poll' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPostType('poll')}
          className="shrink-0"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Polls
        </Button>
        <Button
          variant={selectedPostType === 'concern' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPostType('concern')}
          className="shrink-0"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Concerns
        </Button>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="discussed">Most Discussed</SelectItem>
            <SelectItem value="viewed">Most Viewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Be the first to start a discussion!
            </p>
            <Button onClick={() => user ? setCreatePostOpen(true) : setAuthModal('login')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );

  const PostCard = ({ post }: { post: Post }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedPostId(post.id);
        setCurrentView('post');
      }}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {post.isAnonymous ? (
              <Avatar className="w-8 h-8">
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
            ) : post.user ? (
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.user.avatarUrl} />
                <AvatarFallback>{post.user.displayName[0]}</AvatarFallback>
              </Avatar>
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {post.isAnonymous ? 'Anonymous' : post.user?.displayName}
                </span>
                {post.user?.isVerified && !post.isAnonymous && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {post.category.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {postTypeIcons[post.postType]}
            <span className="ml-1 capitalize">{post.postType.replace('_', ' ')}</span>
          </Badge>
        </div>

        {/* Content */}
        <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
        {post.body && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{post.body}</p>
        )}

        {/* Media Preview */}
        {post.media && post.media.length > 0 && (
          <div className="mb-3 rounded-lg overflow-hidden">
            {post.media[0].mediaType === 'video' ? (
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
                <span className="absolute bottom-2 right-2 text-xs bg-black/70 px-2 py-1 rounded">
                  Video
                </span>
              </div>
            ) : (
              <img 
                src={post.media[0].fileUrl} 
                alt="" 
                className="w-full aspect-video object-cover"
              />
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                #{tag.tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Poll Preview */}
        {post.poll && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{post.poll.question}</span>
            </div>
            <div className="space-y-1">
              {post.poll.options.slice(0, 2).map((option) => (
                <div key={option.id} className="text-xs text-muted-foreground">
                  • {option.optionText}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{post.reactionCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Delete button for post owner */}
            {user && (user.id === post.userId || user.role === 'admin') && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSavePost(post.id);
              }}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PostDetailView = () => {
    const [replyTo, setReplyTo] = useState<string | null>(null);

    if (!selectedPost) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4 fade-in">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedPostId(null);
            setSelectedPost(null);
            setCurrentView('home');
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Feed
        </Button>

        <Card>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedPost.isAnonymous ? (
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                ) : selectedPost.user ? (
                  <Avatar 
                    className="w-10 h-10 cursor-pointer"
                    onClick={() => {
                      setSelectedUsername(selectedPost.user?.username || null);
                      setCurrentView('profile');
                    }}
                  >
                    <AvatarImage src={selectedPost.user.avatarUrl} />
                    <AvatarFallback>{selectedPost.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                ) : null}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {selectedPost.isAnonymous ? 'Anonymous' : selectedPost.user?.displayName}
                    </span>
                    {selectedPost.user?.isVerified && !selectedPost.isAnonymous && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}</span>
                    {selectedPost.category && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedPost.category.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>
                  {postTypeIcons[selectedPost.postType]}
                  <span className="ml-1 capitalize">{selectedPost.postType.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>

            {/* Content */}
            <h1 className="text-xl font-bold mb-3">{selectedPost.title}</h1>
            {selectedPost.body && (
              <div className="prose prose-sm max-w-none mb-4">
                {selectedPost.body}
              </div>
            )}

            {/* Location */}
            {(selectedPost.region || selectedPost.province || selectedPost.city || selectedPost.barangay) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>
                  {[selectedPost.barangay, selectedPost.city, selectedPost.province, selectedPost.region]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Media */}
            {selectedPost.media && selectedPost.media.length > 0 && (
              <div className="grid gap-2 mb-4">
                {selectedPost.media.map((media) => (
                  <div key={media.id} className="rounded-lg overflow-hidden">
                    {media.mediaType === 'video' ? (
                      <video 
                        src={media.fileUrl} 
                        controls 
                        className="w-full max-h-96"
                      />
                    ) : (
                      <img 
                        src={media.fileUrl} 
                        alt="" 
                        className="w-full max-h-96 object-contain bg-muted"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Poll */}
            {selectedPost.poll && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{selectedPost.poll.question}</span>
                </div>
                <div className="space-y-2">
                  {selectedPost.poll.options.map((option) => {
                    const totalVotes = selectedPost.poll?.options.reduce(
                      (sum, o) => sum + (o._count?.votes || 0),
                      0
                    ) || 0;
                    const votes = option._count?.votes || 0;
                    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

                    return (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-between text-left h-auto py-3"
                        onClick={() => handleVote(selectedPost.poll!.id, option.id)}
                      >
                        <span>{option.optionText}</span>
                        <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPost.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">
                    #{tag.tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Reactions Bar */}
            <div className="flex items-center gap-2 py-3 border-t border-b">
              {Object.entries(reactionEmojis).map(([type, { emoji, label }]) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleReaction(selectedPost.id, type)}
                >
                  <span className="text-lg">{emoji}</span>
                </Button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{selectedPost.reactionCount} reactions</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{selectedPost.commentCount} comments</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{selectedPost.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Delete button for post owner */}
                {user && (user.id === selectedPost.userId || user.role === 'admin') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeletePost(selectedPost.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSavePost(selectedPost.id)}
                >
                  <Bookmark className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comment Input */}
            {user ? (
              <div className="flex gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setAuthModal('login')}
              >
                Login to comment
              </Button>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {(selectedPost as any).comments?.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatarUrl} />
                    <AvatarFallback>{comment.user?.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.user?.displayName}</span>
                        {comment.user?.isVerified && (
                          <CheckCircle className="w-3 h-3 text-primary" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.body}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        {comment.reactionCount || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => setReplyTo(comment.id)}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ProfileView = () => {
    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
      displayName: '',
      bio: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (selectedUsername) {
        fetch(`/api/profiles?username=${selectedUsername}`)
          .then((res) => res.json())
          .then((data) => {
            setProfile(data);
            // Initialize edit form
            setEditForm({
              displayName: data.displayName || '',
              bio: data.bio || '',
              region: data.region || '',
              province: data.province || '',
              city: data.city || '',
              barangay: data.barangay || '',
            });
          });
        
        // Fetch user's posts
        fetch(`/api/posts?limit=10`)
          .then((res) => res.json())
          .then((data) => {
            const filtered = (data.posts || []).filter(
              (p: any) => p.user?.username === selectedUsername && !p.isAnonymous
            );
            setUserPosts(filtered);
          });
      }
    }, [selectedUsername]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File too large. Maximum size is 5MB.');
          return;
        }
        
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSaveProfile = async () => {
      if (!editForm.displayName.trim()) {
        toast.error('Display name is required');
        return;
      }

      setIsSaving(true);
      try {
        const formData = new FormData();
        formData.append('displayName', editForm.displayName);
        formData.append('bio', editForm.bio);
        formData.append('region', editForm.region);
        formData.append('province', editForm.province);
        formData.append('city', editForm.city);
        formData.append('barangay', editForm.barangay);
        
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }

        const res = await fetch('/api/profiles/me', {
          method: 'PATCH',
          body: formData,
        });

        if (res.ok) {
          const updated = await res.json();
          setProfile(updated);
          setIsEditing(false);
          setAvatarFile(null);
          setAvatarPreview(null);
          toast.success('Profile updated successfully!');
          
          // Update user in store if it's the current user
          if (user?.id === updated.id) {
            // Add timestamp to avatar URL for cache-busting
            const avatarUrlWithCache = updated.avatarUrl 
              ? `${updated.avatarUrl}${updated.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
              : user.avatarUrl;
            
            setUser({
              ...user,
              displayName: updated.displayName,
              avatarUrl: avatarUrlWithCache,
            });
          }
        } else {
          const error = await res.json();
          toast.error(error.error || 'Failed to update profile');
        }
      } catch (error) {
        toast.error('Failed to update profile');
      } finally {
        setIsSaving(false);
      }
    };

    if (!profile) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    const isOwnProfile = user?.username === selectedUsername;

    return (
      <div className="space-y-4 fade-in">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedUsername(null);
            setCurrentView('home');
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <Card>
          <CardContent className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-2xl">{profile.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-bold">{profile.displayName}</h1>
                  {profile.isVerified && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm mt-2">{profile.bio}</p>
                )}
                {(profile.region || profile.province || profile.city) && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[profile.city, profile.province, profile.region]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center sm:justify-start gap-6 py-4 border-t border-b">
              <div className="text-center">
                <div className="text-2xl font-bold">{profile._count?.posts || 0}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{profile.reputationPoints || 0}</div>
                <div className="text-sm text-muted-foreground">Reputation</div>
              </div>
              <div className="text-center">
                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                  {profile.role}
                </Badge>
              </div>
            </div>

            {/* Posts */}
            <div className="mt-6">
              <h2 className="font-semibold mb-4">Posts</h2>
              {userPosts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No posts yet
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Modal */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-8 text-white overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
              <DialogHeader className="relative">
                <DialogTitle className="text-2xl font-bold text-white">Edit Profile</DialogTitle>
                <DialogDescription className="text-emerald-100">
                  Customize how others see you
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center -mt-16 relative z-10">
                <div className="relative group">
                  {/* Gradient ring */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <Avatar className="w-28 h-28 border-4 border-white dark:border-zinc-900 shadow-xl relative">
                    <AvatarImage src={avatarPreview || profile.avatarUrl} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">{editForm.displayName[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all hover:scale-110"
                  >
                    <Edit className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Click the edit icon to upload<br/>Max 5MB • JPEG, PNG, WebP, GIF
                </p>
              </div>

              {/* Display Name - Card Style */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">Display Name</Label>
                    <p className="text-xs text-muted-foreground">This is how others will see you</p>
                  </div>
                </div>
                <Input
                  id="displayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Your display name"
                  maxLength={50}
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              {/* Bio - Card Style */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-sm font-semibold text-foreground">Bio</Label>
                    <p className="text-xs text-muted-foreground">Tell us a little about yourself</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Share your story</span>
                    <span className={`text-xs font-medium ${editForm.bio.length > 180 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {editForm.bio.length}/200
                    </span>
                  </div>
                </div>
              </div>

              {/* Location - Card Style */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Location</Label>
                    <p className="text-xs text-muted-foreground">Help others know where you're from</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={editForm.region}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    placeholder="Region"
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <Input
                    value={editForm.province}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                    placeholder="Province"
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="City/Municipality"
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <Input
                    value={editForm.barangay}
                    onChange={(e) => setEditForm({ ...editForm, barangay: e.target.value })}
                    placeholder="Barangay"
                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const NotificationsView = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={async () => {
            await fetch('/api/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            fetchNotifications();
            toast.success('All notifications marked as read');
          }}
        >
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              You're all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={notification.isRead ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={notification.actor?.avatarUrl} />
                    <AvatarFallback>
                      {notification.actor?.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{notification.actor?.displayName}</span>
                      {' '}
                      {notification.type === 'post_reply' && 'replied to your post'}
                      {notification.type === 'comment_reply' && 'replied to your comment'}
                      {notification.type === 'post_reaction' && 'reacted to your post'}
                      {notification.type === 'comment_reaction' && 'reacted to your comment'}
                      {notification.type === 'mention' && 'mentioned you'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const SavedPostsView = () => {
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (user) {
        fetch('/api/saved')
          .then((res) => res.json())
          .then((data) => {
            setSavedPosts(data);
            setLoading(false);
          });
      }
    }, [user]);

    if (!user) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Login required</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Please login to view your saved posts
            </p>
            <Button onClick={() => setAuthModal('login')}>Login</Button>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4 fade-in">
        <h1 className="text-xl font-bold">Saved Posts</h1>
        {savedPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No saved posts</h3>
              <p className="text-muted-foreground text-sm">
                Save posts to read them later
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const CategoriesView = () => (
    <div className="space-y-4 fade-in">
      <h1 className="text-xl font-bold">Categories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedCategory(category.slug);
              setCurrentView('home');
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {categoryIcons[category.iconName || 'MessageCircle'] || <MessageCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SearchView = () => (
    <div className="space-y-4 fade-in">
      <div className="flex gap-2">
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => setCurrentView('home')}>Search</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Search by title, content, or tags
      </p>
    </div>
  );

  const AdminDashboard = () => {
    if (!user || user.role !== 'admin') {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground text-sm">
              You don't have permission to access this page
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6 fade-in">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{adminStats?.totalPosts || 0}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{adminStats?.totalComments || 0}</div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flag className="w-6 h-6 mx-auto text-destructive mb-2" />
              <div className="text-2xl font-bold">{adminStats?.openReports || 0}</div>
              <div className="text-sm text-muted-foreground">Open Reports</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => (
                        <tr key={u.id} className="border-t">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={u.avatarUrl} />
                                <AvatarFallback>{u.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{u.displayName}</div>
                                <div className="text-sm text-muted-foreground">@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={u.status === 'active' ? 'default' : 'destructive'}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={async () => {
                                  await fetch('/api/admin/users', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      userId: u.id,
                                      role: u.role === 'moderator' ? 'user' : 'moderator',
                                    }),
                                  });
                                  fetchAdminUsers();
                                  toast.success('Role updated');
                                }}
                              >
                                {u.role === 'moderator' ? 'Demote' : 'Promote'}
                              </Button>
                              {u.status === 'active' ? (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={async () => {
                                    await fetch('/api/admin/users', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        userId: u.id,
                                        status: 'suspended',
                                      }),
                                    });
                                    fetchAdminUsers();
                                    toast.success('User suspended');
                                  }}
                                >
                                  Suspend
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={async () => {
                                    await fetch('/api/admin/users', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        userId: u.id,
                                        status: 'active',
                                      }),
                                    });
                                    fetchAdminUsers();
                                    toast.success('User activated');
                                  }}
                                >
                                  Activate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-4">Report</th>
                        <th className="text-left p-4">Reason</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReports.map((report) => (
                        <tr key={report.id} className="border-t">
                          <td className="p-4">
                            <div className="text-sm">
                              {report.post?.title || report.comment?.body?.substring(0, 50) || 'Unknown content'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Reported by {report.reporter?.displayName}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{report.reason}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant={report.status === 'open' ? 'destructive' : 'secondary'}>
                              {report.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={async () => {
                                  await fetch('/api/admin/reports', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      reportId: report.id,
                                      status: 'resolved',
                                    }),
                                  });
                                  fetchAdminReports();
                                  toast.success('Report resolved');
                                }}
                              >
                                Resolve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={async () => {
                                  await fetch('/api/admin/reports', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      reportId: report.id,
                                      status: 'resolved',
                                      action: 'hide_post',
                                    }),
                                  });
                                  fetchAdminReports();
                                  toast.success('Content hidden');
                                }}
                              >
                                Hide Content
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {categoryIcons[category.iconName || 'MessageCircle'] || <MessageCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ============ AUTH MODALS ============
  const AuthModals = () => (
    <>
      {/* Login Modal */}
      <Dialog open={authModal === 'login'} onOpenChange={() => setAuthModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome Back!</DialogTitle>
            <DialogDescription>
              Login to your TalkPH account
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleLogin(
                formData.get('email') as string,
                formData.get('password') as string
              );
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="your@email.com"
                required 
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                required 
              />
            </div>
            <Button type="submit" className="w-full">Login</Button>
            
            {/* Test Credentials Hint */}
            <div className="bg-muted/50 rounded-md p-2 text-xs">
              <p className="font-medium mb-1">🧪 Test: admin@phopenforum.com / password123</p>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <button 
                type="button"
                className="text-primary hover:underline"
                onClick={() => setAuthModal('forgot')}
              >
                Forgot password?
              </button>
              <button 
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setAuthModal('register')}
              >
                Sign up
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={authModal === 'register'} onOpenChange={() => setAuthModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Account</DialogTitle>
            <DialogDescription>
              Join the TalkPH community
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleRegister({
                email: formData.get('email') as string,
                username: formData.get('username') as string,
                displayName: formData.get('displayName') as string,
                password: formData.get('password') as string,
              });
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input 
                id="reg-email" 
                name="email" 
                type="email" 
                placeholder="your@email.com"
                required 
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="juan_dela_cruz"
                required 
              />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                name="displayName" 
                type="text" 
                placeholder="Juan Dela Cruz"
                required 
              />
            </div>
            <div>
              <Label htmlFor="reg-password">Password</Label>
              <Input 
                id="reg-password" 
                name="password" 
                type="password" 
                placeholder="••••••••"
                required 
              />
            </div>
            <Button type="submit" className="w-full">Create Account</Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <button 
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setAuthModal('login')}
              >
                Login
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={authModal === 'forgot'} onOpenChange={() => setAuthModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email to receive a password reset link
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input 
                id="forgot-email" 
                type="email" 
                placeholder="your@email.com"
                required 
              />
            </div>
            <Button type="submit" className="w-full">Send Reset Link</Button>
            <div className="text-center text-sm">
              <button 
                type="button"
                className="text-primary hover:underline"
                onClick={() => setAuthModal('login')}
              >
                Back to login
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  // ============ CREATE POST MODAL ============
  const CreatePostModal = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [postType, setPostType] = useState('discussion');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [region, setRegion] = useState('');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [barangay, setBarangay] = useState('');
    const [tags, setTags] = useState('');
    const [hasPoll, setHasPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; preview: string; type: string }>>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useState<HTMLInputElement | null>(null)[0];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      
      // Validate files
      for (const file of files) {
        // Check file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast.error(`${file.name} is not a valid media file`);
          continue;
        }
        
        // Check file size
        const maxSize = isVideo ? 50 * 1024 * 1024 : (file.type === 'image/gif' ? 15 * 1024 * 1024 : 10 * 1024 * 1024);
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Max ${isVideo ? '50MB' : (file.type === 'image/gif' ? '15MB' : '10MB')}`);
          continue;
        }
        
        // Check limits
        const imageCount = mediaFiles.filter(m => m.type === 'image' || m.type === 'gif').length;
        const videoCount = mediaFiles.filter(m => m.type === 'video').length;
        const gifCount = mediaFiles.filter(m => m.type === 'gif').length;
        
        if (isVideo && videoCount >= 1) {
          toast.error('Maximum 1 video per post');
          continue;
        }
        if (file.type === 'image/gif' && gifCount >= 2) {
          toast.error('Maximum 2 GIFs per post');
          continue;
        }
        if (isImage && file.type !== 'image/gif' && imageCount >= 6) {
          toast.error('Maximum 6 images per post');
          continue;
        }
        
        // Add file
        const preview = URL.createObjectURL(file);
        setMediaFiles(prev => [...prev, {
          file,
          preview,
          type: file.type === 'image/gif' ? 'gif' : (isVideo ? 'video' : 'image'),
        }]);
      }
      
      // Reset input
      e.target.value = '';
    };

    const removeMedia = (index: number) => {
      setMediaFiles(prev => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    };

    const uploadMedia = async (): Promise<Array<{ fileUrl: string; mediaType: string; fileName: string; fileSize: number; mimeType: string }>> => {
      const uploaded: Array<{ fileUrl: string; mediaType: string; fileName: string; fileSize: number; mimeType: string }> = [];
      
      for (const media of mediaFiles) {
        const formData = new FormData();
        formData.append('file', media.file);
        formData.append('type', media.type === 'video' ? 'postVideo' : (media.type === 'gif' ? 'postGif' : 'postImage'));
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          uploaded.push({
            fileUrl: data.fileUrl,
            mediaType: data.mediaType,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
          });
        }
      }
      
      return uploaded;
    };

    const handleSubmit = async () => {
      if (!title.trim()) {
        toast.error('Please enter a title');
        return;
      }

      setUploading(true);
      
      try {
        // Upload media files first
        const uploadedMedia = await uploadMedia();
        
        handleCreatePost({
          title,
          body,
          categoryId: categoryId || null,
          postType,
          isAnonymous,
          region: region || null,
          province: province || null,
          city: city || null,
          barangay: barangay || null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          poll: hasPoll && pollQuestion && pollOptions.filter(Boolean).length >= 2 ? {
            question: pollQuestion,
            options: pollOptions.filter(Boolean),
          } : null,
          media: uploadedMedia,
        });

        // Reset form
        setTitle('');
        setBody('');
        setCategoryId('');
        setPostType('discussion');
        setIsAnonymous(false);
        setRegion('');
        setProvince('');
        setCity('');
        setBarangay('');
        setTags('');
        setHasPoll(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setMediaFiles([]);
      } catch (error) {
        toast.error('Failed to create post');
      } finally {
        setUploading(false);
      }
    };

    return (
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share your thoughts with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={300}
              />
            </div>

            {/* Body */}
            <div>
              <Label>Content</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share more details..."
                className="min-h-[150px]"
              />
            </div>

            {/* Media Upload */}
            <div>
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Media (Images, Videos, GIFs)
              </Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images (max 10MB, 6 total) • Videos (max 50MB, 1 total) • GIFs (max 15MB, 2 total)
                    </p>
                  </div>
                </label>
                
                {/* Preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {media.type === 'video' ? (
                          <video src={media.preview} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.preview} alt="" className="w-full h-full object-cover" />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 w-6 h-6"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        {media.type === 'video' && (
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            Video
                          </div>
                        )}
                        {media.type === 'gif' && (
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            GIF
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category & Post Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Post Type</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="community_alert">Community Alert</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="help_request">Help Request</SelectItem>
                    <SelectItem value="barangay_concern">Barangay Concern</SelectItem>
                    <SelectItem value="civic_feedback">Civic Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location (optional)
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Region"
                />
                <Input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province"
                />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City/Municipality"
                />
                <Input
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  placeholder="Barangay"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Tags (comma separated)
              </Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="philippines, community, help"
              />
            </div>

            {/* Poll */}
            <div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={hasPoll}
                  onCheckedChange={setHasPoll}
                />
                <Label>Add a poll</Label>
              </div>
              {hasPoll && (
                <div className="mt-3 space-y-2 p-3 bg-muted rounded-lg">
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question"
                  />
                  {pollOptions.map((option, i) => (
                    <Input
                      key={i}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[i] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                  ))}
                  {pollOptions.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                    >
                      Add Option
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Anonymous */}
            <div className="flex items-center gap-2">
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Post anonymously
              </Label>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreatePostOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ============ FOOTER MODALS ============
  const FooterModals = () => {
    const modalContent: Record<string, { title: string; content: React.ReactNode }> = {
      guidelines: {
        title: 'Community Guidelines',
        content: (
          <div className="space-y-4 text-sm">
            <p>Welcome to TalkPH! To ensure a positive and respectful community for all Filipinos, please follow these guidelines:</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Be Respectful</h4>
                <p className="text-muted-foreground">Treat all members with respect. No personal attacks, harassment, or hate speech based on race, religion, gender, or any other characteristic.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">2. Stay On Topic</h4>
                <p className="text-muted-foreground">Keep discussions relevant to the category and post. This helps maintain meaningful conversations.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">3. No Spam or Self-Promotion</h4>
                <p className="text-muted-foreground">Avoid posting repetitive content, unsolicited advertisements, or excessive self-promotion.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">4. Share Authentic Content</h4>
                <p className="text-muted-foreground">Only share accurate information. Misinformation and fake news harm our community.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">5. Protect Privacy</h4>
                <p className="text-muted-foreground">Do not share personal information of others without consent. Respect everyone&apos;s privacy.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">6. Report Violations</h4>
                <p className="text-muted-foreground">Help us maintain a safe space by reporting content that violates these guidelines.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">Violations may result in content removal or account suspension. Let&apos;s build a better Philippines together!</p>
          </div>
        ),
      },
      help: {
        title: 'Help Center',
        content: (
          <div className="space-y-4 text-sm">
            <p>Welcome to the TalkPH Help Center. Find answers to common questions and learn how to use our platform.</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">📚 Getting Started</h4>
                <p className="text-muted-foreground">Create an account to start posting, commenting, and reacting to content. Your profile helps you connect with the community.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">✍️ Creating Posts</h4>
                <p className="text-muted-foreground">Click the &quot;Create Post&quot; button to share your thoughts. Choose a category, add media, and engage with the community.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">💬 Comments & Replies</h4>
                <p className="text-muted-foreground">Engage in discussions by commenting on posts. Reply to others to continue the conversation.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">🔔 Notifications</h4>
                <p className="text-muted-foreground">Stay updated with notifications for replies, reactions, and mentions. Click the bell icon to view them.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">🏷️ Categories & Tags</h4>
                <p className="text-muted-foreground">Browse content by categories like Education, Jobs, Government, and more. Use tags to find specific topics.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">🔒 Account Settings</h4>
                <p className="text-muted-foreground">Manage your profile, privacy settings, and preferences from your account panel.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">Need more help? Contact our support team at support@talkph.com</p>
          </div>
        ),
      },
      contact: {
        title: 'Contact Us',
        content: (
          <div className="space-y-4 text-sm">
            <p>We&apos;d love to hear from you! Reach out to us through any of the following channels:</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-1">📧 Email</h4>
                <p className="text-primary">support@talkph.com</p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-1">📱 Social Media</h4>
                <div className="flex gap-3 mt-2">
                  <span>Facebook: @TalkPH</span>
                  <span>Twitter: @TalkPH</span>
                  <span>Instagram: @TalkPH</span>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-1">📍 Address</h4>
                <p>TalkPH Headquarters<br />Makati City, Philippines</p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-1">⏰ Support Hours</h4>
                <p>Monday - Friday: 9:00 AM - 6:00 PM PHT<br />Weekend: 10:00 AM - 4:00 PM PHT</p>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="font-semibold mb-2">Send us a Message</h4>
              <div className="space-y-2">
                <Input placeholder="Your Name" />
                <Input placeholder="Your Email" type="email" />
                <Textarea placeholder="Your Message" className="min-h-[100px]" />
                <Button className="w-full">Send Message</Button>
              </div>
            </div>
          </div>
        ),
      },
      faq: {
        title: 'Frequently Asked Questions',
        content: (
          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  How do I create an account?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">Click the &quot;Login&quot; button and select &quot;Sign up&quot;. Fill in your email, username, display name, and password to create your account.</p>
              </details>
              
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  Is TalkPH free to use?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">Yes! TalkPH is completely free for all users. Create an account and start engaging with the community today.</p>
              </details>
              
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  Can I post anonymously?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">Yes! When creating a post, toggle the &quot;Post anonymously&quot; option to hide your identity from other users.</p>
              </details>
              
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  How do I report inappropriate content?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">Click the three dots on any post or comment and select &quot;Report&quot;. Choose the reason and submit. Our team will review it promptly.</p>
              </details>
              
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  Can I delete my account?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">Yes, you can request account deletion by contacting support at support@talkph.com. We&apos;ll process your request within 48 hours.</p>
              </details>
              
              <details className="group">
                <summary className="font-semibold cursor-pointer p-2 bg-muted rounded-lg flex justify-between items-center">
                  What types of posts can I create?
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-2 text-muted-foreground">You can create discussions, questions, concerns, suggestions, polls, community alerts, events, help requests, barangay concerns, and civic feedback.</p>
              </details>
            </div>
          </div>
        ),
      },
      privacy: {
        title: 'Privacy Policy',
        content: (
          <div className="space-y-4 text-sm">
            <p className="font-semibold">Last Updated: January 2024</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Information We Collect</h4>
                <p className="text-muted-foreground">We collect information you provide directly, including name, email, username, location, and content you post. We also collect usage data to improve our services.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">2. How We Use Your Information</h4>
                <p className="text-muted-foreground">Your information is used to provide and improve our services, communicate with you, personalize your experience, and ensure platform security.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">3. Information Sharing</h4>
                <p className="text-muted-foreground">We do not sell your personal information. We may share data with service providers who assist in operating our platform, subject to confidentiality agreements.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">4. Data Security</h4>
                <p className="text-muted-foreground">We implement industry-standard security measures to protect your data. However, no online service is 100% secure.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">5. Your Rights</h4>
                <p className="text-muted-foreground">You have the right to access, correct, or delete your personal data. Contact us at privacy@talkph.com for requests.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">6. Cookies</h4>
                <p className="text-muted-foreground">We use cookies to enhance your experience. You can manage cookie preferences through your browser settings.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">By using TalkPH, you agree to this Privacy Policy. We may update it periodically.</p>
          </div>
        ),
      },
      terms: {
        title: 'Terms of Service',
        content: (
          <div className="space-y-4 text-sm">
            <p className="font-semibold">Last Updated: January 2024</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Acceptance of Terms</h4>
                <p className="text-muted-foreground">By accessing or using TalkPH, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">2. User Accounts</h4>
                <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account. You must be at least 13 years old to use this service.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">3. User Content</h4>
                <p className="text-muted-foreground">You retain ownership of content you post. By posting, you grant us a license to use, display, and distribute your content on our platform.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">4. Prohibited Activities</h4>
                <p className="text-muted-foreground">You may not: post illegal content, harass others, spread misinformation, spam, or attempt to hack or disrupt our services.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">5. Termination</h4>
                <p className="text-muted-foreground">We reserve the right to terminate or suspend accounts that violate these terms, at our sole discretion.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">6. Limitation of Liability</h4>
                <p className="text-muted-foreground">TalkPH is not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">These terms may be updated. Continued use of TalkPH constitutes acceptance of any changes.</p>
          </div>
        ),
      },
      cookies: {
        title: 'Cookie Policy',
        content: (
          <div className="space-y-4 text-sm">
            <p>This Cookie Policy explains how TalkPH uses cookies and similar technologies on our platform.</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">What Are Cookies?</h4>
                <p className="text-muted-foreground">Cookies are small text files stored on your device when you visit our website. They help us provide a better user experience.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Types of Cookies We Use</h4>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><span className="font-medium text-foreground">Essential Cookies:</span> Required for basic functionality like login and security.</li>
                  <li><span className="font-medium text-foreground">Functional Cookies:</span> Remember your preferences and settings.</li>
                  <li><span className="font-medium text-foreground">Analytics Cookies:</span> Help us understand how you use our platform.</li>
                  <li><span className="font-medium text-foreground">Marketing Cookies:</span> Used to deliver relevant advertisements.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Managing Cookies</h4>
                <p className="text-muted-foreground">You can control cookies through your browser settings. Disabling certain cookies may affect functionality.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Third-Party Cookies</h4>
                <p className="text-muted-foreground">We may use third-party services that set their own cookies, such as analytics providers and social media platforms.</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">By continuing to use TalkPH, you consent to our use of cookies as described in this policy.</p>
          </div>
        ),
      },
      data: {
        title: 'Data Protection',
        content: (
          <div className="space-y-4 text-sm">
            <p>TalkPH is committed to protecting your personal data and your right to privacy.</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Data Protection Principles</h4>
                <p className="text-muted-foreground">We process your data lawfully, fairly, and transparently. We collect only necessary data and keep it secure.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Your Rights Under Data Protection Laws</h4>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><span className="font-medium text-foreground">Right to Access:</span> Request a copy of your personal data.</li>
                  <li><span className="font-medium text-foreground">Right to Rectification:</span> Correct inaccurate data.</li>
                  <li><span className="font-medium text-foreground">Right to Erasure:</span> Request deletion of your data.</li>
                  <li><span className="font-medium text-foreground">Right to Portability:</span> Receive your data in a portable format.</li>
                  <li><span className="font-medium text-foreground">Right to Object:</span> Object to certain processing activities.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Data Retention</h4>
                <p className="text-muted-foreground">We retain your data only as long as necessary for the purposes outlined in our Privacy Policy.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Data Breach Notification</h4>
                <p className="text-muted-foreground">In the event of a data breach, we will notify affected users within 72 hours as required by applicable laws.</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Contact Our Data Protection Officer</h4>
                <p className="text-muted-foreground">For data protection inquiries: dpo@talkph.com</p>
              </div>
            </div>
            
            <p className="text-muted-foreground pt-2">We comply with the Philippines Data Privacy Act of 2012 and other applicable data protection regulations.</p>
          </div>
        ),
      },
    };

    const current = footerModal ? modalContent[footerModal] : null;

    return (
      <Dialog open={!!footerModal} onOpenChange={() => setFooterModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{current?.title}</DialogTitle>
          </DialogHeader>
          {current?.content}
        </DialogContent>
      </Dialog>
    );
  };

  // ============ NAVBAR ============
  const Navbar = () => (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:block">TalkPH</span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentView('home');
                    fetchPosts();
                  }
                }}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Create Post Button - Desktop */}
            <Button
              className="hidden md:flex"
              onClick={() => user ? setCreatePostOpen(true) : setAuthModal('login')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                if (user) {
                  setCurrentView('notifications');
                } else {
                  setAuthModal('login');
                }
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Menu */}
            {user ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </SheetTrigger>
                <SheetContent className="border-l border-zinc-200 dark:border-zinc-700">
                  <SheetHeader>
                    <SheetTitle>Account</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {/* Profile Card */}
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => {
                        setSelectedUsername(user.username);
                        setCurrentView('profile');
                      }}
                    >
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="mt-4 space-y-1">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11 px-3 rounded-lg hover:bg-muted"
                        onClick={() => {
                          setSelectedUsername(user.username);
                          setCurrentView('profile');
                        }}
                      >
                        <User className="w-5 h-5 mr-3" />
                        My Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11 px-3 rounded-lg hover:bg-muted"
                        onClick={() => setCurrentView('saved')}
                      >
                        <Bookmark className="w-5 h-5 mr-3" />
                        Saved Posts
                      </Button>
                    </div>

                    {user.role === 'admin' && (
                      <div className="mt-2 space-y-1">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-11 px-3 rounded-lg hover:bg-muted"
                          onClick={() => setCurrentView('admin')}
                        >
                          <Shield className="w-5 h-5 mr-3" />
                          Admin Dashboard
                        </Button>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-11 px-3 rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button onClick={() => setAuthModal('login')}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // ============ MOBILE BOTTOM NAV ============
  const MobileBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 mobile-nav-safe">
      <div className="flex items-center justify-around h-14">
        <Button
          variant="ghost"
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView('home')}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'text-primary' : ''}`} />
          <span className="text-xs">Home</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView('search')}
        >
          <Search className={`w-5 h-5 ${currentView === 'search' ? 'text-primary' : ''}`} />
          <span className="text-xs">Search</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => user ? setCreatePostOpen(true) : setAuthModal('login')}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 relative"
          onClick={() => {
            if (user) {
              setCurrentView('notifications');
            } else {
              setAuthModal('login');
            }
          }}
        >
          <Bell className={`w-5 h-5 ${currentView === 'notifications' ? 'text-primary' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="text-xs">Alerts</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => {
            if (user) {
              setSelectedUsername(user.username);
              setCurrentView('profile');
            } else {
              setAuthModal('login');
            }
          }}
        >
          {user ? (
            <Avatar className={`w-5 h-5 ${currentView === 'profile' ? 'ring-2 ring-primary' : ''}`}>
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xs">{user.displayName[0]}</AvatarFallback>
            </Avatar>
          ) : (
            <User className={`w-5 h-5 ${currentView === 'profile' ? 'text-primary' : ''}`} />
          )}
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </nav>
  );

  // ============ SIDEBAR ============
  const Sidebar = () => (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-[4.5rem] space-y-4">
        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <div className="space-y-1 px-3 pb-3">
                {categories.slice(0, 10).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCategory(category.slug);
                      setCurrentView('home');
                      fetchPosts();
                    }}
                  >
                    {categoryIcons[category.iconName || 'MessageCircle']}
                    <span className="ml-2 truncate">{category.name}</span>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-primary"
                  onClick={() => setCurrentView('categories')}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  View All Categories
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCurrentView('saved')}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Saved Posts
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setCurrentView('categories')}
            >
              <Hash className="w-4 h-4 mr-2" />
              All Categories
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );

  // ============ FOOTER ============
  const Footer = () => (
    <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-zinc-900 dark:text-white">TalkPH</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              A modern digital town hall for the Philippines. Connect, share, and engage with your community.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a 
                href="https://facebook.com/talkph" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com/talkph" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com/talkph" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com/talkph" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Community Column */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setFooterModal('guidelines')} className="hover:text-primary transition-colors text-left">Guidelines</button></li>
              <li><button onClick={() => setFooterModal('help')} className="hover:text-primary transition-colors text-left">Help Center</button></li>
              <li><button onClick={() => setFooterModal('contact')} className="hover:text-primary transition-colors text-left">Contact Us</button></li>
              <li><button onClick={() => setFooterModal('faq')} className="hover:text-primary transition-colors text-left">FAQs</button></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setFooterModal('privacy')} className="hover:text-primary transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => setFooterModal('terms')} className="hover:text-primary transition-colors text-left">Terms of Service</button></li>
              <li><button onClick={() => setFooterModal('cookies')} className="hover:text-primary transition-colors text-left">Cookie Policy</button></li>
              <li><button onClick={() => setFooterModal('data')} className="hover:text-primary transition-colors text-left">Data Protection</button></li>
            </ul>
          </div>

          {/* Download Column */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Get the App</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Coming soon on iOS and Android
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>App Store</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                <span>Google Play</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} TalkPH. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Made with ❤️ for Filipinos</span>
              <span>•</span>
              <span>🇵🇭 Philippines</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  // ============ MAIN RENDER ============
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-4 pb-20 md:pb-4">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderView()}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      
      {/* Modals */}
      <AuthModals />
      <CreatePostModal />
      <FooterModals />
    </div>
  );
}
