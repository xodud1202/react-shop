# react-shop

`react-shop`은 Next.js App Router 기반 쇼핑몰 프론트엔드 프로젝트입니다.  
백엔드 호출은 `/api` 프록시를 통해 `spring-back-end`로 전달되며, 공개 페이지 캐시와 인증 페이지 동적 호출을 분리해 구성합니다.

## 실행 환경

- Node.js: 프로젝트 로컬 환경 기준
- Port: `3014`
- Backend URL 기본값: `http://localhost:3010`

## 실행 명령

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

개발 서버 실행 후 기본 접속 주소는 `http://127.0.0.1:3014` 입니다.

## 주요 구조

- `src/app`
  - App Router 페이지와 라우트 세그먼트 상태 컴포넌트
- `src/domains`
  - 도메인별 API, 컴포넌트, 타입, 유틸
- `src/shared`
  - 공통 서버 fetch 계층, 클라이언트 API helper, 공통 UI/SEO 유틸

## 현재 현대화 기준

- 공개 데이터는 공통 서버 fetch 계층에서 `revalidate`/`tag` 기반 캐시 사용
- 인증/개인화 데이터는 `no-store` 정책 유지
- 브라우저 API가 없는 컴포넌트는 서버 컴포넌트 우선
- 클라이언트 mutation은 공통 `shopClientApi` helper를 통해 처리

## 검증 기준

아래 세 명령이 모두 성공하면 기본 검증 완료로 간주합니다.

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```
