# Afterline Collector — Chrome Extension

웹 페이지에서 문장을 드래그하면 작은 `[+ AFTERLINE]` 버튼이 떠요. 누르면 그
문장이 Afterline의 quotes에 바로 저장됩니다. 페이지 URL 기준으로 article 출처가
자동 생성되거나 기존 출처에 묶입니다.

## 한 번만 — 설치

1. 이 폴더(`extension/`)를 로컬에 받아두세요. (레포 전체 클론해도 OK)
2. 크롬에서 `chrome://extensions` 열기
3. 오른쪽 위 **"개발자 모드"** 토글 켜기
4. **"압축해제된 확장 프로그램 로드"** 클릭 → `extension/` 폴더 선택
5. 설치되면 옵션 페이지가 자동으로 열려요. 안 열리면 확장 아이콘 클릭.
6. Afterline의 [/settings](https://afterline-pi.vercel.app/settings)에서
   **Personal Token** 복사 → 옵션 페이지의 PERSONAL TOKEN 칸에 붙여넣고
   **SAVE**.

## 사용

- 아무 페이지에서 문장 드래그 → 우측 하단에 `[+ AFTERLINE]` 버튼
- 클릭 → "SAVED ✓" 가 뜨면 끝. Afterline의 그 article 출처에 quote가 쌓여요.
- 에러가 뜨면 토큰이 잘못됐거나 만료됐을 가능성 — `/settings`에서 토큰 다시
  확인 후 옵션에 붙여넣으세요.

## 동작 원리

- 확장 → `POST /api/quick-add` 호출 (`Authorization: Bearer <토큰>`)
- 서버: 토큰으로 사용자 확인 → URL로 출처(article) 찾거나 생성 → quote 저장
- 토큰의 `last_used_at`이 갱신돼서 settings에서 사용 흔적을 볼 수 있어요

## 로컬 개발 시

옵션의 ENDPOINT를 `http://localhost:3000`으로 바꾸면 로컬 dev 서버로 호출합니다.
