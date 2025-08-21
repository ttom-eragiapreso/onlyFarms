'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../../components/forms';

export default function DiscoverCreators() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (session) {
      fetchCreators();
    }
  }, [status, session, router]);

  useEffect(() => {
    filterCreators();
  }, [creators, searchQuery, selectedTags]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators');
      
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators);
        
        // Extract unique tags from all creators' content
        const tags = new Set();
        data.creators.forEach(creator => {
          if (creator.contentTags) {
            creator.contentTags.forEach(tag => tags.add(tag));
          }
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCreators = () => {
    let filtered = creators;

    // Search by name
    if (searchQuery) {
      filtered = filtered.filter(creator =>
        creator.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(creator =>
        creator.contentTags && creator.contentTags.some(tag =>
          selectedTags.includes(tag)
        )
      );
    }

    setFilteredCreators(filtered);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFollow = async (creatorId) => {
    setFollowing(prev => ({ ...prev, [creatorId]: true }));
    
    try {
      const response = await fetch(`/api/creators/${creatorId}/follow`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreators(prev => prev.map(creator =>
          creator._id === creatorId
            ? { ...creator, isFollowing: data.isFollowing, followerCount: data.followerCount }
            : creator
        ));
      }
    } catch (error) {
      console.error('Error following creator:', error);
    } finally {
      setFollowing(prev => ({ ...prev, [creatorId]: false }));
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Discover <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Creators</span>
          </h1>
          <p className="text-xl text-gray-600">
            Find amazing creators and explore their content
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search creators by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="modern"
                className="pl-10"
              />
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Filter by Content Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredCreators.length} Creator{filteredCreators.length !== 1 ? 's' : ''} Found
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div key={creator._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Cover Image */}
                  <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                    {creator.coverImage && (
                      <img
                        src={creator.coverImage}
                        alt={`${creator.name}'s cover`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Profile Image */}
                    <div className="absolute -bottom-12 left-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white bg-white">
                        <img
                          src={creator.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="pt-16 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{creator.name}</h3>
                        <p className="text-gray-600 text-sm">@{creator.username || creator.name.toLowerCase().replace(/\s+/g, '')}</p>
                      </div>
                      
                      <button
                        onClick={() => handleFollow(creator._id)}
                        disabled={following[creator._id]}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                          creator.isFollowing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md'
                        }`}
                      >
                        {following[creator._id] ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading...
                          </div>
                        ) : creator.isFollowing ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </button>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{creator.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
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
                        {creator.contentCount || 0} posts
                      </div>
                    </div>

                    {/* Content Tags */}
                    {creator.contentTags && creator.contentTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {creator.contentTags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                        {creator.contentTags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                            +{creator.contentTags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subscription Info */}
                    {creator.subscriptionPrice && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Monthly subscription</span>
                          <span className="text-lg font-bold text-purple-700">
                            ${creator.subscriptionPrice.toFixed(2)}/mo
                          </span>
                        </div>
                      </div>
                    )}

                    {/* View Profile Button */}
                    <Link
                      href={`/creator/${creator._id}`}
                      className="block w-full text-center py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
