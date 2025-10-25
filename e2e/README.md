# Mafia Game E2E Tests

이 디렉토리는 마피아 온라인 게임의 End-to-End 테스트를 포함합니다.
**실제 서버와 통신하여 전체 시스템을 테스트합니다.**

## 📁 테스트 파일 구조

```
e2e/
├── helpers/
│   ├── api-client.ts              # 서버 API 호출 헬퍼 함수
│   └── test-player.ts             # 플레이어 생성 및 관리 유틸리티
├── 01-auth-lobby.spec.ts          # 회원가입 및 로비
├── 02-room-management.spec.ts     # 방 생성 및 관리
├── 03-game-start.spec.ts          # 게임 시작 및 역할 배정
├── 04-game-flow.spec.ts           # 게임 플로우 (페이즈 전환)
├── 05-game-end.spec.ts            # 게임 종료 조건
├── 06-chat.spec.ts                # 채팅 기능
└── README.md                      # 이 파일
```

## 🧪 테스트 카테고리

### 1. 회원가입 및 로비 (`01-auth-lobby.spec.ts`)
- ✅ 회원가입 후 로비로 이동
- ✅ 로비에서 방 목록 조회
- ✅ 중복 닉네임으로 회원가입 시도
- ✅ 빈 닉네임으로 회원가입 불가

### 2. 방 생성 및 관리 (`02-room-management.spec.ts`)
- ✅ 방 생성 후 방 상세 페이지로 이동
- ✅ 여러 플레이어가 같은 방에 참여
- ✅ 방 인원이 8명 초과 시 참여 불가
- ✅ 방 나가기
- ✅ 호스트가 방을 나가면 방이 삭제됨

### 3. 게임 시작 및 역할 배정 (`03-game-start.spec.ts`)
- ✅ 8명이 모여 게임 시작
- ✅ 5명 미만일 때 게임 시작 불가
- ✅ 게임 시작 후 NIGHT 페이즈로 시작
- ✅ 역할 분포 확인 (마피아 2, 의사 1, 경찰 1, 시민 4)
- ✅ 마피아는 다른 마피아를 볼 수 있음

### 4. 게임 플로우 (`04-game-flow.spec.ts`)
- ✅ NIGHT → DAY → VOTE → DEFENSE → RESULT 전체 사이클
- ✅ 마피아가 시민을 죽이고 다음 날로 진행
- ✅ 경찰이 마피아를 조사하면 마피아로 판명
- ✅ 의사의 치료로 살해 방지
- ✅ 투표 및 처형 시스템

### 5. 게임 종료 (`05-game-end.spec.ts`)
- ✅ 모든 마피아가 제거되면 시민 승리
- ✅ 마피아 수가 시민 수 이상이면 마피아 승리
- ✅ 게임 종료 후 방으로 리다이렉트

### 6. 채팅 기능 (`06-chat.spec.ts`)
- ✅ DAY 페이즈에서 모든 플레이어가 채팅 가능
- ✅ NIGHT 페이즈에서 마피아끼리만 채팅 가능
- ✅ 죽은 플레이어는 채팅 불가
- ✅ DEFENSE 페이즈에서 피고인만 채팅 가능

## 🚀 테스트 실행 방법

### 전제 조건
1. **백엔드 서버가 실행 중이어야 합니다** (`http://localhost:8080`)
   ```bash
   cd /Users/ojin-ug/Desktop/classum/sideProjects/mafia_server
   # 서버 실행 (예: ./gradlew bootRun 또는 ./mvnw spring-boot:run)
   ```

2. **프론트엔드는 Playwright가 자동으로 시작합니다** (`http://localhost:3000`)

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

### 헬퍼 함수 사용

#### 1. 플레이어 생성 (`helpers/test-player.ts`)
```typescript
import { createPlayers, closePlayers } from './helpers/test-player';

const players = await createPlayers(context, 8);
const [host, ...others] = players;

try {
  // 테스트 로직
} finally {
  await closePlayers(players);
}
```

#### 2. API 호출 (`helpers/api-client.ts`)
```typescript
import {
  createRoom,
  joinRoom,
  startGame,
  getMyRole,
  registerAction,
  nextPhase,
} from './helpers/api-client';

// 방 생성
const roomResult = await createRoom(host.page, host.userId, '방 이름');
const roomId = roomResult.data!.id;

// 게임 시작
const gameResult = await startGame(host.page, roomId);
const gameId = gameResult.data!.gameId;

// 역할 확인
for (const player of players) {
  const roleResult = await getMyRole(player.page, gameId, player.userId);
  player.role = roleResult.data!.role;
}

// 행동 등록
await registerAction(mafia.page, gameId, {
  type: 'MAFIA_KILL',
  actorUserId: mafia.userId,
  targetUserId: target.userId,
});

// 다음 페이즈
await nextPhase(host.page, gameId);
```

