# 🎭 마피아 게임

실시간 멀티플레이어 마피아 게임

## 🔗 링크

- **서비스**: [https://mafia-online-web.vercel.app/entry](https://mafia-online-web.vercel.app/entry)
- **서버**: [https://github.com/JiNookk/mafia_server](https://github.com/JiNookk/mafia_server)

## 🛠 기술 스택

**Core**

- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS 4
- Socket.IO Client (WebSocket)

**특징**

- OpenAPI 스펙 기반 타입 자동 생성
- Playwright E2E 테스트

## 🏗 아키텍처

### 상태 관리

전역 상태 관리 라이브러리 없이 **Custom Hooks + Service Layer** 패턴으로 구현

```typescript
// Custom Hooks 기반 상태 관리
useGameState      // 게임 상태, 플레이어, 역할, 투표 통합 관리
useGameWebSocket  // 다중 채널 WebSocket 연결 및 재연결
useGameEvents     // 페이즈 변경, 플레이어 업데이트 이벤트 처리
useGameAction     // 투표, 능력 사용 등 게임 액션

// Service Layer
services/
├── game.ts       // 게임 API
├── rooms.ts      // 방 관리 API
└── auth.ts       // 인증 API
```

**선택 이유**

- 번들 크기 최적화
- 적절한 컴포넌트 구조로 Props drilling 없음
- React 기본 개념만으로 이해 가능

### WebSocket 전략

**다중 채널 동적 구독**

```typescript
// 역할/생존 여부에 따라 채널 동적 구독
channels =
  ["all", "events"] + // 기본
  "mafia" + // 살아있는 마피아만
  "dead"; // 사망한 플레이어만
```

**자동 재연결 (Exponential Backoff)**

```typescript
// 1초 → 2초 → 4초 → 8초 → 10초(최대)
const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
```

### API 타입 안정성

```bash
# OpenAPI → TypeScript 타입 자동 생성
npm run generate-types:prod
```

백엔드 API 스펙에서 타입 자동 생성으로 컴파일 타임 타입 검증

## 📂 구조

```
src/
├── app/              # Next.js Pages
│   ├── entry/        # 닉네임 설정
│   ├── lobby/        # 방 목록
│   └── rooms/        # 게임방/게임 플레이
├── hooks/            # Custom Hooks
├── services/         # API Service Layer
├── lib/              # API Client, Utils
└── types/            # 타입 정의 (자동 생성)
```

## 🚀 실행

```bash
# 환경 변수
NEXT_PUBLIC_API_URL=http://localhost:8080

# 개발
npm install
npm run dev

# 빌드
npm run build && npm start

# E2E 테스트
npm run test:e2e
```

## 🔑 주요 기능

- 실시간 방 생성/참여
- WebSocket 기반 실시간 게임 진행
- 역할별 차별화 UI (마피아/시민/의사/경찰)
- 페이즈 자동 전환 및 타이머
- 역할별 제한 채팅 (전체/마피아/사망자)
- 투표 및 특수 능력 시스템

## 👨‍💻 Contact

**오진욱** - ojin0611@gmail.com - [@ojin0611](https://github.com/ojin0611)
