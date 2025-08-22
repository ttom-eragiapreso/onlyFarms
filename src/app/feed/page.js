'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Feed() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [purchasing, setPurchasing] = useState({});
  const [following, setFollowing] = useState({});
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (session) {
      fetchContent();
      fetchFollowing();
    }
  }, [status, session, router]);

  const fetchFollowing = async () => {
    try {
      const res = await fetch('/api/users/me/following', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setFollowingIds(new Set(data.following || []));
      }
    } catch (e) {
      console.error('Error loading following list:', e);
    }
  };

  const fetchContent = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const response = await fetch(`/api/content?page=${pageNum}&limit=10&feed=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setContent(data.content);
        } else {
          setContent(prev => [...prev, ...data.content]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchContent(nextPage);
  };

  const handleFollow = async (creatorId) => {
    if (!session?.user?.id) return;

    setFollowing(prev => ({ ...prev, [creatorId]: true }));
    
    try {
      const res = await fetch(`/api/creators/${creatorId}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // Update local following set
        setFollowingIds(prev => {
          const next = new Set(Array.from(prev));
          if (data.isFollowing) next.add(creatorId);
          else next.delete(creatorId);
          return next;
        });
      }
    } catch (error) {
      console.error('Error following creator:', error);
    } finally {
      setFollowing(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  const handlePurchase = async (contentId, accessType, price, creatorId) => {
    if (!session?.user?.id) return;

    setPurchasing(prev => ({ ...prev, [contentId]: true }));
    
    try {
      if (accessType === 'pay-per-view') {
        const res = await fetch(`/api/content/${contentId}/purchase`, { method: 'POST' });
        if (res.ok) {
          setContent(prev => prev.map(item => 
            item._id === contentId 
              ? { ...item, hasPurchased: true, hasAccess: true }
              : item
          ));
          alert('Purchase successful! You now have access to this content.');
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Purchase failed');
        }
      } else {
        const res = await fetch(`/api/creators/${creatorId}/subscribe`, { method: 'POST' });
        if (res.ok) {
          // Mark all subscription content by this creator as accessible in current feed
          setContent(prev => prev.map(item => 
            item.creator._id === creatorId && item.accessType === 'subscription'
              ? { ...item, hasAccess: true }
              : item
          ));
          alert('Subscription successful! You now have access to all subscriber content.');
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Subscription failed');
        }
      }
    } catch (error) {
      console.error('Access action error:', error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setPurchasing(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const toggleLike = async (contentId) => {
    try {
      const response = await fetch(`/api/content/${contentId}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setContent(prev => prev.map(item => 
          item._id === contentId 
            ? { ...item, likes: data.likes, likeCount: data.likeCount, isLiked: data.isLiked }
            : item
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Feed</span>
          </h1>
          <p className="text-xl text-gray-600">
            Discover the latest content from creators you follow and explore new posts
          </p>
        </div>

        {/* Content Feed */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No content available</h3>
            <p className="text-gray-600 mb-4">
              Start following creators to see their content in your feed
            </p>
            <Link 
              href="/creators"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-md transition-all duration-200"
            >
              Discover Creators
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {content.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Creator Info */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Link href={`/creator/${post.creator._id}`} className="flex items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200">
                          <img
                            src={post.creator.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${post.creator.name}`}
                            alt={post.creator.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                            {post.creator.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    </div>
                    
                    {/* Follow Button */}
                    {post.creator._id !== session?.user?.id && (
                      <button
                        onClick={() => handleFollow(post.creator._id)}
                        disabled={following[post.creator._id]}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
                          followingIds.has(post.creator._id)
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md'
                        }`}
                      >
                        {following[post.creator._id] ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading...
                          </div>
                        ) : followingIds.has(post.creator._id) ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Content Title & Description */}
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    {post.description && (
                      <p className="text-gray-600 line-clamp-2">{post.description}</p>
                    )}
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-sm">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Media Content */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="relative">
                    {post.mediaUrls[0].type === 'image' ? (
                      <div className="relative aspect-video bg-gray-100">
                        <Image
                          src={post.mediaUrls[0].url}
                          alt={post.title}
                          fill
                          className={`object-cover ${
                            !post.hasAccess ? 'opacity-10' : ''
                          }`}
                        />
                        {!post.hasAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative aspect-video bg-gray-100">
                        <video
                          className={`w-full h-full object-cover ${
                            !post.hasAccess ? 'opacity-10' : ''
                          }`}
                          controls={post.hasAccess}
                          poster={post.mediaUrls[0].thumbnail}
                        >
                          {post.hasAccess && (
                            <source src={post.mediaUrls[0].url} type="video/mp4" />
                          )}
                        </video>
                        {!post.hasAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-center text-white">
                              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <div className="w-16 h-16 text-white/80 mx-auto">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Purchase/Subscribe Overlay */}
                    {!post.hasAccess && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                        <div className="text-center text-white">
                          <h3 className="text-lg font-semibold mb-2">
                            {post.accessType === 'pay-per-view' ? 'Premium Content' : 'Subscriber Only'}
                          </h3>
                          <p className="text-sm opacity-90 mb-4">
                            {post.accessType === 'pay-per-view' 
                              ? `Purchase for $${post.price.toFixed(2)} to view this content`
                              : `Subscribe to ${post.creator.name} to view this content`
                            }
                          </p>
                          <button
                            onClick={() => handlePurchase(post._id, post.accessType, post.price, post.creator._id)}
                            disabled={purchasing[post._id]}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                          >
                            {purchasing[post._id] ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Processing...
                              </div>
                            ) : post.accessType === 'pay-per-view' ? (
                              `Purchase for $${post.price.toFixed(2)}`
                            ) : (
                              'Subscribe'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="p-6 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => toggleLike(post._id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <svg className="w-6 h-6" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-medium">{post.likeCount || 0}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">{post.commentCount || 0}</span>
                      </button>

                      <button className="text-gray-500 hover:text-purple-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center text-gray-500">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm">{post.viewCount || 0} views</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="text-center py-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Load More Content
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
