# Folder-Based Blog Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Markdown 파일의 첫 번째 하위 폴더를 카테고리로 자동 인식하고 `/blog/[category]/[slug]/` 경로와 카테고리별 목록을 정적으로 생성한다.

**Architecture:** Astro 콘텐츠 컬렉션을 글의 단일 원본으로 사용한다. 순수 데이터 변환은 `src/lib/blog.mjs`에 두어 Node 테스트가 직접 검증하고, Astro 페이지는 `getCollection('blog')` 결과를 이 유틸리티에 전달해 전체 목록·카테고리 목록·상세 페이지를 생성한다.

**Tech Stack:** Astro 5, Astro Content Collections, Markdown, JavaScript ESM, Node test runner

---

## File structure

- Create `src/content.config.ts`: 블로그 컬렉션 loader와 frontmatter 스키마.
- Create `src/content/blog/<category>/*.md`: 카테고리 폴더별 Markdown 글.
- Create `src/lib/blog.mjs`: ID 파싱, 카테고리 집계, 정렬·필터, 관련 글 계산.
- Create `src/components/BlogList.astro`: 전체/카테고리 목록이 공유하는 글 행 마크업.
- Modify `src/components/BlogSidebar.astro`: 자동 집계 결과, 현재 카테고리, 중첩 URL 지원.
- Modify `src/components/RelatedPosts.astro`: 중첩 상세 URL 지원.
- Modify `src/pages/blog/index.astro`: 콘텐츠 컬렉션 기반 전체 목록.
- Create `src/pages/blog/[category]/index.astro`: 카테고리별 정적 목록.
- Create `src/pages/blog/[category]/[slug].astro`: Markdown 상세 페이지.
- Delete `src/pages/blog/[slug].astro`: 단일 slug 라우트 제거.
- Delete `src/data/posts.mjs`: 수동 데이터 원본 제거.
- Modify `src/pages/index.astro`: 중첩 글 URL 사용.
- Modify `tests/site-structure.test.mjs`: 새 콘텐츠 구조와 정적 경로 검증.

### Task 1: Pure blog metadata utilities

**Files:**

- Create: `src/lib/blog.mjs`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing tests for folder parsing, categories, filtering, and related posts**

Add fixtures with IDs such as `backend/notes-on-astro.md` and assertions:

```js
import {
  getBlogIdentity,
  getCategories,
  getPostsByCategory,
  getRelatedPosts,
} from '../src/lib/blog.mjs';

function createBlogFixtures() {
  return [
    {
      id: 'project/building-a-personal-site.md',
      data: { date: new Date('2026-06-30'), tags: ['포트폴리오', 'Astro', '정보 설계'] },
    },
    {
      id: 'design/designing-document-navigation.md',
      data: { date: new Date('2026-06-18'), tags: ['포트폴리오', '정보 설계', '내비게이션'] },
    },
    {
      id: 'backend/notes-on-astro.md',
      data: { date: new Date('2026-05-02'), tags: ['Astro', '성능', '콘텐츠'] },
    },
    {
      id: 'project/writing-better-case-studies.md',
      data: { date: new Date('2026-04-12'), tags: ['포트폴리오', '글쓰기', '프로젝트'] },
    },
  ];
}

test('blog folder is the category and the filename is the slug', () => {
  assert.deepEqual(getBlogIdentity('backend/notes-on-astro.md'), {
    category: 'backend',
    slug: 'notes-on-astro',
  });
});

test('categories and filtered posts are derived from entry folders', () => {
  const entries = createBlogFixtures();
  assert.deepEqual(getCategories(entries), [
    { id: 'backend', name: '백엔드', count: 1 },
    { id: 'design', name: '디자인', count: 1 },
    { id: 'project', name: '프로젝트', count: 2 },
  ]);
  assert.equal(getPostsByCategory(entries, 'backend').length, 1);
});

test('related posts exclude the current entry and rank shared tags first', () => {
  const entries = createBlogFixtures();
  const related = getRelatedPosts(entries, 'project/building-a-personal-site.md', 3);
  assert.ok(related.every((entry) => entry.id !== 'project/building-a-personal-site.md'));
  assert.equal(related[0].id, 'design/designing-document-navigation.md');
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `src/lib/blog.mjs` does not exist.

- [ ] **Step 3: Implement the smallest pure utility module**

Implement these exports in `src/lib/blog.mjs`:

```js
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
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

