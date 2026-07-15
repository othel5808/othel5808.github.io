# 블로그 글 작성 방법

## 폴더 구조

글 하나와 글에서 사용하는 이미지를 같은 날짜 폴더에서 관리합니다.

```text
src/content/blog/<category>/<YYYY-MM-DD 자유로운 제목>/
├── index.md
└── images/
    ├── cover.webp
    ├── architecture.png
    └── demo.gif
```

폴더 제목은 한글이나 영문으로 자유롭게 작성할 수 있지만 `YYYY-MM-DD `로 시작해야 합니다. 폴더 날짜와 frontmatter의 `date`는 같아야 합니다.

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

`slug`는 공개 URL에 사용하며 소문자 영문, 숫자, 하이픈만 허용합니다. 폴더명이나 게시일을 바꾸더라도 기존 링크를 유지하려면 `slug`는 변경하지 않습니다.

커버는 선택 사항입니다. 사용할 때는 `cover`와 `coverAlt`를 반드시 함께 작성합니다. 커버가 없으면 두 필드를 모두 생략합니다.

## 본문 이미지와 GIF

Markdown 상대경로로 `images/` 폴더의 파일을 사용합니다.

```md
![처리 구조](./images/architecture.png)

![실행 예시](./images/demo.gif)
```

PNG, JPEG, WebP와 애니메이션 GIF를 지원합니다. 모든 이미지에는 내용을 설명하는 대체 텍스트를 작성합니다. GIF를 정적 포맷으로 강제 변환하지 않으므로 애니메이션이 유지됩니다.

## 확인

글을 추가한 다음 전체 빌드를 실행합니다.

```bash
npm run build
```

빌드가 성공하면 날짜 폴더, frontmatter 형식, slug와 이미지 경로가 유효합니다.
