'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { 
  Send, 
  Loader2, 
  MessageCircle,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useMessages, useStartConversation } from '@/app/hooks/useFriends';
import { useAuth } from '@/app/hooks/useAuth';
import { Friend, Conversation, DirectMessage } from '@/app/types/social';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface MessageDialogProps {
  friend: Friend | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageDialog({ friend, open, onOpenChange }: MessageDialogProps) {
  const { currentUser } = useAuth();
  const { startConversation } = useStartConversation();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, isSending } = useMessages(conversation?.id || null);

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && friend && !conversation) {
      setIsInitializing(true);
      startConversation(friend.userId)
        .then(conv => {
          setConversation(conv);
          setIsInitializing(false);
        })
        .catch(err => {
          console.error('Error starting conversation:', err);
          setIsInitializing(false);
        });
    }
  }, [open, friend, conversation, startConversation]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setConversation(null);
      setMessageInput('');
    }
  }, [open]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when conversation loads
  useEffect(() => {
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !friend || isSending) return;

    try {
      await sendMessage({
        recipientId: friend.userId,
        content: messageInput.trim(),
      });
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const renderMessage = (message: DirectMessage, index: number, allMessages: DirectMessage[]) => {
    const isOwn = message.senderId === currentUser?.uid;
    const showAvatar = !isOwn && (
      index === 0 || allMessages[index - 1]?.senderId !== message.senderId
    );

    return (
      <div
        key={message.id}
        className={cn(
          'flex items-end gap-2 mb-2',
          isOwn ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8">
            {showAvatar && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.senderAvatarUrl} />
                <AvatarFallback>
                  {message.senderDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'max-w-[70%] rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-xs',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && (
              message.isRead ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground/70" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            {friend && (
              <>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatarUrl} />
                    <AvatarFallback>
                      {friend.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {friend.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{friend.displayName}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {friend.isOnline ? 'Online' : (
                      friend.lastSeen ? `Last seen ${formatDistanceToNow(new Date(friend.lastSeen), { addSuffix: true })}` : 'Offline'
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {isInitializing || isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Send a message to {friend?.displayName}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full px-6 py-4" ref={scrollRef}>
              {messages.map((msg, idx) => renderMessage(msg, idx, messages))}
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSendMessage}
          className="border-t px-4 py-3 flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isInitializing || isSending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!messageInput.trim() || isInitializing || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
