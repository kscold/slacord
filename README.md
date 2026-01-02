# Slacord

> Slack 메시지를 Discord로 자동 백업하는 중계 서버

Slack Free 플랜의 90일 메시지 제한을 극복하고, Discord를 무료 영구 저장소로 활용하여 중요한 메시지를 보관합니다.

## 🎯 주요 기능

- ✅ **Slack → Discord 자동 백업**: 실시간 메시지 동기화
- ✅ **선택적 채널 백업**: 중요한 채널만 선택하여 백업
- ✅ **파일/이미지 지원**: 첨부 파일 URL 백업
- ✅ **사용자 정보 보존**: 발신자 이름/프로필 이미지 포함
- ⏳ **스레드 지원**: 답글 구조 유지 (추후)

## 📦 기술 스택

- **프레임워크**: NestJS 10.x
- **언어**: TypeScript 5.x
- **Slack SDK**: @slack/bolt 4.x
- **패키지 매니저**: Yarn (필수)

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 설치

```bash
# 의존성 설치
yarn install
```

### 2. Slack App 설정

1. [Slack API](https://api.slack.com/apps)에서 새 앱 생성
2. **OAuth & Permissions**에서 Bot Token Scopes 추가:
    - `channels:history` - 채널 메시지 읽기
    - `channels:read` - 채널 정보 조회
    - `users:read` - 사용자 정보 조회
    - `chat:write` - 메시지 전송 (추후)

3. **Event Subscriptions** 활성화:
    - Subscribe to bot events: `message.channels`

4. **Socket Mode** 활성화 (개발 환경):
    - App-Level Token 생성

5. Workspace에 앱 설치 후 Bot Token 복사

### 3. Discord Webhook 설정

1. Discord 서버의 백업용 채널 생성
2. 채널 설정 → 연동 → Webhook 생성
3. Webhook URL 복사

### 4. 환경변수 설정

`.env` 파일 생성:

```bash
# 서버 설정
PORT=3000
NODE_ENV=development

# Slack Bot 설정
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# 백업 대상 Slack 채널 ID (쉼표로 구분)
# 채널 ID 확인: 채널 우클릭 → 링크 복사 → URL의 마지막 부분
SLACK_TARGET_CHANNELS=C01234567,C89012345

# Discord Webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
```

### 5. 서버 실행

```bash
# 개발 모드
yarn start:dev

# 프로덕션 모드
yarn build
yarn start:prod
```

서버가 정상 실행되면 다음과 같은 로그가 출력됩니다:

```
🚀 Slacord 서버가 http://localhost:3000 에서 실행 중입니다.
📡 API 엔드포인트: http://localhost:3000/api
[Slack Bot started in Socket Mode]
[Relay 서비스 초기화 완료]
```

### 6. Slack Bot을 채널에 초대

백업하려는 채널에서:

```
/invite @YourBotName
```

이제 해당 채널의 메시지가 자동으로 Discord로 백업됩니다!

## 📖 사용 방법

### 채널 ID 확인하는 법

1. Slack 웹/앱에서 채널 이름 우클릭
2. "링크 복사" 선택
3. URL 예시: `https://workspace.slack.com/archives/C01234567`
4. `C01234567`이 채널 ID

### 백업 동작 확인

Slack 채널에 메시지를 보내면:

1. Slacord 서버 로그에 백업 로그 출력
2. Discord 채널에 다음 형식으로 백업:

```
[#채널명] 사용자명: 메시지 내용
```

## 🛠️ 개발 가이드

### 프로젝트 구조

```
slacord/
├── src/
│   ├── slack/          # Slack 연동 모듈
│   ├── discord/        # Discord 연동 모듈
│   ├── relay/          # 메시지 중계 로직
│   └── main.ts         # 진입점
├── .env                # 환경변수 (git 무시)
├── CLAUDE.md           # 프로젝트 메모리
└── README.md           # 이 파일
```

### 명령어

```bash
# 의존성 설치
yarn install

# 개발 서버 (hot-reload)
yarn start:dev

# 빌드
yarn build

# 타입 체크
yarn typecheck

# 프로덕션 실행
yarn start:prod
```

### 로그 확인

모든 로그는 NestJS Logger를 통해 출력됩니다:

- `[SlackService]`: Slack 연동 로그
- `[DiscordService]`: Discord 전송 로그
- `[RelayService]`: 메시지 중계 로그

## 🔒 보안 주의사항

- ⚠️ `.env` 파일을 절대 Git에 커밋하지 마세요
- ⚠️ Slack Token과 Discord Webhook URL을 외부에 노출하지 마세요
- ⚠️ 프로덕션 환경에서는 HTTPS 필수

## 📝 트러블슈팅

### Bot이 메시지를 받지 못해요

1. ✅ Bot Token Scopes 확인
2. ✅ Event Subscriptions 활성화 확인
3. ✅ Socket Mode 활성화 확인 (개발)
4. ✅ Bot을 채널에 초대했는지 확인

### Discord에 백업이 안 돼요

1. ✅ Webhook URL 유효성 확인
2. ✅ Discord 채널 권한 확인
3. ✅ 메시지 길이 제한 (2000자) 확인
4. ✅ Rate Limit 초과 여부 확인

### 특정 채널만 백업하고 싶어요

`.env` 파일에서 `SLACK_TARGET_CHANNELS` 설정:

```bash
# 여러 채널 백업
SLACK_TARGET_CHANNELS=C01234567,C89012345,C11111111

# 모든 채널 백업 (비워두기)
SLACK_TARGET_CHANNELS=
```

## 🗺️ 로드맵

### Phase 1: 중계 서버 (현재)

- ✅ Slack → Discord 자동 백업
- ✅ 채널 필터링
- ✅ 파일/이미지 백업

### Phase 2: 웹 대시보드 (예정)

- ⏳ 백업 메시지 검색/조회
- ⏳ 채널별 아카이브 뷰
- ⏳ 통계 대시보드

### Phase 3: 독자 앱 (미래)

- ⏳ Electron 메신저 앱
- ⏳ Slack + Discord 통합 UI
- ⏳ 실시간 동기화

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR 환영합니다!

## 💬 문의

프로젝트 관련 문의사항은 이슈로 남겨주세요.

---

**Made with ❤️ by Slacord Team**
