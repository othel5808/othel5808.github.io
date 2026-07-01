const CATEGORY_NAMES = {
  backend: '백엔드',
  data: '데이터',
  design: '디자인',
  project: '프로젝트',
};

export function getBlogIdentity(id) {
  const clean = id.replace(/\.mdx?$/, '');
  const parts = clean.split('/');
  return { category: parts[0], slug: parts.at(-1) };
}

export function getCategoryName(id) {
  return CATEGORY_NAMES[id] ?? id;
}

export function sortPosts(entries) {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function getCategories(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const { category } = getBlogIdentity(entry.id);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => ({ id, name: getCategoryName(id), count }));
}

export function getPostsByCategory(entries, category) {
  return sortPosts(entries.filter((entry) => getBlogIdentity(entry.id).category === category));
}

export function getPostPath(entry) {
  const { category, slug } = getBlogIdentity(entry.id);
  return `/blog/${category}/${slug}/`;
}

export function getRelatedPosts(entries, currentId, limit = 3) {
  const current = entries.find((entry) => entry.id === currentId);
  if (!current) return [];

  const currentCategory = getBlogIdentity(current.id).category;
  return entries
    .filter((entry) => entry.id !== current.id)
    .map((entry) => ({
      entry,
      score:
        (getBlogIdentity(entry.id).category === currentCategory ? 1 : 0) +
        entry.data.tags.filter((tag) => current.data.tags.includes(tag)).length * 2,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
    .slice(0, limit)
    .map(({ entry }) => entry);
}
