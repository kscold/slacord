# Slacord

대화, 할 일, 문서를 한 곳에서 관리하는 올인원 팀 워크스페이스.

> https://slacord.cloud

## 기능

### 실시간 채팅
- 채널 기반 팀 대화 (public / private / DM / 소그룹)
- 이모지 반응, 메시지 편집/삭제, 핀 고정
- 타이핑 표시, 스레드 답글
- 파일 첨부 (MinIO 오브젝트 스토리지)

### 허들 (음성/영상통화)
- WebRTC Mesh P2P 기반 (4명 이하 소규모 팀)
- 음성 채널 + 텍스트 채널 내 허들 시작
- 마이크/카메라 토글, 화면 공유

### 이슈 트래커
- 칸반 보드 (할 일 → 진행 중 → 리뷰 → 완료)
- 담당자 배정, 우선순위, 라벨

### 문서/위키
- BlockNote 리치 에디터 (노션 스타일 블록 편집)
- 문서 트리 구조 (상위/하위 문서)
- RBAC 권한 (문서별 열람/편집 제한)
- 아카이빙 (소프트 삭제 + 복원)
- 버전 히스토리 (수정 시 자동 스냅샷)
- Confluence 문서 일괄 가져오기

### 공지사항
- 팀 전체 공지, 핀 고정

### 데스크톱 앱
- Electron 기반 (macOS / Windows)
- 자동 업데이트 (GitHub Releases)
- 네이티브 알림

### 기타
- 팀원 온라인 프레즌스
- GitHub Webhook 알림 연동
- 디스코드 봇 연동 (회원가입/에러 모니터링)
- 모바일 반응형 레이아웃

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | NestJS 11, TypeScript, MongoDB (Mongoose), Socket.IO, JWT |
| **프론트엔드** | Next.js 16, TypeScript, Tailwind CSS v4, Zustand |
| **데스크톱** | Electron 39, electron-updater |
| **스토리지** | MinIO (S3 호환 오브젝트 스토리지) |
| **인프라** | Docker, Colima, Nginx, PM2 |
| **아키텍처** | 헥사고날 (Ports & Adapters), FSD (Feature-Sliced Design) |

## 패키지 구성

```
packages/
├── server/      NestJS 백엔드
├── web/         Next.js 프론트엔드
├── desktop/     Electron 데스크톱 앱
└── contracts/   공유 타입 정의
```

## 라이선스

Copyright (c) 2026 kscold (김승찬) / Colding. All rights reserved.

이 소프트웨어는 저작권자의 서면 허가 없이 사용, 복제, 배포할 수 없습니다.
자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.
