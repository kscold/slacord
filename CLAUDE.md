# Slacord 프로젝트 메모리

## 1. 프로젝트 요약

### 프로젝트 개요

- **프로젝트명**: Slacord (Slack + Discord 메시지 중계 서버)
- **프레임워크**: NestJS + TypeScript
- **주요 기능**: Slack 메시지를 Discord로 자동 백업
- **목적**: Slack Free 플랜 90일 메시지 제한 극복
- **패키지 매니저**: Yarn (필수)
- **포트**: 3000

### 핵심 가치

1. **무료 영구 저장소**: Discord를 무료 DB로 활용하여 메시지 영구 보관
2. **선택적 백업**: 특정 Slack 채널만 선택하여 Discord로 백업
3. **실시간 동기화**: Slack 메시지 발생 즉시 Discord로 전송
4. **단계적 확장**: Phase 1(백업) → Phase 2(웹 대시보드) → Phase 3(독자 앱)

## 2. 아키텍처

### Phase 1: 중계 서버 (현재)

```
┌─────────────────────────────────────────────────┐
│             Slack Workspace                     │
│  ┌─────────────┐  ┌─────────────┐              │
│  │  #정보남김방  │  │  #중요채널   │              │
│  └──────┬──────┘  └──────┬──────┘              │
└─────────┼─────────────────┼─────────────────────┘
          │                 │
          └────────┬────────┘
                   │ Slack Event API / Socket Mode
                   ▼
          ┌────────────────┐
          │  Slacord Server │
          │   (NestJS)      │
          └────────┬─────────┘
                   │ Discord Webhook
                   ▼
          ┌────────────────┐
          │ Discord Channel │
          │  (백업 저장소)   │
          └────────────────┘
```

### 향후 확장 계획

- **Phase 2**: 웹 대시보드 (아카이브 검색/조회)
- **Phase 3**: Electron 독자 앱 (메신저 UI)

## 3. 프로젝트 구조

```
slacord/
├── src/
│   ├── slack/                    # Slack 연동 모듈
│   │   ├── slack.module.ts       # Slack 모듈
│   │   ├── slack.service.ts      # Slack Bot 서비스
│   │   └── slack.controller.ts   # Slack Event API 컨트롤러
│   ├── discord/                  # Discord 연동 모듈
│   │   ├── discord.module.ts     # Discord 모듈
│   │   └── discord.service.ts    # Discord Webhook 서비스
│   ├── relay/                    # 중계 로직 모듈
│   │   ├── relay.module.ts       # Relay 모듈
│   │   └── relay.service.ts      # 메시지 중계 서비스
│   ├── common/                   # 공통 유틸리티 (추후 확장)
│   │   ├── config/               # 설정 파일들
│   │   └── dto/                  # 공통 DTO들
│   ├── app.module.ts             # 루트 모듈
│   └── main.ts                   # 진입점
├── .env                          # 환경변수 (git 무시)
├── .env.example                  # 환경변수 예시
├── package.json
├── tsconfig.json
├── CLAUDE.md                     # 프로젝트 메모리 (이 파일)
└── README.md                     # 사용자 가이드
```

## 4. 핵심 모듈 설명

### Slack Module

**책임**: Slack Workspace와 연동하여 메시지 이벤트 수신

- **SlackService**: Slack Bot API 클라이언트
  - `onMessage()`: 메시지 핸들러 등록
  - `getChannelInfo()`: 채널 정보 조회
  - `getUserInfo()`: 사용자 정보 조회
  - `sendMessage()`: Slack으로 메시지 전송 (추후 기능)

- **SlackController**: Slack Event API HTTP 엔드포인트
  - `POST /api/slack/events`: URL Verification + Event Callback

**연동 방식**:
- Socket Mode (WebSocket): 실시간 이벤트 수신 (개발 환경)
- Event API (HTTP): Slack 서버 → Slacord 서버 (프로덕션)

### Discord Module

**책임**: Discord Webhook을 통한 메시지 백업

- **DiscordService**: Discord Webhook API 클라이언트
  - `sendMessage()`: 일반 메시지 전송
  - `sendMessageWithFile()`: 파일 포함 메시지
  - `sendEmbed()`: 구조화된 임베드 메시지

**특징**:
- Webhook 방식으로 인증 불필요
- Discord를 읽기 전용 저장소로 활용
- 파일/이미지 URL 백업 지원

### Relay Module

**책임**: Slack과 Discord 간 메시지 중계 로직

- **RelayService**: 메시지 흐름 제어
  - `handleSlackMessage()`: Slack 메시지 → Discord 변환
  - `addTargetChannel()`: 백업 채널 추가
  - `removeTargetChannel()`: 백업 채널 제거
  - `getTargetChannels()`: 백업 채널 목록 조회

