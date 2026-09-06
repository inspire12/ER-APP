# 개발 및 Git 작업 방식

## 기본 원칙

- `main`은 실행과 배포가 가능한 상태로 유지한다.
- 기능 개발은 `main`에서 분기한 별도 브랜치에서 진행한다.
- 기능 브랜치의 중간 커밋 수는 제한하지 않지만, `main`에는 기능당 한 개의 squash 커밋만 남긴다.
- 관련 없는 변경을 하나의 브랜치나 커밋에 섞지 않는다.

## 브랜치 이름

- 기능: `feature/<짧은-기능명>`
- 버그 수정: `fix/<짧은-문제명>`
- 문서: `docs/<짧은-문서명>`

예시:

```text
feature/patient-ui
feature/disease-content-manager
feature/stt-input
fix/qr-patient-link
```

## 작업 흐름

```bash
git switch main
git switch -c feature/patient-ui

# 기능 구현과 테스트
git add <관련 파일>
git commit -m "feat: improve patient guidance screen"

# 기능 완료 후 main에 한 커밋으로 반영
git switch main
git merge --squash feature/patient-ui
git commit -m "feat: improve patient guidance screen"
```

GitHub Pull Request를 사용하는 경우 `Squash and merge`를 선택한다.

## 커밋 메시지

- `feat:` 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 변경
- `refactor:` 동작 변경 없는 구조 개선
- `test:` 테스트 추가·수정
- `chore:` 설정과 도구 변경

하나의 완성된 기능과 그 기능에 필요한 코드·테스트·문서는 같은 squash 커밋에 포함할 수 있다.
