'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { UserProfile } from '@/app/types/user';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function StatChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-3 bg-muted rounded-md">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/stats', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to load stats: ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary);
          setRecent(data.recentAttempts ?? []);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load stats');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4 border rounded-md">Loading stats...</div>
    );
  }
  if (error) {
    return (
      <div className="w-full p-4 border rounded-md bg-red-50 text-red-800 text-sm">{error}</div>
    );
  }
  if (!summary) return null;

  const xpProgress = Math.min(100, Math.round((summary.xp / Math.max(1, summary.xpToNextLevel)) * 100));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Level" value={summary.level} />
        <StatChip label="XP" value={`${summary.xp} / ${summary.xpToNextLevel}`} />
        <StatChip label="Coins" value={summary.coins} />
        <StatChip label="Accuracy" value={`${summary.accuracy}%`} />
      </div>

      <div className="w-full bg-muted rounded-full h-2" aria-label="XP Progress">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${xpProgress}%` }} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent attempts</p>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 border rounded-md text-sm">
                <div>Quiz: <span className="font-medium">{a.quizId}</span></div>
                <div>Score: <span className="font-medium">{a.score}%</span></div>
                <div>Correct: {a.correctAnswers}/{a.totalQuestions}</div>
                <div className="text-muted-foreground">{a.completedAt ? new Date(a.completedAt).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { currentUser, profile, isLoading, updateProfile, signOut } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth');
    }
    
    // Initialize form data when profile is loaded
    if (profile) {
      setFormData({
        displayName: profile.displayName,
      });
    }
  }, [currentUser, isLoading, router, profile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await updateProfile.mutateAsync(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.push('/auth');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout
        header={<Navbar />}
        className="bg-background"
      >
        <div className="py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <p>Loading profile...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background"
    >
      <div className="py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="max-w-2xl w-full p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your account information
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4 text-sm">
              {success}
            </div>
          )}
          
{profile && (
            <div className="space-y-6">
              {/* Live Stats fetched from server */}
              <StatsPanel />
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                      <div suppressHydrationWarning={true}>
                        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                          Display Name
                        </label>
                        <Input
                          id="displayName"
                          name="displayName"
                          type="text"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit" disabled={updateProfile.isPending}>
                          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              displayName: profile.displayName,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold">{profile.displayName}</h2>
                        <p className="text-muted-foreground">{profile.email}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Level</p>
                          <p>{profile.level}</p>
                        </div>
                        <div>
                          <p className="font-medium">XP</p>
                          <p>{profile.xp} / {profile.xpToNextLevel}</p>
                        </div>
                        <div>
                          <p className="font-medium">Coins</p>
                          <p>{profile.coins}</p>
                        </div>
                        <div>
                          <p className="font-medium">Quizzes Taken</p>
                          <p>{profile.quizzesTaken}</p>
                        </div>
                      </div>
                      
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p>{new Date(profile.lastLoginAt).toLocaleDateString()}</p>
                  </div>
                  
                  <Button variant="destructive" onClick={handleSignOut} disabled={signOut.isPending}>
                    {signOut.isPending ? 'Signing Out...' : 'Sign Out'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
} 