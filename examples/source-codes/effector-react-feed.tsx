import React, { useEffect } from 'react';
import { createStore, createEvent, createEffect, sample } from 'effector';
import { useUnit } from 'effector-react';

export interface FeedPost {
  id: string;
  author: string;
  content: string;
  likes: number;
}

// 1. Effector Model
export const postLiked = createEvent<string>('postLiked');
export const fetchFeedTriggered = createEvent<void>('fetchFeedTriggered');

export const loadPostsFx = createEffect<void, FeedPost[]>(async () => {
  return [
    { id: 'p1', author: 'Dan', content: 'Universal state graphs make complex apps trivial to debug!', likes: 12 },
    { id: 'p2', author: 'Sophie', content: 'AST-based flow extraction eliminates manual diagram syncing.', likes: 8 },
  ];
});

export const $posts = createStore<FeedPost[]>([], { name: '$posts' })
  .on(loadPostsFx.doneData, (_, posts) => posts)
  .on(postLiked, (posts, id) =>
    posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
  );

export const $isLoading = loadPostsFx.pending;

sample({
  clock: fetchFeedTriggered,
  target: loadPostsFx,
});

// 2. React View Layer Bound to Effector Units
export const SocialFeedView: React.FC = () => {
  const { posts, loading, onLike, onFetch } = useUnit({
    posts: $posts,
    loading: $isLoading,
    onLike: postLiked,
    onFetch: fetchFeedTriggered,
  });

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="p-4 bg-neutral-900 rounded-lg text-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm">Community Feed</h3>
        <button
          onClick={() => onFetch()}
          disabled={loading}
          className="px-2 py-1 bg-emerald-600 rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-emerald-400 text-xs font-semibold">@{post.author}</span>
              <button
                onClick={() => onLike(post.id)}
                className="text-xs bg-neutral-800 hover:bg-neutral-700 px-2 py-0.5 rounded text-amber-300"
              >
                ♥ {post.likes}
              </button>
            </div>
            <p className="text-xs text-neutral-300">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
