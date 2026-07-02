import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);

function createBlogFixtures() {
  return [
    {
      id: 'project/building-a-personal-site',
      filePath: 'src/content/blog/project/2026-06-30 나를 설명하는 개인 사이트 만들기/index.md',
      data: {
        slug: 'building-a-personal-site',
        date: new Date('2026-06-30T00:00:00Z'),
        tags: ['포트폴리오', 'Astro', '정보 설계'],
      },
    },
    {
      id: 'design/designing-document-navigation',
      filePath: 'src/content/blog/design/2026-06-18 긴 문서를 위한 사이드바 설계/index.md',
      data: {
        slug: 'designing-document-navigation',
        date: new Date('2026-06-18T00:00:00Z'),
        tags: ['포트폴리오', '정보 설계', '내비게이션'],
      },
    },
    {
      id: 'backend/notes-on-astro',
      filePath: 'src/content/blog/backend/2026-05-02 Astro를 선택한 이유/index.md',
      data: {
        slug: 'notes-on-astro',
        date: new Date('2026-05-02T00:00:00Z'),
        tags: ['Astro', '성능', '콘텐츠'],
      },
    },
    {
      id: 'project/writing-better-case-studies',
      filePath: 'src/content/blog/project/2026-04-12 좋은 케이스 스터디의 구조/index.md',
      data: {
        slug: 'writing-better-case-studies',
        date: new Date('2026-04-12T00:00:00Z'),
        tags: ['포트폴리오', '글쓰기', '프로젝트'],
      },
    },
  ];
}

test('blog dated folder provides category while frontmatter provides the slug', async () => {
  const { getBlogIdentity } = await import('../src/lib/blog.mjs');
  const entry = createBlogFixtures()[2];
  assert.deepEqual(getBlogIdentity(entry), {
    category: 'backend',
    slug: 'notes-on-astro',
    folder: '2026-05-02 Astro를 선택한 이유',
  });
});

test('blog entries validate folder dates and duplicate slugs', async () => {
  const { validateBlogEntries } = await import('../src/lib/blog.mjs');
  const entries = createBlogFixtures();
  assert.doesNotThrow(() => validateBlogEntries(entries));
  assert.throws(
    () =>
      validateBlogEntries([
        { ...entries[0], data: { ...entries[0].data, date: new Date('2026-07-01') } },
      ]),
    /folder date 2026-06-30 does not match/,
  );
  assert.throws(
    () =>
      validateBlogEntries([
        entries[0],
        {
          ...entries[0],
          id: 'project/building-a-personal-site-copy',
          filePath: 'src/content/blog/project/2026-07-01 다른 글/index.md',
          data: { ...entries[0].data, date: new Date('2026-07-01') },
        },
      ]),
    /duplicate blog slug/,
  );
});

test('categories and filtered posts are derived from entry folders', async () => {
  const { getCategories, getPostsByCategory } = await import('../src/lib/blog.mjs');
  const entries = createBlogFixtures();
  assert.deepEqual(getCategories(entries), [
    { id: 'backend', name: '백엔드', count: 1 },
    { id: 'design', name: '디자인', count: 1 },
    { id: 'project', name: '프로젝트', count: 2 },
  ]);
  assert.equal(getPostsByCategory(entries, 'backend').length, 1);
});

test('folder based related posts exclude the current entry and rank shared tags first', async () => {
  const { getRelatedPosts } = await import('../src/lib/blog.mjs');
  const entries = createBlogFixtures();
  const related = getRelatedPosts(entries, entries[0].id, 3);
  assert.ok(related.every((entry) => entry.id !== entries[0].id));
  assert.equal(related[0].data.slug, 'designing-document-navigation');
});

