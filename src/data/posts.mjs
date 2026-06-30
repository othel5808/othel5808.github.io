export const POSTS = [
  {
    slug: 'building-a-personal-site',
    date: '2026.06.30',
    title: '나를 설명하는 개인 사이트 만들기',
    desc: '포트폴리오와 블로그 사이에서 정보 구조를 정리한 과정.',
    category: '프로젝트',
    tags: ['포트폴리오', 'Astro', '정보 설계'],
    readTime: '6 MIN',
    fresh: true,
    lead: '포트폴리오와 블로그가 서로 경쟁하지 않고 하나의 이야기가 되도록 정보 구조를 정리했습니다.',
  },
  {
    slug: 'designing-document-navigation',
    date: '2026.06.18',
    title: '긴 문서를 위한 사이드바 설계',
    desc: '맥락을 잃지 않으면서 콘텐츠에 집중하게 만드는 탐색 방식.',
    category: '디자인',
    tags: ['포트폴리오', '정보 설계', '내비게이션'],
    readTime: '4 MIN',
    lead: '좋은 목차는 사용자가 현재 위치를 잃지 않게 하면서도 본문보다 앞서지 않습니다.',
  },
  {
    slug: 'notes-on-astro',
    date: '2026.05.02',
    title: 'Astro를 선택한 이유',
    desc: '개인 사이트에서 콘텐츠 중심 도구가 주는 단순함.',
    category: '개발',
    tags: ['Astro', '성능', '콘텐츠'],
    readTime: '5 MIN',
    lead: '콘텐츠 사이트에는 적게 보내고 빠르게 읽히는 도구가 잘 어울립니다.',
  },
  {
    slug: 'writing-better-case-studies',
    date: '2026.04.12',
    title: '좋은 케이스 스터디의 구조',
    desc: '결과보다 판단의 과정을 잘 보여주는 프로젝트 글쓰기.',
    category: '프로젝트',
    tags: ['포트폴리오', '글쓰기', '프로젝트'],
    readTime: '7 MIN',
    lead: '좋은 케이스 스터디는 무엇을 만들었는지보다 왜 그렇게 만들었는지를 보여줍니다.',
  },
];

export function getRelatedPosts(slug, limit = 3) {
  const current = POSTS.find((post) => post.slug === slug);
  if (!current) return [];
  return POSTS.filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 1 : 0) +
        post.tags.filter((tag) => current.tags.includes(tag)).length * 2,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((item) => item.post);
}

export function getCategories() {
  return [...new Set(POSTS.map((post) => post.category))].map((name) => ({
    name,
    count: POSTS.filter((post) => post.category === name).length,
  }));
}
