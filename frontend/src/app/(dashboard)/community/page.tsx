"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { communityService } from "@/services";
import { CommunityPost, CommunityComment } from "@/types";
import { useAuth } from "@/context/auth-context";

function PostCard({ post }: { post: CommunityPost }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (comments.length > 0 || loadingComments) return;
    setLoadingComments(true);
    try {
      const data = await communityService.getComments(post.id);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  // Initialize like state from localStorage
  useEffect(() => {
    if (user?.id) {
      const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${user.id}`) || "[]");
      if (likedPosts.includes(post.id)) {
        setIsLiked(true);
      }
    }
  }, [post.id, user?.id]);

  const handleLike = async () => {
    if (isLiked) return;
    try {
      await communityService.likePost(post.id);
      saveLikeToLocal();
      setLikesCount(prev => prev + 1);
    } catch (error: any) {
      if (error.response?.status === 409) {
        saveLikeToLocal();
      } else {
        console.error("Failed to like post:", error);
      }
    }
  };

  const saveLikeToLocal = () => {
    if (!user?.id) return;
    setIsLiked(true);
    const key = `liked_posts_${user.id}`;
    const likedPosts = JSON.parse(localStorage.getItem(key) || "[]");
    if (!likedPosts.includes(post.id)) {
      likedPosts.push(post.id);
      localStorage.setItem(key, JSON.stringify(likedPosts));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await communityService.addComment(post.id, { text: newComment });
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const authorName = post.author_name || "Farmer";
  const authorInitial = authorName[0] || "F";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-black text-green-700 shadow-inner">
          {authorInitial}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-black text-gray-900 text-sm">{authorName}</span>
            <span className="text-[9px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {post.author_role || "FARMER"}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-gray-800 leading-relaxed font-medium text-[15px]">
          {post.content}
        </p>
        
        {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
          <div className="rounded-3xl overflow-hidden border-2 border-gray-50 shadow-sm bg-gray-50 flex items-center justify-center min-h-[200px]">
            <img 
              src={post.image_url || post.image_urls?.[0]} 
              alt="Post Image" 
              className="w-full h-auto max-h-[500px] object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-6 pt-2 text-gray-400 font-black text-xs">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span> 
          <span>{likesCount}</span>
        </button>
        <button 
          onClick={toggleComments}
          className={`flex items-center space-x-2 transition-colors ${showComments ? 'text-green-600' : 'hover:text-green-600'}`}
        >
          <span className="text-lg">💬</span> 
          <span>{post.comments_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="pt-4 border-t border-gray-50 space-y-4 animate-in slide-in-from-top-2">
          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex space-x-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button 
              disabled={!newComment.trim() || isSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>

          {/* Comment List */}
          <div className="space-y-3">
            {loadingComments ? (
              <div className="text-[10px] font-bold text-gray-400 animate-pulse text-center py-2">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-[10px] font-bold text-gray-400 text-center py-2 italic">Be the first to comment</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50/50 p-3 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-900">{comment.author_name || 'Farmer'}</span>
                    <span className="text-[9px] text-gray-400 font-bold">
                      {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium leading-tight">
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isFeed = !pathname.includes("/discussions") && !pathname.includes("/groups");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await communityService.getFeed();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load community feed:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isFeed) fetchPosts();
  }, [isFeed]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-900">Community</h2>
        <Link href="/community/new" className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-green-100 transition-transform active:scale-90">
          +
        </Link>
      </div>

      {/* Community Tabs */}
      <div className="flex p-1.5 bg-gray-100/50 rounded-2xl w-full max-w-md mx-auto">
        <Link 
          href="/community" 
          className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isFeed ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          📰 Feed
        </Link>
        <Link 
          href="/community/discussions" 
          className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            pathname.includes("/discussions") ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          💬 Discussions
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-6 space-y-4 animate-pulse">
                <div className="flex space-x-3"><div className="w-10 h-10 bg-gray-100 rounded-full"></div><div className="space-y-2"><div className="h-3 w-20 bg-gray-100 rounded"></div><div className="h-2 w-10 bg-gray-100 rounded"></div></div></div>
                <div className="h-20 bg-gray-50 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-black flex flex-col items-center">
            <span className="text-4xl mb-4">🌾</span>
            <span>Nothing in the fields yet.</span>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
