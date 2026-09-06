# 응급실 스마트 퇴원 안내 MVP

의료진이 진료 내용을 입력하면 AI가 DB의 질환별 안내문을 추천합니다. 의료진이 내용을 직접 확인하고 승인한 후에만 환자 링크와 QR이 발급됩니다.

## 로컬 실행

```bash
./run.sh
```

브라우저에서 `http://localhost:8501`로 접속합니다. API Key 없이 시험하려면 `데모 모드`를 켭니다.

## 주요 화면

- `퇴원 안내문 작성`: 진료 내용 분석, 템플릿 선택, 의료진 수정·승인, QR 발급
- `질환별 콘텐츠 관리`: 안내 문구 등록·수정·활성화, 환자 화면 미리보기
- `?id=접근토큰`: 승인된 환자 안내문

## 환경변수

- `GEMINI_API_KEY`: Gemini API Key
- `GEMINI_MODEL`: 사용할 모델명. 기본값은 `gemini-2.5-flash`
- `APP_PASSWORD`: 의료진·콘텐츠 관리 화면 접근 비밀번호
- `PUBLIC_BASE_URL`: QR에 포함할 배포 서비스 주소
- `DATABASE_PATH`: SQLite DB 파일 경로

## Docker 배포

DB가 재배포 후에도 유지되도록 `/data`에 영구 볼륨을 연결합니다.

```bash
docker build -t er-discharge-mvp .
docker run --rm -p 8501:8501 \
  -e GEMINI_API_KEY=replace-with-your-key \
  -e APP_PASSWORD=replace-with-a-long-staff-password \
  -e PUBLIC_BASE_URL=https://your-service.example.com \
  -v er-discharge-data:/data \
  er-discharge-mvp
```

실제 병원 사용 전에는 의사용·콘텐츠 관리 화면에 병원 인증을 연결하고, 병원 내부의 개인정보 및 의료 콘텐츠 검수 절차를 거쳐야 합니다.

## 문서

- [MVP 요구사항 분석서](docs/requirements/mvp-requirements.md)
- [전체 제품 구상](docs/product/product-concept.md)
- [MVP 기술 설계서](docs/architecture/mvp-technical-design.md)
- [개발 및 Git 작업 방식](CONTRIBUTING.md)