**메시지 흐름**:
1. Slack에서 메시지 발생
2. SlackService가 이벤트 감지
3. RelayService가 채널 필터링
4. 사용자/채널 정보 조회 후 포맷팅
5. DiscordService로 전송

## 5. 환경 설정

### 환경변수 (.env)

```bash
# 서버 설정
PORT=3000
NODE_ENV=development

# Slack Bot 설정
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token  # Socket Mode용

# 백업 대상 Slack 채널 ID (쉼표로 구분)
SLACK_TARGET_CHANNELS=C01234567,C89012345

# Discord Webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Slack App 설정 가이드

1. **Slack App 생성**: https://api.slack.com/apps
2. **Bot Token Scopes** 추가:
   - `channels:history` - 공개 채널 메시지 읽기
   - `channels:read` - 채널 정보 조회
   - `users:read` - 사용자 정보 조회
   - `chat:write` - 메시지 전송 (추후)

3. **Event Subscriptions** 활성화:
   - `message.channels` - 채널 메시지 이벤트

4. **Socket Mode** 활성화 (개발 환경):
   - App-Level Token 생성

### Discord Webhook 설정 가이드

1. Discord 서버 → 채널 설정 → 연동
2. Webhook 생성 → URL 복사
3. `.env` 파일에 `DISCORD_WEBHOOK_URL` 설정

## 6. 개발 명령어

### Yarn 명령어 (필수)

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn start:dev

# 빌드
yarn build

# 타입 체크
yarn typecheck

# 프로덕션 실행
yarn start:prod
```

## 7. 개발 철학 (Pawpong Backend 계승)

### 절대 원칙

- **Yarn 필수 사용**: npm 사용 금지
- **의미 있는 주석**: 모든 코드에 비즈니스 목적 설명 필수
- **도메인 독립성**: 모듈 간 명확한 책임 분리
- **TypeScript Strict**: 타입 안전성 최우선
- **로그 표준**: `[메서드명] 설명: 결과` 형식 엄수

### 코드 품질 기준

- 모든 public 메서드는 JSDoc 주석 필수
- 복잡한 비즈니스 로직은 단위 테스트 추가
- 에러 핸들링 및 로깅 필수
- 성능에 영향을 주는 코드는 최적화 필수

### 로깅 컨벤션

```typescript
// 성공 로그
logger.log('[sendMessage] Discord 백업 완료: message123');

// 에러 로그
logger.error('[handleSlackMessage] 메시지 처리 실패: Network timeout', error.stack);

// 경고 로그
logger.warn('[onModuleInit] SLACK_TARGET_CHANNELS 미설정. 모든 채널 백업.');
```

## 8. 확장 계획

### Phase 2: 웹 대시보드 (추후)

- Discord에 백업된 메시지 검색/조회
- 채널별 아카이브 뷰
- 날짜 범위 필터링
- 파일 다운로드 기능

### Phase 3: Electron 독자 앱 (최종)

- Slack + Discord 통합 메신저 UI
- 실시간 채팅 + 영구 아카이브
- 오프라인 캐싱
- 알림 시스템

## 9. 주의사항

### Slack API Rate Limit

- Tier 3: 분당 50+ requests
- 사용자/채널 정보 조회 시 캐싱 권장

### Discord Webhook 제한

- Rate Limit: 초당 30 요청
- 메시지 길이: 최대 2000자
- 파일 크기: 최대 8MB (일반) / 50MB (Nitro)

### 보안

- `.env` 파일 git 커밋 금지
- Slack Token / Discord Webhook URL 노출 주의
- HTTPS 필수 (프로덕션 환경)

## 10. 트러블슈팅

### Slack Bot이 메시지를 받지 못할 때

1. Bot Token Scopes 확인
2. Event Subscriptions 활성화 확인
3. Socket Mode / Request URL 설정 확인
4. Bot을 채널에 초대했는지 확인

### Discord 백업이 안 될 때

1. Webhook URL 유효성 확인
2. Discord 서버/채널 권한 확인
3. Rate Limit 초과 여부 확인
4. 메시지 길이 제한 (2000자) 확인

## 11. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | NestJS 10.x |
| 언어 | TypeScript 5.x |
| Slack SDK | @slack/bolt 4.x |
| HTTP 클라이언트 | axios |
| 검증 | class-validator |
| 변환 | class-transformer |
| 설정 | @nestjs/config |

## 12. 프로젝트 목표

### 단기 목표 (Phase 1)

- ✅ Slack → Discord 메시지 자동 백업
- ✅ 채널별 필터링
- ✅ 파일/이미지 백업 지원
- ⏳ 스레드 답글 백업 (추후)

### 중기 목표 (Phase 2)

- 웹 대시보드 개발
- 백업 메시지 검색 기능
- 통계 대시보드

### 장기 목표 (Phase 3)

- Electron 독자 메신저 앱
- Slack + Discord 통합 UI
- 실시간 동기화
