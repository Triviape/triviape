import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChallengeFriendDialog } from '@/app/components/social/ChallengeFriendDialog';
import type { Friend } from '@/app/types/social';

const sendChallengeMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/hooks/useFriends', () => ({
  useChallenges: () => ({
    sendChallenge: sendChallengeMock,
    isSending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  Wrapper.displayName = 'ChallengeFriendWrapper';
  return Wrapper;
}

const baseFriend: Friend = {
  userId: 'friend-uid-1',
  displayName: 'Taylor',
  level: 3,
  isOnline: true,
  mutualFriends: 1,
  friendsSince: new Date().toISOString(),
  showStats: true,
  showActivity: true,
  allowChallenges: true,
};

describe('ChallengeFriendDialog', () => {
  beforeEach(() => {
    sendChallengeMock.mockClear();
  });

  it('invokes sendChallenge with daily quiz id, friend id, and trimmed message then closes', async () => {
    const onOpenChange = jest.fn();
    render(
      <ChallengeFriendDialog friend={baseFriend} open onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() },
    );

    fireEvent.change(screen.getByLabelText(/message \(optional\)/i), {
      target: { value: 'Good luck!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send challenge/i }));

    await waitFor(() => {
      expect(sendChallengeMock).toHaveBeenCalledTimes(1);
    });

    expect(sendChallengeMock).toHaveBeenCalledWith({
      toUserId: 'friend-uid-1',
      quizId: 'daily',
      message: 'Good luck!',
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
