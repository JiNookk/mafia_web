# 🎭 마피아 게임 (Mafia Web)

실시간 멀티플레이어 마피아 게임 웹 애플리케이션

## 🔗 데모
- **배포 링크**: [https://mafia-web-sage.vercel.app](https://mafia-web-sage.vercel.app)
- **백엔드 저장소**: [https://github.com/ojin0611/mafia](https://github.com/ojin0611/mafia)

## 📋 프로젝트 소개

8명의 플레이어가 참여하는 실시간 멀티플레이어 마피아 게임입니다. WebSocket을 활용한 실시간 통신으로 원활한 게임 진행이 가능하며, 직관적인 UI/UX를 제공합니다.

### 주요 기능
- 실시간 방 생성 및 참여
- WebSocket 기반 실시간 게임 진행
- 역할별 차별화된 UI (마피아, 시민, 의사, 경찰)
- 낮/밤 페이즈 자동 전환 및 타이머
- 실시간 채팅 (전체/마피아/사망자)
- 투표 및 특수 능력 시스템

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios 1.12.2
- **Real-time Communication**: Socket.IO Client 4.8.1
- **Icons**: Lucide React 0.544.0
- **Notifications**: Sonner 2.0.7

### Development Tools
- **Type Generation**: openapi-typescript (OpenAPI 스펙 기반 타입 자동 생성)
- **E2E Testing**: Playwright 1.56.0
- **Linting**: ESLint 9

## 🏗 아키텍처 및 설계

### 폴더 구조
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── entry/             # 진입 페이지 (닉네임 설정)
│   ├── lobby/             # 로비 (방 목록)
│   └── rooms/[roomId]/    # 게임방 및 게임 플레이
├── components/            # 재사용 가능한 UI 컴포넌트
├── hooks/                 # Custom React Hooks
├── services/             # API 서비스 레이어
├── lib/                  # 유틸리티 및 설정
└── types/                # TypeScript 타입 정의
```

### 상태 관리 전략

프로젝트의 규모와 특성을 고려하여 **Redux/Zustand 같은 전역 상태 관리 라이브러리를 사용하지 않고**, React의 기본 기능과 Custom Hooks를 활용한 효율적인 상태 관리를 구현했습니다.

#### 1. **로컬 상태 관리** (useState)
- 컴포넌트 단위의 UI 상태 (모달, 입력값 등)
- 페이지별 독립적인 상태

#### 2. **Custom Hooks 기반 로직 분리**
복잡한 비즈니스 로직을 Custom Hooks로 캡슐화하여 재사용성과 테스트 용이성을 확보했습니다.

**주요 Custom Hooks:**

- **`useGameState`**: 게임 상태 전체 관리
  - 게임 상태, 플레이어 정보, 역할, 투표 현황 통합 관리
  - API 호출 및 데이터 동기화

- **`useGameWebSocket`**: WebSocket 연결 및 이벤트 처리
  - 다중 채널 WebSocket 연결 관리 (전체/마피아/사망자)
  - 자동 재연결 로직 (Exponential Backoff)
  - 역할별 동적 채널 구독

- **`useGameEvents`**: 게임 이벤트 핸들러
  - 페이즈 변경, 플레이어 상태 업데이트 처리
  - 게임 종료 처리

- **`useGameTimer`**: 페이즈 타이머 관리
  - 남은 시간 계산 및 자동 갱신

- **`useGameAction`**: 게임 액션 처리
  - 투표, 마피아 살해, 의사 치료, 경찰 조사

- **`useGameChat`**: 채팅 기능
  - 역할별 채팅 권한 관리
  - 채팅 메시지 히스토리

#### 3. **Service Layer 패턴**
비즈니스 로직과 API 통신을 분리하여 관심사를 명확히 구분했습니다.

```typescript
// services/game.ts
export class GameService {
  async startGame(roomId: string): Promise<ApiResponse<GameStateResponse>>
  async getGameState(gameId: string): Promise<ApiResponse<GameStateResponse>>
  async registerAction(gameId: string, data: RegisterActionDto): Promise<ApiResponse<void>>
  // ... 기타 게임 관련 API
}
```

#### 4. **타입 안정성**
- OpenAPI 스펙에서 자동 생성된 타입 사용
- 컴파일 타임에 API 응답 타입 검증
- 런타임 에러 최소화

#### 상태 관리 전략의 장점
1. **번들 크기 최적화**: 외부 라이브러리 없이 React 기본 기능만 사용
2. **학습 곡선 감소**: Redux/Zustand의 추가 개념 없이 React 기본 개념만으로 이해 가능
3. **명확한 데이터 흐름**: Props drilling이 발생하지 않는 적절한 컴포넌트 구조
4. **유연성**: 필요시 특정 부분만 전역 상태 관리 도입 가능

### WebSocket 연결 전략

게임 특성상 실시간 통신이 핵심이므로, 안정적인 WebSocket 연결 관리가 중요합니다.

#### 다중 채널 구독
플레이어의 역할과 생존 여부에 따라 동적으로 채널을 구독합니다:

```typescript
// 기본 채널
channels = ['all', 'events']

// 사망한 플레이어
if (!myIsAlive) channels.push('dead')

// 살아있는 마피아
if (myRole === 'MAFIA' && myIsAlive) channels.push('mafia')
```

#### 자동 재연결 (Exponential Backoff)
네트워크 불안정 시 지수 백오프 알고리즘으로 안정적인 재연결을 보장합니다:

```typescript
const getReconnectDelay = (attemptNumber: number): number => {
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
};
// 1초 → 2초 → 4초 → 8초 → 10초 (최대)
```

#### WebSocket 이벤트 처리
- `PHASE_CHANGE`: 게임 페이즈 전환
- `PLAYER_UPDATE`: 플레이어 상태 변경
- `PLAYER_DIED`: 플레이어 사망
- `CHAT`: 채팅 메시지
- `VOTE_UPDATE`: 투표 현황 업데이트
- `GAME_ENDED`: 게임 종료

### API 통신

#### ApiClient 클래스
Axios 기반의 중앙화된 API 클래스로 일관된 에러 처리와 응답 포맷을 제공합니다:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
```

#### 에러 핸들링
- HTTP 에러를 일관된 `ApiResponse` 포맷으로 변환
- 사용자 친화적인 에러 메시지 표시 (Sonner toast)
- 백엔드 에러 코드 기반 세부 처리 (`ROOM_FULL`, `GAME_ALREADY_STARTED` 등)

## 🚀 실행 방법

### 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080  # 개발 환경
# NEXT_PUBLIC_API_URL=https://mafia-server.click  # 프로덕션
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (타입 자동 생성 포함)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### API 타입 생성
```bash
# 로컬 서버에서 타입 생성
npm run generate-types:local

# 프로덕션 서버에서 타입 생성
npm run generate-types:prod
```

### E2E 테스트
```bash
# 테스트 실행
npm run test:e2e

# UI 모드로 테스트
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug
```

## 📱 주요 화면

### 1. 로비 (방 목록)
- 실시간 방 목록 조회
- 방 생성 및 참여
- 방 상태 표시 (대기중/게임중/풀방)

### 2. 게임방 (대기실)
- 실시간 플레이어 목록
- 준비 상태 표시
- 8명 달성 시 게임 시작

### 3. 게임 플레이
- 역할별 UI (마피아/시민/의사/경찰)
- 낮/밤 페이즈 자동 전환
- 실시간 타이머
- 투표 및 특수 능력 사용
- 역할별 제한된 채팅

## 🔑 핵심 구현 사항

### 1. 타입 안정성
- OpenAPI 스펙 기반 타입 자동 생성으로 백엔드와 프론트엔드 타입 동기화
- `openapi-typescript`를 활용하여 API 변경사항 즉시 반영

### 2. 실시간 통신 안정성
- WebSocket 재연결 로직으로 네트워크 불안정 대응
- 역할별 동적 채널 구독으로 효율적인 메시지 전달

### 3. 사용자 경험
- Sonner를 활용한 직관적인 토스트 알림
- 애니메이션과 전환 효과로 부드러운 UI
- 반응형 디자인 (모바일 최적화)

### 4. 성능 최적화
- Custom Hooks를 통한 로직 분리 및 메모이제이션
- React 19의 최신 기능 활용
- 불필요한 리렌더링 방지

## 📈 개선 예정 사항

- [ ] 게임 리플레이 기능
- [ ] 통계 및 전적 시스템
- [ ] 친구 초대 기능
- [ ] 커스텀 게임 설정 (인원, 역할 비율)

## 👨‍💻 개발자

**오진욱**
- GitHub: [@ojin0611](https://github.com/ojin0611)
- Email: ojin0611@gmail.com

## 📄 라이센스

This project is licensed under the MIT License.
