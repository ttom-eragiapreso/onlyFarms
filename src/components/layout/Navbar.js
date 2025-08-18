'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  const isCreator = session?.user?.role === 'creator';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {session && (
              <>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/feed">Feed</Link></li>
                <li><Link href="/messages">Messages</Link></li>
                {isCreator && (
                  <>
                    <li><Link href="/content/create">Create Content</Link></li>
                    <li><Link href="/dashboard/analytics">Analytics</Link></li>
                  </>
                )}
              </>
            )}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          <span className="text-primary">Only</span>Farms
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {session && (
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/dashboard" className="btn btn-ghost">Dashboard</Link></li>
            <li><Link href="/feed" className="btn btn-ghost">Feed</Link></li>
            <li><Link href="/messages" className="btn btn-ghost">Messages</Link></li>
            {isCreator && (
              <>
                <li><Link href="/content/create" className="btn btn-ghost">Create Content</Link></li>
                <li><Link href="/dashboard/analytics" className="btn btn-ghost">Analytics</Link></li>
              </>
            )}
          </ul>
        )}
      </div>

      <div className="navbar-end">
        {status === 'loading' ? (
          <div className="loading loading-spinner loading-sm"></div>
        ) : session ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="Profile"
                  src={session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.name}`}
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">
                <span>{session.user.name}</span>
                <span className="text-xs opacity-60 capitalize">{session.user.role}</span>
              </li>
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/settings">Settings</Link></li>
              {isCreator && (
                <>
                  <li><Link href="/dashboard/subscribers">Subscribers</Link></li>
                  <li><Link href="/dashboard/earnings">Earnings</Link></li>
                </>
              )}
              <div className="divider my-2"></div>
              <li><button onClick={handleSignOut}>Logout</button></li>
            </ul>
          </div>
        ) : (
          <div className="space-x-2">
            <Link href="/auth/login" className="btn btn-ghost">Login</Link>
            <Link href="/auth/register" className="btn btn-primary">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  );
}
