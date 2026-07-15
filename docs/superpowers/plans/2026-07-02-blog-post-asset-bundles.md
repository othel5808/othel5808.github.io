# Blog Post Asset Bundles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 날짜 기반 글 폴더 안에서 Markdown, 선택적 커버, 본문 이미지와 GIF를 함께 관리하면서 공개 URL은 필수 frontmatter slug로 안정적으로 유지한다.

**Architecture:** 콘텐츠 loader는 `category/dated-folder/index.md`만 엔트리로 읽고 sibling `images/`는 Astro 자산 파이프라인에 맡긴다. `src/lib/blog.mjs`가 폴더 날짜·slug·중복을 검증하며, 콘텐츠 스키마와 두 렌더링 컴포넌트가 선택적 커버의 타입과 표시를 담당한다.

**Tech Stack:** Astro 5, Astro Content Collections, Markdown, Astro Assets, JavaScript ESM, Node test runner

---

## File structure

- Modify `src/content.config.ts`: `index.md` 전용 glob, 필수 slug, 선택적 image cover와 coverAlt 쌍 검증.
- Modify `src/lib/blog.mjs`: 날짜 폴더 파싱, frontmatter slug 사용, 날짜·중복 검증.
- Move `src/content/blog/**/*.md`: `category/YYYY-MM-DD title/index.md` 구조로 마이그레이션.
- Modify `src/components/BlogList.astro`: 선택적 커버 썸네일.
- Modify `src/pages/blog/[category]/[slug].astro`: 선택적 상세 커버.
- Modify `src/styles/global.css`: 목록·상세·Markdown 이미지 반응형 스타일.
- Modify `tests/site-structure.test.mjs`: 새 경로, slug, 날짜, 커버 계약과 빌드 검증.

### Task 1: Dated folder identity and validation

**Files:**

- Modify: `src/lib/blog.mjs`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing tests**

Replace the flat-ID fixtures with entries shaped like the production collection and add these assertions:

```js
const entry = {
  id: 'backend/2026-07-02 FastAPI 비동기 작업/index.md',
  data: {
    slug: 'fastapi-background-task',
    date: new Date('2026-07-02T00:00:00Z'),
    tags: ['FastAPI'],
  },
};

assert.deepEqual(getBlogIdentity(entry), {
  category: 'backend',
  slug: 'fastapi-background-task',
  folder: '2026-07-02 FastAPI 비동기 작업',
});
assert.doesNotThrow(() => validateBlogEntries([entry]));
assert.throws(
  () => validateBlogEntries([{ ...entry, data: { ...entry.data, date: new Date('2026-07-03') } }]),
  /folder date 2026-07-02 does not match/,
);
assert.throws(
  () => validateBlogEntries([entry, { ...entry, id: 'backend/2026-07-03 다른 글/index.md' }]),
  /duplicate blog slug/,
);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because `getBlogIdentity()` still accepts a string and `validateBlogEntries()` does not exist.

- [ ] **Step 3: Implement entry identity and validation**

Implement in `src/lib/blog.mjs`:

```js
const DATED_FOLDER = /^(\d{4}-\d{2}-\d{2})\s+.+$/u;

