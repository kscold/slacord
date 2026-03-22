# Slacord

팀 올인원 협업 툴. 채팅, 이슈 트래커, 문서를 하나의 플랫폼에서.

## 개요

포퐁팀 내부 도구로 시작해 외부 SaaS로 확장 예정.
Slack/Discord relay 방식이 아닌 MongoDB 직접 저장 방식으로 동작하며,
Socket.IO를 통한 실시간 채팅을 지원한다.

## 패키지 구성

| 패키지 | 경로 | 설명 |
|--------|------|------|
| @slacord/server | packages/server | NestJS 백엔드 (포트 8082) |
| @slacord/web | packages/web | Next.js 프론트엔드 (포트 3002) |

## 기술 스택

**백엔드**
- NestJS 11 + TypeScript 5
- MongoDB (Mongoose 9)
- Socket.IO (실시간 채팅)
- JWT + Passport.js (인증)
- 헥사고날 아키텍처 (Ports & Adapters)

**프론트엔드**
- Next.js 16 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand (상태 관리)
- FSD (Feature-Sliced Design)

## 시작하기

### 필요 조건

- Node.js 18 이상
- Yarn 1.22 이상
- MongoDB (로컬 또는 Atlas)

### 환경 변수 설정

```bash
# packages/server/.env
PORT=8082
MONGODB_URI=mongodb://localhost:27017/slacord
JWT_SECRET=your-secret-key
```

### 개발 서버 실행

```bash
# 의존성 설치
yarn install

# 백엔드 개발 서버
yarn dev:server

# 프론트엔드 개발 서버
yarn dev:web
```

### 빌드

```bash
yarn build:server
yarn build:web
```

## API

서버 실행 후 Swagger 문서 확인: `http://localhost:8082/api/docs`

### 주요 엔드포인트

```
POST /api/auth/register       회원가입
POST /api/auth/login          로그인
GET  /api/auth/me             내 정보

GET  /api/team                내 팀 목록
POST /api/team                팀 생성
POST /api/team/:slug/join     팀 참여

GET  /api/team/:teamId/channel        채널 목록
POST /api/team/:teamId/channel        채널 생성

GET  /api/channel/:channelId/message  메시지 조회
```

### WebSocket (Socket.IO)

namespace: `/chat`

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| join_channel | 클라이언트 → 서버 | 채널 입장 |
| leave_channel | 클라이언트 → 서버 | 채널 퇴장 |
| send_message | 클라이언트 → 서버 | 메시지 전송 |
| typing | 클라이언트 → 서버 | 타이핑 표시 |
| new_message | 서버 → 클라이언트 | 새 메시지 수신 |
| user_typing | 서버 → 클라이언트 | 타이핑 중 사용자 |

## 개발 로드맵

- Phase 1 (진행중): 채팅 MVP - 팀/채널/실시간 메시지
- Phase 2: 이슈 트래커
- Phase 3: 문서/위키
- Phase Future: Electron 앱

## 라이선스

MIT
