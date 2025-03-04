'use client';

import { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { login, register, logout } from '@/app/actions/authActions';
import { useFormState, useFormStatus } from 'react-dom';

// Initial states with the exact structure needed
const initialLoginState = {
  success: false,
  errors: {},
  error: undefined,
  redirectTo: undefined
};

const initialRegisterState = {
  success: false,
  errors: {},
  error: undefined,
  redirectTo: undefined
};

export default function AuthTestPage() {
  const { currentUser, isLoading, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Use the recommended Next.js pattern for Server Actions with useFormState
  const [loginState, loginAction] = useFormState(login, initialLoginState);
  const [registerState, registerAction] = useFormState(register, initialRegisterState);

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Current User Status</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
              <span>Loading...</span>
            </div>
          ) : currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="font-medium">Authenticated</span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">User ID:</span> {currentUser.uid}</p>
                <p><span className="font-medium">Email:</span> {currentUser.email}</p>
              </div>
              {profile && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <p className="font-medium mb-1">Profile Data:</p>
                  <p><span className="font-medium">Display Name:</span> {profile.displayName}</p>
                  <p><span className="font-medium">Level:</span> {profile.level}</p>
                  <p><span className="font-medium">XP:</span> {profile.xp}</p>
                  <p><span className="font-medium">Coins:</span> {profile.coins}</p>
                </div>
              )}
              <form action={logout} className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Not authenticated</span>
            </div>
          )}
        </div>
      </div>
      
      {!currentUser && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button 
              className={`px-4 py-2 flex-1 font-medium ${activeTab === 'login' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`px-4 py-2 flex-1 font-medium ${activeTab === 'register' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === 'login' ? (
              <form action={loginAction} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="your@email.com"
                  />
                  {loginState.errors?.email && (
                    <p className="text-red-500 text-xs mt-1">{loginState.errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="••••••••"
                  />
                  {loginState.errors?.password && (
                    <p className="text-red-500 text-xs mt-1">{loginState.errors.password}</p>
                  )}
                </div>
                
                {loginState.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {loginState.error}
                  </div>
                )}
                
                <SubmitButton>Sign In</SubmitButton>
              </form>
            ) : (
              <form action={registerAction} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Your Name"
                  />
                  {registerState.errors?.displayName && (
                    <p className="text-red-500 text-xs mt-1">{registerState.errors.displayName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="your@email.com"
                  />
                  {registerState.errors?.email && (
                    <p className="text-red-500 text-xs mt-1">{registerState.errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="••••••••"
                  />
                  {registerState.errors?.password && (
                    <p className="text-red-500 text-xs mt-1">{registerState.errors.password}</p>
                  )}
                </div>
                
                {registerState.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {registerState.error}
                  </div>
                )}
                
                <SubmitButton>Create Account</SubmitButton>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50"
      disabled={pending}
    >
      {pending ? 'Processing...' : children}
    </button>
  );
} 