export function getBlogIdentity(entry) {
  const parts = entry.id.replace(/\.mdx?$/, '').split('/');
  const category = parts[0];
  const folder = parts.at(-1) === 'index' ? parts.at(-2) : parts.at(-1);
  return { category, slug: entry.data.slug, folder };
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
```

Update every utility call from `getBlogIdentity(entry.id)` to `getBlogIdentity(entry)` and invoke `validateBlogEntries(entries)` before category aggregation, filtering, paths, and related ranking.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

Expected: the dated-folder identity, mismatch, and duplicate tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog.mjs tests/site-structure.test.mjs
git commit -m "feat: validate dated blog post folders"
```

### Task 2: Migrate posts into dated bundles

**Files:**

- Modify: `src/content.config.ts`
- Move: `src/content/blog/backend/notes-on-astro.md` → `src/content/blog/backend/2026-05-02 Astro를 선택한 이유/index.md`
- Move: `src/content/blog/design/designing-document-navigation.md` → `src/content/blog/design/2026-06-18 긴 문서를 위한 사이드바 설계/index.md`
- Move: `src/content/blog/project/building-a-personal-site.md` → `src/content/blog/project/2026-06-30 나를 설명하는 개인 사이트 만들기/index.md`
- Move: `src/content/blog/project/writing-better-case-studies.md` → `src/content/blog/project/2026-04-12 좋은 케이스 스터디의 구조/index.md`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing structure and schema tests**

```js
test('posts use dated bundles and stable frontmatter slugs', async () => {
  for (const [path, slug] of [
    ['src/content/blog/backend/2026-05-02 Astro를 선택한 이유/index.md', 'notes-on-astro'],
    [
      'src/content/blog/design/2026-06-18 긴 문서를 위한 사이드바 설계/index.md',
      'designing-document-navigation',
    ],
    [
      'src/content/blog/project/2026-06-30 나를 설명하는 개인 사이트 만들기/index.md',
      'building-a-personal-site',
    ],
    [
      'src/content/blog/project/2026-04-12 좋은 케이스 스터디의 구조/index.md',
      'writing-better-case-studies',
    ],
  ]) {
    const source = await readFile(new URL(path, root), 'utf8');
    assert.match(source, new RegExp(`slug: ${slug}`));
  }
  const config = await readFile(new URL('src/content.config.ts', root), 'utf8');
  assert.match(config, /pattern:\s*['"]\*\*\/index\.\{md,mdx\}['"]/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because the dated `index.md` files and slug schema do not exist.

- [ ] **Step 3: Update the collection schema**

Change the schema callback to receive Astro's `image` helper:

```ts
schema: ({ image }) =>
  z
    .object({
      title: z.string(),
      date: z.coerce.date(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      desc: z.string(),
      lead: z.string(),
      tags: z.array(z.string()).default([]),
      readTime: z.string(),
      fresh: z.boolean().default(false),
      cover: image().optional(),
      coverAlt: z.string().min(1).optional(),
    })
    .superRefine((data, ctx) => {
      if (Boolean(data.cover) !== Boolean(data.coverAlt)) {
        ctx.addIssue({
          code: 'custom',
          message: 'cover and coverAlt must be provided together',
          path: data.cover ? ['coverAlt'] : ['cover'],
        });
      }
    }),
```

Set the loader pattern to `**/index.{md,mdx}` so image files and unrelated Markdown cannot become posts.

- [ ] **Step 4: Move each Markdown file and add its stable slug**

Keep all existing fields and body unchanged. For example:

```yaml
title: Astro를 선택한 이유
date: 2026-05-02
slug: notes-on-astro
```

- [ ] **Step 5: Verify collection sync and stable routes**

Run: `npx astro sync && npm test && npm run build`

Expected: collection validation passes and the existing four `/blog/<category>/<slug>/` routes remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/content/blog tests/site-structure.test.mjs
git commit -m "feat: bundle blog posts with dated folders"
```

### Task 3: Optional cover rendering and responsive images

**Files:**

- Modify: `src/components/BlogList.astro`
- Modify: `src/pages/blog/[category]/[slug].astro`
- Modify: `src/styles/global.css`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write failing rendering contract tests**

```js
test('blog list and detail render optional optimized covers', async () => {
  const list = await readFile(new URL('src/components/BlogList.astro', root), 'utf8');
  const detail = await readFile(new URL('src/pages/blog/[category]/[slug].astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  for (const source of [list, detail]) {
    assert.match(source, /import \{ Image \} from ['"]astro:assets['"]/);
    assert.match(source, /data\.cover/);
    assert.match(source, /data\.coverAlt/);
  }
  assert.match(styles, /\.post-cover/);
  assert.match(styles, /\.post-body img/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because neither component imports `Image` or renders covers.

- [ ] **Step 3: Render the list cover**

Import `Image` from `astro:assets`. Inside each `.post-row`, before the text column, render:

```astro
{
  post.data.cover && post.data.coverAlt && (
    <Image
      class="post-cover post-cover-thumb"
      src={post.data.cover}
      alt={post.data.coverAlt}
      width={240}
      height={150}
      loading="lazy"
    />
  )
}
```

- [ ] **Step 4: Render the detail cover**

Import `Image` and place this between the lead and `.post-body`:

```astro
{
  entry.data.cover && entry.data.coverAlt && (
    <Image
      class="post-cover post-cover-hero"
      src={entry.data.cover}
      alt={entry.data.coverAlt}
      layout="constrained"
      width={1200}
      loading="eager"
    />
  )
}
```

Do not pass a forced output `format`, so animated GIF inputs retain an animated fallback.

- [ ] **Step 5: Add responsive styles**

```css
.post-cover {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: cover;
}

.post-cover-thumb {
  width: 180px;
  aspect-ratio: 8 / 5;
  border-radius: 14px;
}

.post-cover-hero {
  width: 100%;
  margin: 2rem 0 0;
  border-radius: 18px;
}

.post-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.5rem auto;
  border-radius: 12px;
}

@media (max-width: 600px) {
  .post-cover-thumb {
    width: 100%;
  }
}
```

Adjust `.post-row` grid only when it contains `.post-cover-thumb`, using `:has(.post-cover-thumb)` so coverless existing posts keep the current columns.

- [ ] **Step 6: Run tests and build**

Run: `npm test && npm run build`

Expected: optional cover contracts pass and coverless posts still build.

- [ ] **Step 7: Commit**

```bash
git add src/components/BlogList.astro 'src/pages/blog/[category]/[slug].astro' src/styles/global.css tests/site-structure.test.mjs
git commit -m "feat: support colocated blog cover images"
```

### Task 4: Documentation and final verification

**Files:**

- Create: `docs/blog-authoring.md`
- Modify: `tests/site-structure.test.mjs`

- [ ] **Step 1: Write a failing authoring-guide test**

```js
test('blog authoring guide documents covers and animated GIFs', async () => {
  const guide = await readFile(new URL('docs/blog-authoring.md', root), 'utf8');
  assert.match(guide, /YYYY-MM-DD/);
  assert.match(guide, /\.\/images\/cover\.webp/);
  assert.match(guide, /\.\/images\/demo\.gif/);
  assert.match(guide, /slug:/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because `docs/blog-authoring.md` does not exist.

- [ ] **Step 3: Create the authoring guide**

Create `docs/blog-authoring.md` with this content:

````markdown
# 블로그 글 작성 방법

## 폴더 구조

```text
src/content/blog/<category>/<YYYY-MM-DD 자유로운 제목>/
├── index.md
└── images/
    ├── cover.webp
    ├── architecture.png
    └── demo.gif
```

## Frontmatter

```yaml
---
title: FastAPI 비동기 작업 처리
date: 2026-07-02
slug: fastapi-background-task
desc: FastAPI 비동기 작업 구성 방법을 정리합니다.
lead: API 응답과 장기 실행 작업을 분리합니다.
tags: [Python, FastAPI]
readTime: 7 MIN
fresh: true
cover: ./images/cover.webp
coverAlt: FastAPI 비동기 작업 처리 구조
---
```

`slug`는 소문자 영문, 숫자, 하이픈만 사용한다. 커버를 사용하면 `cover`와 `coverAlt`를 함께 작성한다.

## 본문 이미지

```md
![처리 구조](./images/architecture.png)
![실행 예시](./images/demo.gif)
```

PNG, JPEG, WebP와 애니메이션 GIF를 글 폴더의 `images/`에서 함께 관리한다. 이미지마다 내용을 설명하는 대체 텍스트를 작성한다.

## 확인

```bash
npm run build
```

빌드가 성공하면 날짜 폴더, frontmatter, 이미지 경로가 유효하다.
````

- [ ] **Step 4: Run all automated verification**

Run: `npm run format:check && npm test && npm run build && git diff --check`

Expected: formatting passes, all tests pass, 11 static pages build, and no whitespace errors exist.

- [ ] **Step 5: Browser verification**

At desktop 1280×720 and mobile 390×844, verify `/blog/` and `/blog/backend/notes-on-astro/` have no horizontal overflow and the coverless layout is unchanged. Verify category links still navigate and filter correctly.

- [ ] **Step 6: Commit**

```bash
git add docs/blog-authoring.md tests/site-structure.test.mjs
git commit -m "docs: explain blog post asset bundles"
```