Expected: all utility tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog.mjs tests/site-structure.test.mjs
git commit -m "test: define folder based blog metadata"
```

### Task 2: Content collection and Markdown migration

**Files:**

- Create: `src/content.config.ts`
- Create: `src/content/blog/backend/notes-on-astro.md`
- Create: `src/content/blog/design/designing-document-navigation.md`
- Create: `src/content/blog/project/building-a-personal-site.md`
- Create: `src/content/blog/project/writing-better-case-studies.md`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write a failing source-structure test**

```js
test('blog content is stored in category folders with a validated collection', async () => {
  const config = await readFile(new URL('src/content.config.ts', root), 'utf8');
  assert.match(config, /glob\(\{ base: '\.\/src\/content\/blog'/);
  for (const path of [
    'src/content/blog/backend/notes-on-astro.md',
    'src/content/blog/design/designing-document-navigation.md',
    'src/content/blog/project/building-a-personal-site.md',
    'src/content/blog/project/writing-better-case-studies.md',
  ])
    await access(new URL(path, root));
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because the collection config and Markdown files do not exist.

- [ ] **Step 3: Add the collection schema**

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    desc: z.string(),
    lead: z.string(),
    tags: z.array(z.string()).default([]),
    readTime: z.string(),
    fresh: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 4: Move each existing post into Markdown**

Use the existing `POSTS` fields as frontmatter. Move the hardcoded detail body into each Markdown file, beginning with:

```md
---
title: Astro를 선택한 이유
date: 2026-05-02
desc: 개인 사이트에서 콘텐츠 중심 도구가 주는 단순함.
lead: 콘텐츠 사이트에는 적게 보내고 빠르게 읽히는 도구가 잘 어울립니다.
tags: [Astro, 성능, 콘텐츠]
readTime: 5 MIN
fresh: false
---

## 페이지는 무엇을 말해야 할까

개인 사이트를 시작할 때 가장 먼저 정한 것은 색이나 글꼴이 아니라 방문자가 어떤 사람으로 기억해야 하는지였습니다.
```

- [ ] **Step 5: Run tests and collection sync**

Run: `npm test && npx astro sync`

Expected: tests pass and Astro generates collection types without schema errors.

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/content/blog tests/site-structure.test.mjs
git commit -m "feat: migrate blog posts to content collections"
```

### Task 3: Automatic sidebar and shared list component

**Files:**

- Create: `src/components/BlogList.astro`
- Modify: `src/components/BlogSidebar.astro`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing component contract tests**

Assert that `BlogSidebar` accepts `activeCategory`, links to `/blog/${category.id}/`, and does not contain `?category=`. Assert that `BlogList` calls `getPostPath(entry)`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL on the old query-string links and missing `BlogList.astro`.

- [ ] **Step 3: Update the sidebar contract**

Use:

```ts
interface Category {
  id: string;
  name: string;
  count: number;
}
interface Props {
  categories: Category[];
  activeCategory?: string;
}
const { categories, activeCategory } = Astro.props;
```

Set the all-post link active only when `activeCategory` is absent. Render category links with `href={`/blog/${category.id}/`}` and active class when IDs match. Preserve the existing desktop collapse and mobile open/close script.

- [ ] **Step 4: Create `BlogList.astro`**

Accept `posts` collection entries, use `getPostPath`, `getCategoryName`, and `getBlogIdentity`, and move the current `.post-row` markup into this component. Format `entry.data.date` as `YYYY.MM.DD`.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test`

Expected: all component contract tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/BlogList.astro src/components/BlogSidebar.astro tests/site-structure.test.mjs
git commit -m "feat: generate blog category navigation"
```

### Task 4: Overall and category list routes

**Files:**

- Modify: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[category]/index.astro`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing route tests**

Assert that both pages call `getCollection('blog')`, the category route exports `getStaticPaths`, filters with `getPostsByCategory`, and passes `activeCategory` to `BlogSidebar`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because the current index imports `POSTS` and the category route is missing.

- [ ] **Step 3: Convert the overall list**

In `src/pages/blog/index.astro`, load and sort entries:

```ts
const posts = sortPosts(await getCollection('blog'));
const categories = getCategories(posts);
```

Render `<BlogSidebar categories={categories} />` and `<BlogList posts={posts} />`.

- [ ] **Step 4: Add category static paths**

In `src/pages/blog/[category]/index.astro`, create one path per derived category:

```ts
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return getCategories(posts).map((category) => ({
    params: { category: category.id },
    props: { posts, categories: getCategories(posts), category },
  }));
}
```

Filter props with `getPostsByCategory`, reuse the overall list layout, and pass `activeCategory={category.id}`.

- [ ] **Step 5: Verify routes**

Run: `npm test && npm run build`

Expected: `/blog/backend/`, `/blog/design/`, and `/blog/project/` are generated; no category page displays all four posts.

- [ ] **Step 6: Commit**

```bash
git add src/pages/blog/index.astro 'src/pages/blog/[category]/index.astro' tests/site-structure.test.mjs
git commit -m "feat: add static blog category pages"
```

### Task 5: Nested Markdown detail routes and link migration

**Files:**

- Create: `src/pages/blog/[category]/[slug].astro`
- Delete: `src/pages/blog/[slug].astro`
- Delete: `src/data/posts.mjs`
- Modify: `src/components/RelatedPosts.astro`
- Modify: `src/pages/index.astro`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing nested-detail tests**

Assert that the nested page calls `render(entry)`, `getPostPath` is used by related posts, old `src/pages/blog/[slug].astro` and `src/data/posts.mjs` do not exist, and home links include category segments.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because the old route and manual data source still exist.

- [ ] **Step 3: Create the nested detail page**

Generate one path per entry using `getBlogIdentity(entry.id)`, calculate related entries with the pure utility, render Markdown via:

```ts
const { Content } = await render(entry);
```

Preserve the existing hero, tags, related-posts section, and back button. Put `<Content />` inside `.post-body`.

- [ ] **Step 4: Update related and home links**

Change `RelatedPosts.astro` to accept collection entries and use `getPostPath(post)`. Update the two home-page sample links to `/blog/project/building-a-personal-site/` and `/blog/design/designing-document-navigation/`.

- [ ] **Step 5: Remove the old route and data array**

Delete `src/pages/blog/[slug].astro` and `src/data/posts.mjs` only after all imports have moved to the collection utilities.

- [ ] **Step 6: Run tests and build**

Run: `npm test && npm run build`

Expected: tests pass; four nested detail routes build; no old flat detail route is generated.

- [ ] **Step 7: Commit**

```bash
git add src/pages/blog src/components/RelatedPosts.astro src/pages/index.astro src/data/posts.mjs tests/site-structure.test.mjs
git commit -m "feat: render nested markdown blog posts"
```

### Task 6: Responsive browser verification and final checks

**Files:**

- Modify if required: `src/styles/global.css`
- Modify if required: `tests/site-structure.test.mjs`

- [ ] **Step 1: Run the complete automated verification**

Run: `npm run format:check && npm test && npm run build && git diff --check`

Expected: formatting passes, all tests pass, all expected static routes build, and no whitespace errors exist.

- [ ] **Step 2: Verify desktop category behavior**

At 1280×720, open `/blog/`, click `백엔드`, and verify URL `/blog/backend/`, one backend post, backend active state, fixed left sidebar, and no horizontal overflow.

- [ ] **Step 3: Verify mobile category behavior**

At 390×844, verify the category menu starts closed, opens from the small floating button, closes after selecting a category, navigates to the filtered page, and has no horizontal overflow.

- [ ] **Step 4: Verify a Markdown detail page**

Open `/blog/backend/notes-on-astro/` and verify the Markdown headings/body, tags, related posts, and back link render correctly.

- [ ] **Step 5: Apply only evidence-backed layout fixes**

If browser inspection reveals overflow or hidden controls, first add a failing structural assertion when possible, then make the smallest CSS/component change and repeat Steps 1–4.

- [ ] **Step 6: Commit final verification fixes**

```bash
git add src/styles/global.css tests/site-structure.test.mjs
git commit -m "fix: polish responsive blog category navigation"
```
