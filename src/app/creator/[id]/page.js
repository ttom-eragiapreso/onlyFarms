'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import SubscriptionModal from '@/components/SubscriptionModal';
import Link from 'next/link';

export default function CreatorProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [following, setFollowing] = useState(false);

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
        setIsSubscribed(creatorData.isSubscribed);
        setFollowing(creatorData.isFollowing);
      }
      
      // Fetch creator's content
      const contentResponse = await fetch(`/api/content?creatorId=${id}`);
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

  const handleSubscribe = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
    fetchCreatorProfile(); // Refresh to show updated content
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
                      {isSubscribed ? (
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
                          className="w-full btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 border-0 hover:shadow-lg"
                        >
                          Subscribe for ${creator.subscriptionPrice}/month
                        </button>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <span className="text-blue-800 font-medium">Free Content</span>
                        </div>
                      )}
                      
                      <button
                        onClick={handleFollow}
                        className={`w-full btn ${following 
                          ? 'btn-ghost border-gray-300' 
                          : 'btn-outline btn-primary'
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isSubscribed || creator.subscriptionPrice === 0 ? 'Posts' : 'Preview'}
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

                    {/* Content Media */}
                    {(isSubscribed || creator.subscriptionPrice === 0 || !item.isSubscriberOnly) ? (
                      <div className="px-6 pb-6">
                        {item.mediaUrl && (
                          <div className="rounded-lg overflow-hidden">
                            {item.mediaType === 'image' ? (
                              <img
                                src={item.mediaUrl}
                                alt={item.title || 'Content'}
                                className="w-full h-auto"
                              />
                            ) : (
                              <video
                                src={item.mediaUrl}
                                controls
                                className="w-full h-auto"
                              >
                                Your browser does not support the video tag.
                              </video>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-6 pb-6">
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8 text-center border-2 border-dashed border-purple-300">
                          <svg className="w-12 h-12 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <h4 className="text-lg font-semibold text-purple-900 mb-2">Subscribers Only</h4>
                          <p className="text-purple-700 mb-4">
                            Subscribe to {creator.name} to view this content
                          </p>
                          <button
                            onClick={handleSubscribe}
                            className="btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 border-0"
                          >
                            Subscribe for ${creator.subscriptionPrice}/month
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content Footer */}
                    <div className="px-6 py-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm">{item.likes || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">{item.comments || 0}</span>
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
