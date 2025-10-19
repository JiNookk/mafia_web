# Mafia Game E2E Tests

이 디렉토리는 마피아 온라인 게임의 End-to-End 테스트를 포함합니다.

## 📁 테스트 파일 구조

```
e2e/
├── helpers/
│   └── test-utils.ts              # 테스트 헬퍼 함수 및 유틸리티
├── entry-lobby.spec.ts            # 인증 및 로비 테스트 (기존)
├── room.spec.ts                   # 방 생성 및 대기실 테스트 (기존)
├── game-start.spec.ts             # 게임 시작 테스트
├── game-flow.spec.ts              # 게임 진행 플로우 테스트
├── full-game-integration.spec.ts  # 전체 게임 통합 테스트
├── chat-permissions.spec.ts       # 채팅 권한 테스트
├── error-handling.spec.ts         # 에러 처리 테스트
└── README.md                      # 이 파일
```

## 🧪 테스트 카테고리

### 1. 인증 및 로비 (`entry-lobby.spec.ts`)
- ✅ 회원가입 플로우
- ✅ 닉네임 유효성 검증
- ✅ 로비 페이지 방 목록 표시
- ✅ 방 만들기 모달

### 2. 방 관리 (`room.spec.ts`)
- ✅ 방 생성 및 참여
- ✅ 대기실 플레이어 목록
- ✅ 호스트 권한 확인
- ✅ 채팅 기능
- ✅ 방 나가기

### 3. 게임 시작 (`game-start.spec.ts`)
- ✅ 8명 미만 게임 시작 불가
- ✅ 8명 게임 시작 성공
- ✅ 모든 플레이어 게임 페이지 리다이렉트
- ✅ 호스트 권한 확인
- ✅ API 실패 처리

### 4. 게임 진행 (`game-flow.spec.ts`)
- ✅ 직업 표시 확인
- ✅ NIGHT 페이즈 능력 사용
  - 마피아: 살해
  - 의사: 치료
  - 경찰: 조사
  - 시민: 능력 없음
- ✅ DAY 페이즈 밤 결과 확인
- ✅ VOTE 페이즈 투표 진행
- ✅ 죽은 플레이어 표시
- ✅ 채팅 기능
- ✅ 메모 기능
- ✅ 타이머 표시

### 5. 전체 게임 통합 (`full-game-integration.spec.ts`)
- ✅ Day 1 전체 사이클 (NIGHT → DAY → VOTE → RESULT)
- ✅ 시민 승리 시나리오
- ✅ 마피아 승리 시나리오
- ✅ WebSocket 시뮬레이션

### 6. 채팅 권한 (`chat-permissions.spec.ts`)
- ✅ NIGHT: 마피아 전용 채팅
- ✅ NIGHT: 일반 시민 전체 채팅
- ✅ DAY, VOTE: 생존자 전체 채팅
- ✅ 죽은 플레이어: 죽은 자 채팅
- ✅ DEFENSE: 최다 득표자만 채팅
- ✅ 채팅 메시지 전송 및 입력창 초기화

### 7. 에러 처리 (`error-handling.spec.ts`)
- ✅ 네트워크 오류
- ✅ API 500 에러
- ✅ 행동 등록 실패
- ✅ 죽은 플레이어 선택 방지
- ✅ 중복 행동 방지
- ✅ 세션 만료
- ✅ 잘못된 gameId
- ✅ 투표 현황 API 실패
- ✅ 채팅 전송 실패
- ✅ 방 나가기 실패

## 🚀 테스트 실행 방법

### 전제 조건
1. 백엔드 서버가 실행 중이어야 합니다 (`http://localhost:8080`)
2. 프론트엔드 개발 서버가 실행 중이거나, Playwright가 자동으로 시작합니다

### 모든 테스트 실행
```bash
npm run test:e2e
```

### UI 모드로 실행 (디버깅에 유용)
```bash
npm run test:e2e:ui
```

### 헤드리스가 아닌 모드로 실행 (브라우저 창 표시)
```bash
npm run test:e2e:headed
```

### 디버그 모드로 실행
```bash
npm run test:e2e:debug
```

### 특정 테스트 파일만 실행
```bash
npx playwright test e2e/game-flow.spec.ts
```

