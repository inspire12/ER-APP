# 응급실 스마트 퇴원 안내 MVP

의료진이 진료 내용을 입력하면 AI가 DB의 검수된 질환 안내문을 추천합니다. 의료진이 내용을 직접 확인하고 승인한 후에만 환자 링크와 QR이 발급됩니다.

## 기술 구성

- Next.js App Router + TypeScript
- PostgreSQL + Drizzle ORM
- Gemini API
- GitHub Actions + Vercel

## 로컬 실행

```bash
cp .env.example .env.local
pnpm install
./run.sh
```

브라우저에서 `http://localhost:3000`으로 접속합니다. DB와 API Key 없이 UI를 확인하려면 작성 화면에서 `데모 모드`를 사용합니다.

## 주요 경로

- `/staff/discharges/new`: 의료진 안내문 작성·검토·승인
- `/staff/content`: 질환별 콘텐츠 관리
- `/p/demo`: 환자 안내문 데모
- `/p/{token}`: 승인된 환자 안내문

## 환경변수

- `DATABASE_URL`: PostgreSQL 접속 주소
- `GEMINI_API_KEY`: Gemini API Key
- `GEMINI_MODEL`: 기본값 `gemini-2.5-flash`
- `STAFF_PASSWORD`: 의료진 화면 접근 비밀번호
- `AUTH_SECRET`: 로그인 쿠키 서명 키
- `NEXT_PUBLIC_BASE_URL`: 환자 링크에 사용할 배포 주소

`DATABASE_URL`이 없으면 내장된 샘플 콘텐츠를 읽을 수 있지만 콘텐츠 저장과 실제 환자 안내문 발급은 제한됩니다.

PostgreSQL을 연결한 후 최초 1회 스키마와 기본 콘텐츠를 준비합니다.

```bash
pnpm db:migrate
pnpm db:seed
```

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Vercel CI/CD

GitHub에 다음 Secrets를 등록합니다.

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Repository variable `VERCEL_DEPLOY_ENABLED=true`를 설정하면 Pull Request는 Preview, `main`은 Production으로 배포됩니다. 설정 전에는 배포 작업이 안전하게 건너뛰어집니다.

애플리케이션 환경변수는 Vercel Project Settings에서 별도로 설정합니다.

## 기존 Streamlit 버전

이전 프로토타입은 `legacy/streamlit/`에 보존했습니다.

## 문서

- [전체 제품 구상](docs/product/product-concept.md)
- [MVP 요구사항 분석서](docs/requirements/mvp-requirements.md)
- [MVP 기술 설계서](docs/architecture/mvp-technical-design.md)
- [웹 전환·Vercel 배포 설계](docs/architecture/web-architecture-proposal.md)
- [Git 작업 방식](CONTRIBUTING.md)
