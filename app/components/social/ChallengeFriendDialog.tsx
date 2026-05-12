'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Loader2, Send, Swords } from 'lucide-react';
import { useChallenges } from '@/app/hooks/useFriends';
import { Friend } from '@/app/types/social';

/** Default quiz for social quick-challenges (matches challenge/page.tsx). */
const DEFAULT_CHALLENGE_QUIZ_ID = 'daily';

interface ChallengeFriendDialogProps {
  friend: Friend | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChallengeFriendDialog({
  friend,
  open,
  onOpenChange,
}: ChallengeFriendDialogProps) {
  const [message, setMessage] = useState('');
  const { sendChallenge, isSending } = useChallenges();

  useEffect(() => {
    if (!open) {
      setMessage('');
    }
  }, [open]);

  const handleSend = async () => {
    if (!friend?.userId || !friend.allowChallenges) {
      return;
    }
    try {
      await sendChallenge({
        toUserId: friend.userId,
        quizId: DEFAULT_CHALLENGE_QUIZ_ID,
        message: message.trim() ? message.trim() : undefined,
      });
      onOpenChange(false);
      setMessage('');
    } catch (error) {
      console.error('Error sending challenge from social:', error);
    }
  };

  const canChallenge = !!(friend?.allowChallenges && friend?.userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Challenge friend
          </DialogTitle>
          <DialogDescription>
            Send a head-to-head challenge on today&apos;s daily-style quiz ({DEFAULT_CHALLENGE_QUIZ_ID}).
          </DialogDescription>
        </DialogHeader>

        {friend && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
              <AvatarFallback>{friend.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">{friend.displayName}</div>
              <div className="text-xs text-muted-foreground">
                {canChallenge ? 'Ready when they are.' : 'Challenges disabled for this player.'}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="social-challenge-message">
            Message (optional)
          </label>
          <Textarea
            id="social-challenge-message"
            placeholder="Optional note…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            disabled={!canChallenge || isSending}
          />
          <p className="text-xs text-muted-foreground">
            Manage all challenges from{' '}
            <Link href="/challenge" className="text-primary underline">
              Challenge Arena
            </Link>
            .
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSend()} disabled={!canChallenge || isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send challenge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
