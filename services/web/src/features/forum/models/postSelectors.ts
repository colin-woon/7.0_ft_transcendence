import type { ForumPost, ForumSort } from './post';

export function filterPosts(
  posts: ForumPost[],
  searchQuery: string,
  category: string
) {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory = category === 'All' || post.category === category;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      post.title.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

export function sortPosts(posts: ForumPost[], sort: ForumSort) {
  return [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    switch (sort) {
      case 'Top':
        return b.upvotes - a.upvotes;
      case 'New':
        return b.id - a.id;
      default:
        return 0;
    }
  });
}
