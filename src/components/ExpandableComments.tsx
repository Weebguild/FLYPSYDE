import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp, query, orderByChild } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { Comment } from '../types';

interface Props {
  postId: string;
  groupCode: string;
}

const ExpandableComments: React.FC<Props> = ({ postId, groupCode }) => {
  const { currentUser, userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const commentsRef = ref(db, `feeds/${groupCode}/${postId}/comments`);
    const q = query(commentsRef, orderByChild('timestamp'));

    const unsubscribe = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const data: Comment[] = [];
        snapshot.forEach(child => {
          const val = child.val();
          data.push({
            id: child.key as string,
            ...val,
            timestamp: new Date(val.timestamp || Date.now())
          });
        });
        setComments(data);
      } else {
        setComments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, groupCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !userProfile) return;

    if (navigator.vibrate) navigator.vibrate(20);

    const commentsRef = ref(db, `feeds/${groupCode}/${postId}/comments`);
    
    await push(commentsRef, {
      userId: currentUser.uid,
      userName: userProfile.displayName,
      text: inputText.trim(),
      timestamp: serverTimestamp(),
      parentCommentId: replyingTo ? replyingTo.id : null
    });

    setInputText('');
    setReplyingTo(null);
  };

  const handleReplyClick = (commentId: string, userName: string) => {
    setReplyingTo({ id: commentId, name: userName });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  // Group comments into threads
  const rootComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  const CommentNode = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const replies = getReplies(comment.id);
    
    return (
      <div style={{ 
        marginTop: '0.8rem', 
        paddingLeft: isReply ? '1rem' : '0',
        borderLeft: isReply ? '2px solid var(--surface-container-highest)' : 'none'
      }}>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--on-surface)' }}>{comment.userName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{timeAgo(comment.timestamp)}</span>
            </div>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--on-surface)', wordBreak: 'break-word' }}>
              {comment.text}
            </p>
            <button 
              onClick={() => handleReplyClick(comment.id, comment.userName)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', fontSize: '0.75rem', padding: 0, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reply
            </button>
          </div>
        </div>
        
        {/* Render nested replies recursively */}
        {replies.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            {replies.map(reply => (
              <CommentNode key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      marginTop: '1rem', 
      padding: '1rem', 
      background: 'var(--surface-container-lowest)', 
      borderRadius: '8px',
      border: '1px solid var(--outline-variant)'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
        COMMENTS ({comments.length})
      </h4>
      
      {loading ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center' }}>Loading...</div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', textAlign: 'center', marginBottom: '1rem' }}>
          No comments yet. Start the trash talk!
        </div>
      ) : (
        <div style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {rootComments.map(comment => (
            <CommentNode key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        {replyingTo && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'var(--surface-container-high)', padding: '0.4rem 0.8rem', 
            borderRadius: '8px 8px 0 0', fontSize: '0.75rem', color: 'var(--on-surface-variant)'
          }}>
            <span>Replying to <strong>{replyingTo.name}</strong></span>
            <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'var(--surface-container)', 
              border: '1px solid var(--outline-variant)',
              borderRadius: replyingTo ? '0 0 8px 8px' : '8px', 
              padding: '0.8rem', 
              color: 'var(--on-surface)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            style={{ 
              background: inputText.trim() ? 'var(--primary)' : 'var(--surface-container-high)', 
              border: 'none', 
              color: 'var(--background)', 
              padding: '0 1rem', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpandableComments;
