'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { UserPreferences, PrivacySettings } from '@/app/types/user';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { currentUser, profile, isLoading, updatePreferences } = useAuth();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    soundEffects: true,
    musicVolume: 70,
    sfxVolume: 100,
    language: 'en',
    notifications: {
      dailyReminder: true,
      quizAvailable: true,
      friendActivity: true,
      teamActivity: true,
    },
    animationLevel: 'full',
  });
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    showOnLeaderboards: true,
    profileVisibility: 'public',
    shareActivityWithFriends: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth');
    }
    
    // Initialize form data when profile is loaded
    if (profile) {
      setPreferences(profile.preferences);
      setPrivacySettings(profile.privacySettings);
    }
  }, [currentUser, isLoading, router, profile]);
  
  const handlePreferencesChange = (
    key: keyof UserPreferences,
    value: any
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleNotificationChange = (
    key: keyof UserPreferences['notifications'],
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };
  
  const handlePrivacyChange = (
    key: keyof PrivacySettings,
    value: any
  ) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleSavePreferences = async () => {
    setError('');
    setSuccess('');
    
    try {
      await updatePreferences.mutateAsync(preferences);
      setSuccess('Preferences updated successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout
        header={<Navbar />}
        className="bg-background"
      >
        <div className="py-8 flex flex-col items-center justify-center min-h-[70vh]">
          <p>Loading settings...</p>
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
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Customize your app experience
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
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Theme</label>
                  <select 
                    value={preferences.theme}
                    onChange={(e) => handlePreferencesChange('theme', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Animation Level</label>
                  <select 
                    value={preferences.animationLevel}
                    onChange={(e) => handlePreferencesChange('animationLevel', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="full">Full</option>
                    <option value="reduced">Reduced</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Sound Effects</label>
                  <input 
                    type="checkbox"
                    checked={preferences.soundEffects}
                    onChange={(e) => handlePreferencesChange('soundEffects', e.target.checked)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Music Volume: {preferences.musicVolume}%
                  </label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.musicVolume}
                    onChange={(e) => handlePreferencesChange('musicVolume', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    SFX Volume: {preferences.sfxVolume}%
                  </label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={preferences.sfxVolume}
                    onChange={(e) => handlePreferencesChange('sfxVolume', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Daily Reminder</label>
                  <input 
                    type="checkbox"
                    checked={preferences.notifications.dailyReminder}
                    onChange={(e) => handleNotificationChange('dailyReminder', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quiz Available</label>
                  <input 
                    type="checkbox"
                    checked={preferences.notifications.quizAvailable}
                    onChange={(e) => handleNotificationChange('quizAvailable', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Friend Activity</label>
                  <input 
                    type="checkbox"
                    checked={preferences.notifications.friendActivity}
                    onChange={(e) => handleNotificationChange('friendActivity', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Team Activity</label>
                  <input 
                    type="checkbox"
                    checked={preferences.notifications.teamActivity}
                    onChange={(e) => handleNotificationChange('teamActivity', e.target.checked)}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Privacy</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show on Leaderboards</label>
                  <input 
                    type="checkbox"
                    checked={privacySettings.showOnLeaderboards}
                    onChange={(e) => handlePrivacyChange('showOnLeaderboards', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Online Status</label>
                  <input 
                    type="checkbox"
                    checked={privacySettings.showOnlineStatus}
                    onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Share Activity with Friends</label>
                  <input 
                    type="checkbox"
                    checked={privacySettings.shareActivityWithFriends}
                    onChange={(e) => handlePrivacyChange('shareActivityWithFriends', e.target.checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Allow Friend Requests</label>
                  <input 
                    type="checkbox"
                    checked={privacySettings.allowFriendRequests}
                    onChange={(e) => handlePrivacyChange('allowFriendRequests', e.target.checked)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Visibility</label>
                  <select 
                    value={privacySettings.profileVisibility}
                    onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={handleSavePreferences}
              disabled={updatePreferences.isPending}
              className="w-full"
            >
              {updatePreferences.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}