### 특정 테스트만 실행
```bash
npx playwright test -g "게임 페이지 로드 시 내 직업이 표시되어야 함"
```

## 🛠️ 테스트 작성 가이드

### 테스트 헬퍼 함수 사용

`e2e/helpers/test-utils.ts`에는 다음과 같은 유틸리티 함수들이 있습니다:

```typescript
// 플레이어 생성
const players = await createPlayers(context, 8);

// 직업 배정
assignRoles(players); // 마피아 2, 의사 1, 경찰 1, 시민 4

// API 모킹
await mockGameState(players, gameId, 'NIGHT', 1);
await mockMyRole(player, gameId);
await mockGamePlayers(players, gameId);
await mockRegisterAction(player, gameId);
await mockVoteStatus(players, gameId, dayCount, votes);

// 정리
await closePlayers(players);
```

### 새 테스트 추가하기

1. `e2e/` 디렉토리에 `*.spec.ts` 파일 생성
2. 테스트 헬퍼 함수 임포트
3. `test.describe()` 블록으로 테스트 그룹 정의
4. `test.beforeEach()`에서 설정
5. `test.afterEach()`에서 정리
6. `test()`로 개별 테스트 작성

예시:
```typescript
import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-utils';

test.describe('새로운 기능 테스트', () => {
  let players;

  test.beforeEach(async ({ context }) => {
    players = await createPlayers(context, 8);
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('새로운 기능이 작동해야 함', async () => {
    // 테스트 코드
  });
});
```

## 📊 테스트 커버리지

| 영역 | 커버리지 |
|------|----------|
| 인증 및 회원가입 | ✅ 100% |
| 로비 및 방 관리 | ✅ 100% |
| 대기실 | ✅ 100% |
| 게임 시작 | ✅ 100% |
| 게임 진행 (페이즈) | ✅ 90% |
| 채팅 권한 | ✅ 90% |
| 에러 처리 | ✅ 85% |

## ⚠️ 주의사항

### WebSocket 테스트
- 현재 테스트는 WebSocket을 직접 사용하지 않고 API 모킹으로 진행합니다
- 실제 WebSocket 통신이 필요한 경우, 백엔드 서버를 실행하고 모킹을 제거해야 합니다

### 타이밍 이슈
- `page.waitForTimeout()`은 최소한으로 사용하고, `page.waitForSelector()` 또는 `page.waitForURL()` 사용을 권장합니다
- 네트워크 요청이 완료될 때까지 기다리려면 `page.waitForResponse()` 사용

### API 모킹
- 테스트는 기본적으로 API를 모킹합니다
- 실제 백엔드 통합 테스트를 하려면 모킹 코드를 제거하세요

## 🐛 디버깅 팁

### 1. Playwright Inspector 사용
```bash
npm run test:e2e:debug
```

### 2. 스크린샷 확인
테스트 실패 시 자동으로 스크린샷이 저장됩니다:
```
test-results/
└── {test-name}/
    └── test-failed-1.png
```

### 3. 트레이스 뷰어
```bash
npx playwright show-trace test-results/{test-name}/trace.zip
```

### 4. 콘솔 로그 확인
```typescript
test('테스트', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  // ...
});
```

## 🔧 설정

Playwright 설정은 프로젝트 루트의 `playwright.config.ts`에 있습니다.

주요 설정:
- **baseURL**: `http://localhost:3000`
- **testDir**: `./e2e`
- **timeout**: 30000ms (30초)
- **retries**: CI에서 2회, 로컬에서 0회
- **workers**: CI에서 1개, 로컬에서 병렬

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

## 🤝 기여하기

새로운 테스트를 추가하거나 기존 테스트를 개선하려면:

1. 테스트를 작성합니다
2. `npm run test:e2e`로 테스트가 통과하는지 확인합니다
3. 테스트가 명확하고 의미 있는지 확인합니다
4. 이 README를 업데이트합니다 (필요한 경우)

## 📝 TODO

- [ ] WebSocket 실시간 통신 테스트 추가
- [ ] 게임 종료 화면 테스트
- [ ] 플레이어 재접속 시나리오 테스트
- [ ] 성능 테스트 (다수 플레이어)
- [ ] 모바일 반응형 테스트
- [ ] 접근성(a11y) 테스트
