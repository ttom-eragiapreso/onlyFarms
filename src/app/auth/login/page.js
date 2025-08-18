'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold text-center justify-center mb-6">
              Welcome to OnlyFarms
            </h2>
            <p className="text-center text-base-content/60 mb-6">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control mt-6">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn btn-primary w-full"
                >
                  {loginLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            <div className="divider">OR</div>

            <button
              onClick={handleGoogleSignIn}
              className="btn btn-outline w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="text-center mt-4">
              <p className="text-sm">
                Don't have an account?{' '}
                <Link href="/auth/register" className="link link-primary">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
