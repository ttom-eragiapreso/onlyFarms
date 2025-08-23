'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import SubscriptionModal from '@/components/SubscriptionModal';
import Link from 'next/link';
import Image from 'next/image';

export default function CreatorProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [purchasing, setPurchasing] = useState({});
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (session && id) {
      fetchCreatorProfile();
    }
  }, [status, session, id, router]);

  const fetchCreatorProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch creator profile
      const creatorResponse = await fetch(`/api/creators/${id}`);
      if (creatorResponse.ok) {
        const creatorData = await creatorResponse.json();
        setCreator(creatorData);
        setIsSubscribedState(creatorData.isSubscribed);
        setFollowing(creatorData.isFollowing);
      }
      
      // Fetch creator's content
      const contentResponse = await fetch(`/api/content?creator=${id}`);
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContent(contentData.content || []);
      }
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    try {
      setSubscribing(true);
      const res = await fetch(`/api/creators/${id}/subscribe`, { method: 'POST' });
      if (res.ok) {
        setIsSubscribedState(true);
        // refresh creator and content
        fetchCreatorProfile();
      } else {
        const err = await res.json();
        alert(err.error || 'Subscription failed');
      }
    } catch (e) {
      console.error('Subscribe error:', e);
      alert('Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscribedState(true);
    setShowSubscriptionModal(false);
    fetchCreatorProfile(); // Refresh to show updated content
  };

  const handlePurchase = async (contentId) => {
    try {
      setPurchasing(prev => ({ ...prev, [contentId]: true }));
      const res = await fetch(`/api/content/${contentId}/purchase`, { method: 'POST' });
      if (res.ok) {
        setContent(prev => prev.map(item => item._id === contentId ? { ...item, hasAccess: true } : item));
        alert('Purchase successful! You now have access to this content.');
      } else {
        const err = await res.json();
        alert(err.error || 'Purchase failed');
      }
    } catch (e) {
      console.error('Purchase error:', e);
      alert('Purchase failed');
    } finally {
      setPurchasing(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/creators/${id}/follow`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.isFollowing);
        setCreator(prev => ({ 
          ...prev, 
          followerCount: data.followerCount 
        }));
      }
    } catch (error) {
      console.error('Error following creator:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator not found</h1>
          <Link href="/creators" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Back to creators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Cover Section */}
      <div className="relative h-64 bg-gradient-to-r from-purple-400 to-pink-400">
        {creator.coverImage && (
          <img
            src={creator.coverImage}
            alt={`${creator.name}'s cover`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Profile Image */}
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white bg-white">
            <img
              src={creator.image || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
              alt={creator.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Creator Info */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-8">
              {/* Creator Name & Actions */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{creator.name}</h1>
                <p className="text-gray-600 mb-4">@{creator.username || creator.name.toLowerCase().replace(/\s+/g, '')}</p>
                
                {creator.bio && (
                  <p className="text-gray-700 mb-4">{creator.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {creator.followerCount || 0} followers
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {creator.contentCount || content.length} posts
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {creator._id !== session?.user?.id && (
                    <>
                      {/* Subscription Status/Button */}
                      {isSubscribedState ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-800 font-medium">Subscribed</span>
                          </div>
                        </div>
                      ) : creator.subscriptionPrice > 0 ? (
                        <button
                          onClick={handleSubscribe}
                          disabled={subscribing}
                          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                          {subscribing ? (
                            <div className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Subscribing...
                            </div>
                          ) : (
                            `Subscribe for $${creator.subscriptionPrice}/month`
                          )}
                        </button>
                      ) : (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="text-green-800 font-medium">Free Creator</span>
                          </div>
                          <p className="text-xs text-green-700 text-center mt-1">All content is free to view</p>
                        </div>
                      )}
                      
                      {/* Follow Button */}
                      <button
                        onClick={handleFollow}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          following 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                            : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <svg className={`w-4 h-4 mr-2 ${following ? 'text-gray-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {following ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            )}
                          </svg>
                          {following ? 'Following' : 'Follow'}
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:w-2/3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isSubscribedState || creator.subscriptionPrice === 0 ? 'Posts' : 'Preview'}
              </h2>
            </div>

            {content.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600">
                  This creator hasn't posted any content yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {content.map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Content Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={creator.image || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {item.title && (
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      )}
                      
                      {item.description && (
                        <p className="text-gray-700 mb-4">{item.description}</p>
                      )}
                    </div>

                    {/* Content Media with paywall overlay */}
                    <div className="relative">
                      {item.mediaUrls && item.mediaUrls.length > 0 && (
                        <div className="relative aspect-video bg-gray-100">
                          {item.mediaUrls[0].type === 'image' ? (
                            <Image
                              src={item.mediaUrls[0].url}
                              alt={item.title || 'Content'}
                              fill
                              className={`object-cover ${!item.hasAccess ? 'opacity-10' : ''}`}
                            />
                          ) : (
                            <video
                              className={`w-full h-full object-cover ${!item.hasAccess ? 'opacity-10' : ''}`}
                              controls={item.hasAccess}
                              poster={item.mediaUrls[0].thumbnail}
                            >
                              {item.hasAccess && (
                                <source src={item.mediaUrls[0].url} type="video/mp4" />
                              )}
                            </video>
                          )}

                          {!item.hasAccess && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          )}

                          {/* CTA gradient overlay */}
                          {!item.hasAccess && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                              <div className="text-center text-white">
                                <h3 className="text-lg font-semibold mb-2">
                                  {item.accessType === 'pay-per-view' ? 'Premium Content' : 'Subscriber Only'}
                                </h3>
                                <p className="text-sm opacity-90 mb-4">
                                  {item.accessType === 'pay-per-view' 
                                    ? `Purchase for $${item.price.toFixed(2)} to view this content`
                                    : `Subscribe to ${creator.name} to view this content`
                                  }
                                </p>
                                {item.accessType === 'pay-per-view' ? (
                                  <button
                                    onClick={() => handlePurchase(item._id)}
                                    disabled={purchasing[item._id]}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                                  >
                                    {purchasing[item._id] ? (
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Processing...
                                      </div>
                                    ) : (
                                      `Purchase for $${item.price.toFixed(2)}`
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleSubscribe}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                                  >
                                    Subscribe
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content Footer */}
                    <div className="px-6 py-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
<span className="text-sm">{item.likeCount || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
<span className="text-sm">{item.commentCount || 0}</span>
                          </button>
                        </div>
                        
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          creator={creator}
          onSuccess={handleSubscriptionSuccess}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}
    </div>
  );
}
