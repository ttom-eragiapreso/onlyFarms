'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CreatorProfileRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/creator/${id}`);
    }
  }, [id, router]);

  return null;
}
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [purchasing, setPurchasing] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (session && id) {
      fetchCreatorProfile();
    }
  }, [status, session, id, router]);

  // Update follow and subscription states from localStorage when session changes
  useEffect(() => {
    if (session?.user?.id && creator) {
      setFollowing(isFollowing(session.user.id, creator._id));
    }
  }, [session, creator]);

  const fetchCreatorProfile = async () => {
    try {
      setLoading(true);
      
      // Simulate fetching creator profile
      // In a real app, this would fetch from your API
      const mockCreator = {
        _id: id,
        name: 'Sample Creator',
        username: 'samplecreator',
        bio: 'This is a sample creator profile showcasing the content filtering system.',
        profileImage: null,
        coverImage: null,
        followerCount: 1250,
        subscriptionPrice: 9.99
      };

      // Simulate fetching content
      const mockContent = [
        {
          _id: '1',
          title: 'Free Sample Post',
          description: 'This is a free post that everyone can see',
          isSubscriberOnly: false,
          mediaUrls: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
            }
          ],
          tags: ['sample', 'free'],
          createdAt: new Date().toISOString(),
          likeCount: 42,
          commentCount: 8
        },
        {
          _id: '2',
          title: 'Subscriber Only Content',
          description: 'This content is only available to subscribers',
          isSubscriberOnly: true,
          price: 0, // Subscriber-only, no individual price
          mediaUrls: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
            }
          ],
          tags: ['exclusive', 'subscribers'],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          likeCount: 89,
          commentCount: 15
        },
        {
          _id: '3',
          title: 'Premium Pay-Per-View',
          description: 'High-quality content available for individual purchase',
          isSubscriberOnly: false,
          accessType: 'pay-per-view',
          price: 4.99,
          mediaUrls: [
            {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6ade2?w=800&h=600&fit=crop',
            }
          ],
          tags: ['premium', 'exclusive'],
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          likeCount: 156,
          commentCount: 23
        }
      ];

      setCreator(mockCreator);
      setContent(mockContent);
      
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session?.user?.id || !creator) return;

    setFollowing(prev => !prev);
    
    try {
      // Toggle follow status in local storage
      const newFollowStatus = toggleFollow(session.user.id, creator._id);
      
      // Update creator's follower count locally
      setCreator(prev => ({
        ...prev,
        followerCount: prev.followerCount + (newFollowStatus ? 1 : -1)
      }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error following creator:', error);
      // Revert on error
      setFollowing(prev => !prev);
      toggleFollow(session.user.id, creator._id);
    }
  };

  const handleSubscribe = async () => {
    if (!session?.user?.id || !creator) return;

    setSubscribing(true);
    
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add subscription to local storage
      addSubscription(session.user.id, creator._id, creator.subscriptionPrice);
      
      alert('Successfully subscribed! You now have access to all subscriber content.');
      
      // Force a re-render to show updated content
      setContent(prev => [...prev]);
      
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handlePurchase = async (contentId, price) => {
    if (!session?.user?.id) return;

    setPurchasing(prev => ({ ...prev, [contentId]: true }));
    
    try {
      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add purchase to local storage
      addPurchase(session.user.id, contentId);
      
      alert(`Successfully purchased content for $${price.toFixed(2)}!`);
      
    } catch (error) {
      console.error('Error purchasing content:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const canViewContent = (item) => {
    if (!session?.user?.id) return false;
    
    // Free content
    if (!item.isSubscriberOnly && !item.price) return true;
    
    // Subscriber-only content
    if (item.isSubscriberOnly) {
      return isSubscribed(session.user.id, creator._id);
    }
    
    // Pay-per-view content
    if (item.accessType === 'pay-per-view') {
      return hasPurchased(session.user.id, item._id);
    }
    
    return false;
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

  const userIsSubscribed = session?.user?.id ? isSubscribed(session.user.id, creator._id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Cover Section */}
      <div className="relative h-64 bg-gradient-to-r from-purple-400 to-pink-400">
        {creator.coverImage && (
          <Image
            src={creator.coverImage}
            alt={`${creator.name}'s cover`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Profile Image */}
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white bg-white">
            <img
              src={creator.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
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
                <p className="text-gray-600 mb-4">@{creator.username}</p>
                
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
                    {content.length} posts
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {creator._id !== session?.user?.id && (
                    <>
                      {userIsSubscribed ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center">
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <span className="text-blue-800 font-medium">Free Content</span>
                        </div>
                      )}
                      
                      <button
                        onClick={handleFollow}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          following 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                            : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {following ? 'Following' : 'Follow'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Posts</h2>
            </div>

            {content.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600">
                  This creator hasn't posted any content yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {content.map((item) => {
                  const hasAccess = canViewContent(item);
                  
                  return (
                    <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Content Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <img
                            src={creator.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
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
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-700 mb-4">{item.description}</p>

                        {/* Content access indicator */}
                        <div className="flex items-center gap-2 mb-4">
                          {item.isSubscriberOnly && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              Subscribers Only
                            </span>
                          )}
                          {item.accessType === 'pay-per-view' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                          {hasAccess && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ Access Granted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Media */}
                      <div className="relative">
                        {hasAccess ? (
                          <div className="px-6 pb-6">
                            {item.mediaUrls && item.mediaUrls.length > 0 && (
                              <div className="rounded-lg overflow-hidden">
                                <Image
                                  src={item.mediaUrls[0].url}
                                  alt={item.title || 'Content'}
                                  width={800}
                                  height={600}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="px-6 pb-6">
                            <div className="relative">
                              {/* Blurred preview */}
                              {item.mediaUrls && item.mediaUrls.length > 0 && (
                                <div className="rounded-lg overflow-hidden relative">
                                  <Image
                                    src={item.mediaUrls[0].url}
                                    alt={item.title || 'Content preview'}
                                    width={800}
                                    height={600}
                                    className="w-full h-auto opacity-15"
                                  />
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                </div>
                              )}

                              {/* Access overlay */}
                              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 text-center border-2 border-dashed border-purple-300 mt-4">
                                <svg className="w-12 h-12 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                {item.isSubscriberOnly ? (
                                  <>
                                    <h4 className="text-lg font-semibold text-purple-900 mb-2">Subscribers Only</h4>
                                    <p className="text-purple-700 mb-4">
                                      Subscribe to {creator.name} to view this content
                                    </p>
                                    <button
                                      onClick={handleSubscribe}
                                      disabled={subscribing}
                                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                                    >
                                      {subscribing ? 'Subscribing...' : `Subscribe for $${creator.subscriptionPrice}/month`}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="text-lg font-semibold text-purple-900 mb-2">Premium Content</h4>
                                    <p className="text-purple-700 mb-4">
                                      Purchase this content to view it
                                    </p>
                                    <button
                                      onClick={() => handlePurchase(item._id, item.price)}
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Footer */}
                      <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-sm">{item.likeCount}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="text-sm">{item.commentCount}</span>
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