test('blog content is stored in category folders with a validated collection', async () => {
  const config = await readFile(new URL('src/content.config.ts', root), 'utf8');
  assert.match(config, /glob\(\{\s*base:\s*['"]\.\/src\/content\/blog['"]/);
  assert.match(config, /pattern:\s*['"]\*\*\/index\.\{md,mdx\}['"]/);
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
    await access(new URL(path, root));
  }
});

test('blog sidebar and list use folder based category paths', async () => {
  const sidebar = await readFile(new URL('src/components/BlogSidebar.astro', root), 'utf8');
  const list = await readFile(new URL('src/components/BlogList.astro', root), 'utf8');
  assert.match(sidebar, /activeCategory/);
  assert.match(sidebar, /\/blog\/\$\{category\.id\}\//);
  assert.doesNotMatch(sidebar, /\?category=/);
  assert.match(list, /getPostPath/);
  assert.match(list, /getCategoryName/);
});

test('overall and category blog routes load the content collection', async () => {
  const overall = await readFile(new URL('src/pages/blog/index.astro', root), 'utf8');
  const category = await readFile(new URL('src/pages/blog/[category]/index.astro', root), 'utf8');
  assert.match(overall, /getCollection\(['"]blog['"]\)/);
  assert.match(overall, /BlogList/);
  assert.match(category, /getStaticPaths/);
  assert.match(category, /getPostsByCategory/);
  assert.match(category, /activeCategory/);
});

test('blog detail routes render markdown at category and slug paths', async () => {
  const detail = await readFile(new URL('src/pages/blog/[category]/[slug].astro', root), 'utf8');
  const related = await readFile(new URL('src/components/RelatedPosts.astro', root), 'utf8');
  const home = await readFile(new URL('src/pages/index.astro', root), 'utf8');
  assert.match(detail, /render\(entry\)/);
  assert.match(detail, /<Content\s*\/>/);
  assert.match(related, /getPostPath/);
  assert.match(home, /\/blog\/project\/building-a-personal-site\//);
  await assert.rejects(access(new URL('src/pages/blog/[slug].astro', root)));
  await assert.rejects(access(new URL('src/data/posts.mjs', root)));
});

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

test('blog authoring guide documents covers and animated GIFs', async () => {
  const guide = await readFile(new URL('docs/blog-authoring.md', root), 'utf8');
  assert.match(guide, /YYYY-MM-DD/);
  assert.match(guide, /\.\/images\/cover\.webp/);
  assert.match(guide, /\.\/images\/demo\.gif/);
  assert.match(guide, /slug:/);
});

test('site defines the requested primary navigation', async () => {
  const source = await readFile(new URL('src/data/site.ts', root), 'utf8');
  for (const href of ['/portfolio/', '/blog/', '/resume/']) {
    assert.match(source, new RegExp(href.replaceAll('/', '\\/')));
  }
});

test('portfolio contains a complete editable outline', async () => {
  const source = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  for (const id of ['intro', 'skills', 'projects', 'opensource', 'experience', 'contact']) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
});

test('all demo routes have source pages', async () => {
  for (const path of [
    'src/pages/index.astro',
    'src/pages/portfolio.astro',
    'src/pages/blog/index.astro',
    'src/pages/resume.astro',
  ]) {
    await access(new URL(path, root));
  }
});

test('Astro can statically generate every demo route', () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('portfolio uses presentation sections and a phone-only navigation control', async () => {
  const portfolio = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(portfolio, /portfolio-slide/);
  assert.match(portfolio, /engineering-projects/);
  assert.match(sidebar, /doc-nav-toggle/);
  assert.match(styles, /max-width:\s*600px/);
});

test('blog exposes category navigation, tags, and related content', async () => {
  const list = await readFile(new URL('src/pages/blog/index.astro', root), 'utf8');
  const post = await readFile(new URL('src/pages/blog/[category]/[slug].astro', root), 'utf8');
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  assert.match(list, /BlogSidebar/);
  assert.match(post, /RelatedPosts/);
  assert.match(post, /post-tags/);
  assert.match(sidebar, /sidebar-collapse/);
});

test('GitHub Pages deploys from main with free standard runners', async () => {
  const workflow = await readFile(new URL('.github/workflows/deploy.yml', root), 'utf8');
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /runs-on:\s*ubuntu-latest/g);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /withastro\/action@v6/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.doesNotMatch(workflow, /larger|macos-|windows-/i);
});

test('portfolio navigation matches the blog sidebar and main content proportion', async () => {
  const sidebar = await readFile(new URL('src/components/DocumentSidebar.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(sidebar, /sidebar-content/);
  assert.doesNotMatch(sidebar, /items\.map\(\(item, index\)/);
  assert.doesNotMatch(sidebar, /padStart/);
  assert.match(styles, /--portfolio-content-max:\s*1120px/);
  assert.match(styles, /(?:^|\n)\s*height:\s*calc\(100vh - 74px\)/);
});

test('resume uses the shared full-height responsive sidebar', async () => {
  const resume = await readFile(new URL('src/pages/resume.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  assert.match(resume, /resume-layout/);
  assert.match(resume, /resume-main/);
  assert.match(styles, /\.resume-layout \.doc-sidebar/);
  assert.match(styles, /\.resume-main/);
});

test('portfolio presents a compact Python backend and data engineering profile', async () => {
  const portfolio = await readFile(new URL('src/pages/portfolio.astro', root), 'utf8');
  const styles = await readFile(new URL('src/styles/global.css', root), 'utf8');
  for (const technology of [
    'Python',
    'Django',
    'FastAPI',
    'PostgreSQL',
    'Airflow',
    'Kafka',
    'AWS',
  ]) {
    assert.match(portfolio, new RegExp(technology));
  }
  assert.match(portfolio, /tech-matrix/);
  assert.equal((portfolio.match(/class="engineering-project"/g) ?? []).length, 3);
  assert.match(portfolio, /developer-portfolio/);
  assert.match(styles, /\.developer-portfolio/);
});
