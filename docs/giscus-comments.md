# giscus 댓글 설정

블로그 글 상세 페이지에는 GitHub Discussions 기반 댓글 도구인 giscus를 사용합니다.

## 적용 위치

댓글은 글 상세 페이지인 `src/pages/blog/[category]/[slug].astro`에만 표시합니다. 포트폴리오와 이력서 페이지에는 댓글을 붙이지 않습니다.

## GitHub에서 준비할 것

1. 저장소 `othel5808/othel5808.github.io`가 public인지 확인합니다.
2. GitHub 저장소의 **Settings → Features → Discussions**를 활성화합니다.
3. [giscus.app](https://giscus.app/)에서 저장소를 입력하고 giscus GitHub App을 설치합니다.
4. Discussion category는 처음에는 `General`을 사용해도 됩니다.
5. giscus.app에서 생성된 `repo-id`와 `category-id` 값을 복사합니다.

## 환경 변수

로컬에서는 `.env` 파일에 다음 값을 넣습니다.

```env
PUBLIC_GISCUS_REPO=othel5808/othel5808.github.io
PUBLIC_GISCUS_REPO_ID=복사한_repo_id
PUBLIC_GISCUS_CATEGORY=General
PUBLIC_GISCUS_CATEGORY_ID=복사한_category_id
```

GitHub Pages 배포에서도 같은 `PUBLIC_GISCUS_*` 값이 빌드 시점에 필요합니다. GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에 위 값을 등록하면 워크플로에서 사용할 수 있습니다.

## 매핑 방식

댓글은 `pathname` 기준으로 연결합니다. 예를 들어 `/blog/backend/fastapi-background-task/` 글은 해당 경로와 연결된 Discussion을 사용합니다.

글 폴더명이나 제목을 바꾸더라도 공개 URL의 `slug`를 유지하면 기존 댓글 연결도 유지됩니다.
