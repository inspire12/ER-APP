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

## 접속 주소

운영 서비스 주소: [https://sangwoo-hostital-project.vercel.app](https://sangwoo-hostital-project.vercel.app)

| 용도 | 로컬 주소 | 운영 주소 |
|---|---|---|
| 의료진 안내문 작성 | `http://localhost:3000/staff/discharges/new` | [바로가기](https://sangwoo-hostital-project.vercel.app/staff/discharges/new) |
| 질환별 콘텐츠 관리 | `http://localhost:3000/staff/content` | [바로가기](https://sangwoo-hostital-project.vercel.app/staff/content) |
| 의료진 로그인 | `http://localhost:3000/login` | [바로가기](https://sangwoo-hostital-project.vercel.app/login) |
| 환자 안내문 데모 | `http://localhost:3000/p/demo` | [바로가기](https://sangwoo-hostital-project.vercel.app/p/demo) |
| 승인된 환자 안내문 | `http://localhost:3000/p/{token}` | `https://sangwoo-hostital-project.vercel.app/p/{token}` |

루트 주소(`/`)에 접속하면 의료진 안내문 작성 화면으로 이동합니다.

## 사용법

### 1. 질환별 안내 콘텐츠 등록

1. `/staff/content`에 접속합니다.
2. 질환명, 환자 설명, 처방·치료 설명, 생활 관리법, 위험 신호와 검색 키워드를 입력합니다.
3. 내용을 검토한 뒤 저장합니다.

등록된 콘텐츠는 AI가 진료 내용과 맞는 안내문을 추천할 때 사용합니다. `DATABASE_URL`이 없는 데모 환경에서는 내장된 샘플 콘텐츠를 열람할 수 있지만 새 콘텐츠 저장은 할 수 없습니다.

### 2. 의료진 퇴원 안내문 생성

1. `/staff/discharges/new`에 접속합니다.
2. 진단명, 검사 소견, 진찰 소견과 처방 약물을 자유로운 문장으로 입력합니다.
3. DB나 Gemini API Key 없이 시험할 때는 `데모 모드`를 켭니다.
4. `AI로 안내문 초안 만들기`를 눌러 질환 안내문을 매핑합니다.
5. 생성된 초안을 의료진이 직접 수정하고 위험 신호를 포함한 전체 내용을 확인합니다.
6. 최종 확인 항목에 체크한 뒤 `승인 및 QR 발급`을 누릅니다.

승인이 끝나면 환자용 웹 링크와 같은 주소를 담은 QR코드가 함께 표시됩니다. 의료진 확인 전에는 환자 링크가 발급되지 않습니다.

### 3. 환자에게 안내문 전달

환자에게 링크를 문자로 보내거나 의료진 화면의 QR코드를 스캔하도록 안내합니다. 환자는 별도 앱 설치 없이 스마트폰 웹 브라우저에서 안내문을 읽을 수 있습니다.

현재 화면만 확인할 때는 `/p/demo`를 사용합니다. 실제 발급 링크는 `/p/{무작위 보안 토큰}` 형식이며 발급일로부터 30일간 유효합니다.

### 4. 데모와 실제 사용 구분

| 기능 | 데모 모드 | 실제 사용 |
|---|---|---|
| 안내문 화면 확인 | DB 없이 가능 | 가능 |
| AI 매핑 | 예제 결과 사용 | Gemini API 사용 |
| 콘텐츠 저장 | 불가 | PostgreSQL에 저장 |
| 환자 링크 발급 | `/p/demo` 사용 | 환자별 보안 토큰 발급 |
| 의료진 로그인 | 개발 환경에서 생략 가능 | 비밀번호 필수 |

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

### 최초 배포

1. Vercel CLI에 로그인하고 프로젝트를 연결합니다.

```bash
pnpm exec vercel login
pnpm exec vercel link
```

2. Vercel Marketplace에서 Neon PostgreSQL을 생성하고 이 프로젝트에 연결합니다. 연결되면 `DATABASE_URL`이 Vercel 환경변수에 자동으로 등록됩니다.
3. Vercel Project Settings에 `AUTH_SECRET`, `STAFF_PASSWORD`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NEXT_PUBLIC_BASE_URL`을 등록합니다.
4. DB 스키마와 기본 콘텐츠를 준비합니다.

```bash
pnpm exec vercel env pull .env.local
pnpm db:migrate
pnpm db:seed
```

5. 운영 배포를 실행합니다.

```bash
pnpm exec vercel deploy --prod
```

배포 후 발급된 `https://...vercel.app` 주소를 `NEXT_PUBLIC_BASE_URL`에 등록하고 다시 운영 배포해야 QR코드에 올바른 환자 주소가 들어갑니다.

### GitHub Actions 자동 배포

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
