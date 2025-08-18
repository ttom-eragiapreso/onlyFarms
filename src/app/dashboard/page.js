'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    subscriberCount: 0,
    contentCount: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isCreator = session.user.role === 'creator';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session.user.name}! 👋
        </h1>
        <p className="text-base-content/60">
          {isCreator 
            ? "Here's your creator dashboard overview" 
            : "Discover amazing content from your favorite creators"
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isCreator ? (
          <>
            <div className="stat bg-primary text-primary-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title text-primary-content/80">Total Earnings</div>
              <div className="stat-value">${stats.totalEarnings.toFixed(2)}</div>
              <div className="stat-desc text-primary-content/60">This month</div>
            </div>

            <div className="stat bg-secondary text-secondary-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="stat-title text-secondary-content/80">Subscribers</div>
              <div className="stat-value">{stats.subscriberCount}</div>
              <div className="stat-desc text-secondary-content/60">Active subscribers</div>
            </div>

            <div className="stat bg-accent text-accent-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="stat-title text-accent-content/80">Content Posts</div>
              <div className="stat-value">{stats.contentCount}</div>
              <div className="stat-desc text-accent-content/60">Published content</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat bg-primary text-primary-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <div className="stat-title text-primary-content/80">Subscriptions</div>
              <div className="stat-value">{stats.subscriberCount}</div>
              <div className="stat-desc text-primary-content/60">Active subscriptions</div>
            </div>
          </>
        )}

        <div className="stat bg-info text-info-content rounded-lg">
          <div className="stat-figure">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div className="stat-title text-info-content/80">Messages</div>
          <div className="stat-value">{stats.unreadMessages}</div>
          <div className="stat-desc text-info-content/60">Unread messages</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {isCreator ? (
                <>
                  <Link href="/content/create" className="btn btn-primary w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Create New Content
                  </Link>
                  <Link href="/dashboard/analytics" className="btn btn-outline w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    View Analytics
                  </Link>
                  <Link href="/dashboard/subscribers" className="btn btn-outline w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                    Manage Subscribers
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/feed" className="btn btn-primary w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Browse Content
                  </Link>
                  <Link href="/creators" className="btn btn-outline w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Discover Creators
                  </Link>
                  <Link href="/subscriptions" className="btn btn-outline w-full justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    My Subscriptions
                  </Link>
                </>
              )}
              <Link href="/messages" className="btn btn-outline w-full justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 mr-2 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="badge badge-error badge-sm ml-auto">{stats.unreadMessages}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="text-center text-base-content/60 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-4 stroke-current opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p>No recent activity</p>
                <p className="text-sm">
                  {isCreator 
                    ? "Start creating content to see activity here"
                    : "Subscribe to creators to see activity here"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
