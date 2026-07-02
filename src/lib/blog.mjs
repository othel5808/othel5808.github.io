const CATEGORY_NAMES = {
  backend: '백엔드',
  data: '데이터',
  design: '디자인',
  project: '프로젝트',
};

const DATED_FOLDER = /^(\d{4}-\d{2}-\d{2})\s+.+$/u;

export function getBlogIdentity(entry) {
  const clean = (entry.filePath ?? entry.id).replace(/\.mdx?$/, '');
  const parts = clean.split('/');
  const blogIndex = parts.lastIndexOf('blog');
  const contentParts = blogIndex >= 0 ? parts.slice(blogIndex + 1) : parts;
  const folder = contentParts.at(-1) === 'index' ? contentParts.at(-2) : contentParts.at(-1);
  return { category: contentParts[0], slug: entry.data.slug, folder };
}

export function validateBlogEntries(entries) {
  const seen = new Set();

  for (const entry of entries) {
    const { category, slug, folder } = getBlogIdentity(entry);
    const match = folder.match(DATED_FOLDER);
    if (!match) throw new Error(`blog folder must start with YYYY-MM-DD: ${folder}`);

    const entryDate = entry.data.date.toISOString().slice(0, 10);
    if (match[1] !== entryDate) {
      throw new Error(`folder date ${match[1]} does not match frontmatter date ${entryDate}`);
    }

    const key = `${category}/${slug}`;
    if (seen.has(key)) throw new Error(`duplicate blog slug: ${key}`);
    seen.add(key);
  }

  return entries;
}

export function getCategoryName(id) {
  return CATEGORY_NAMES[id] ?? id;
}

export function sortPosts(entries) {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function getCategories(entries) {
  validateBlogEntries(entries);
  const counts = new Map();
  for (const entry of entries) {
    const { category } = getBlogIdentity(entry);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => ({ id, name: getCategoryName(id), count }));
}

export function getPostsByCategory(entries, category) {
  validateBlogEntries(entries);
  return sortPosts(entries.filter((entry) => getBlogIdentity(entry).category === category));
}

export function getPostPath(entry) {
  validateBlogEntries([entry]);
  const { category, slug } = getBlogIdentity(entry);
  return `/blog/${category}/${slug}/`;
}

export function getRelatedPosts(entries, currentId, limit = 3) {
  validateBlogEntries(entries);
  const current = entries.find((entry) => entry.id === currentId);
  if (!current) return [];

  const currentCategory = getBlogIdentity(current).category;
  return entries
    .filter((entry) => entry.id !== current.id)
    .map((entry) => ({
      entry,
      score:
        (getBlogIdentity(entry).category === currentCategory ? 1 : 0) +
        entry.data.tags.filter((tag) => current.data.tags.includes(tag)).length * 2,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
    .slice(0, limit)
    .map(({ entry }) => entry);
}
