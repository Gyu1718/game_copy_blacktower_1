# 검은 종탑 아래

다크판타지 텍스트 로그라이크 웹게임 프로토타입입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시되는 주소로 접속하면 됩니다.

## 주요 파일

- `src/App.jsx`: 게임 로직과 화면 구조
- `src/App.css`: 화면 디자인
- `src/main.jsx`: React 앱 진입점

## 수정 포인트

- `INITIAL_PLAYER`: 플레이어 기본 능력치
- `MONSTERS`: 몬스터 목록
- `EVENTS`: 랜덤 이벤트와 선택지
- `explore()`: 탐험 및 조우 확률
- `attack()`: 전투 계산
- `updatePlayer()`: 사망, 광기, 타락, 엔딩 판정