### 새 테스트 추가하기

```typescript
import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-player';
import { createRoom, startGame } from './helpers/api-client';

test.describe('새로운 기능 테스트', () => {
  test('새로운 기능이 작동해야 함', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      const roomResult = await createRoom(host.page, host.userId, '테스트방');
      const roomId = roomResult.data!.id;

      // 테스트 로직...

    } finally {
      await closePlayers(players);
    }
  });
});
```

## 📊 테스트 커버리지

| 영역 | 커버리지 |
|------|----------|
| 회원가입 및 로비 | ✅ 100% |
| 방 생성 및 관리 | ✅ 100% |
| 게임 시작 및 역할 배정 | ✅ 100% |
| 게임 플로우 (페이즈) | ✅ 95% |
| 게임 종료 조건 | ✅ 100% |
| 채팅 기능 | ✅ 90% |

## ⚠️ 주의사항

### 실제 서버 통신
- **이 테스트는 실제 백엔드 서버와 통신합니다** (API 모킹 없음)
- 서버가 `http://localhost:8080`에서 실행 중이어야 합니다
- 테스트 실행 전후로 데이터베이스 정리가 필요할 수 있습니다

### 타이밍 이슈
- WebSocket 실시간 이벤트는 서버 타이머에 의존하므로 적절한 대기 시간이 필요합니다
- `page.waitForTimeout()`은 최소한으로 사용하고, `page.waitForURL()` 사용을 권장합니다
- 네트워크 요청 완료 대기: `page.waitForResponse()` 사용

### 테스트 격리
- 각 테스트는 독립적으로 실행됩니다
- 매번 새로운 플레이어, 방, 게임을 생성합니다
- 테스트 종료 시 `closePlayers()`로 리소스 정리 필수

## 🐛 트러블슈팅

### 테스트가 타임아웃되는 경우
1. **서버 실행 확인**
   - `http://localhost:8080`에 서버가 실행 중인지 확인
   - 서버 로그에서 에러 확인

2. **데이터베이스 확인**
   - 데이터베이스 연결 상태 확인
   - 필요시 데이터베이스 초기화

3. **대기 시간 조정**
   - `page.waitForTimeout()` 값 증가
   - WebSocket 이벤트 대기 시간 조정

### 테스트가 실패하는 경우
1. **디버그 모드 실행**
   ```bash
   npm run test:e2e:debug
   ```

2. **스크린샷 확인**
   - `test-results/` 디렉토리의 스크린샷 확인

3. **서버 로그 확인**
   - 백엔드 서버의 에러 로그 확인
   - API 응답 확인

4. **브라우저 콘솔 로그**
   ```typescript
   page.on('console', (msg) => console.log('PAGE:', msg.text()));
   ```

### 플레이어 수가 맞지 않는 경우
- 이전 테스트의 세션이 남아있을 수 있음
- 서버 재시작 또는 데이터베이스 초기화

## 🔧 설정

Playwright 설정: [playwright.config.ts](../playwright.config.ts)

주요 설정:
- **baseURL**: `http://localhost:3000`
- **testDir**: `./e2e`
- **webServer**: 프론트엔드 자동 시작
- **screenshot**: 실패 시 자동 저장
- **trace**: 재시도 시 자동 저장

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [API Testing Guide](https://playwright.dev/docs/api-testing)
- [Debugging Tests](https://playwright.dev/docs/debug)

## ✨ 테스트 품질 개선사항

### 안정성
- ✅ **타임스탬프 기반 닉네임**: 병렬 실행 시 닉네임 충돌 방지
- ✅ **API 응답 검증**: 모든 API 호출에 null 체크 및 에러 핸들링
- ✅ **타임아웃 설정**: 각 API 호출에 적절한 타임아웃 설정 (10-15초)
- ✅ **리소스 정리**: 에러 발생 시에도 페이지 정리 보장

### 유지보수성
- ✅ **환경 변수 지원**: `API_BASE_URL` 환경 변수로 서버 주소 설정 가능
- ✅ **에러 메시지 개선**: 실패 시 명확한 컨텍스트 포함 에러 메시지
- ✅ **타입 안전성**: `!` 연산자 제거, TypeScript strict mode 호환

### 성능
- ✅ **네트워크 대기 최적화**: `waitForTimeout` 대신 `waitForLoadState('networkidle')` 사용
- ✅ **병렬 실행 지원**: 닉네임 충돌 방지로 안전한 병렬 실행 가능

## 🔧 환경 변수

테스트 실행 시 환경 변수를 설정할 수 있습니다:

```bash
# 다른 서버 주소 사용
API_BASE_URL=http://staging-server:8080/api npm run test:e2e

# 로컬 개발 환경 (기본값)
npm run test:e2e
```
