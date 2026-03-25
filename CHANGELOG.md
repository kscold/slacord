# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 허들(음성/영상통화) 기능 — WebRTC Mesh P2P, 시그널링 게이트웨이
- 채널 타입에 `voice` 추가
- 백엔드 단위 테스트 (RegisterUseCase, DocumentEntity RBAC, ArchiveDocumentUseCase, GetDocumentsUseCase)
- CHANGELOG.md 도입

### Fixed
- document.controller.ts 라우트 순서 버그 (`archived/list`가 `:documentId`에 먹히는 문제)
- DiscordErrorFilter가 ValidationPipe 에러 메시지(배열)를 삼키던 문제
- apiFetch에서 배열 에러 메시지 처리
- macOS 코드사인 없이 빌드 시 자동업데이트 실패 → `forceCodeSigning: false`
- MessageRepository에 `findByExternalRef`/`saveImported` 미구현 빌드 에러
- updates.ts race condition (setImmediate → 동기 처리, 다이얼로그 연타 방지)
- archive/restore use-case N+1 쿼리 → 벌크 처리 최적화

### Changed
- BlockEditor.tsx FSD 안티패턴 수정 (documentApi 직접 호출 → useDocumentFileUpload hook)
- DocumentAttachmentButton/EditorPanel API 호출을 model hook으로 분리
- Electron 미디어 권한(마이크/카메라) 허용 추가

## [1.0.5] - 2026-03-25

### Added
- 문서 아카이빙 시스템 (소프트 삭제/복원/휴지통)
- 문서 RBAC (visibility, editPolicy, allowedViewerIds/EditorIds)
- BlockNote 리치 에디터 (노션 스타일 블록 편집)
- 문서 파일 첨부 (MinIO 연동)
- 문서 버전 히스토리 (수정 시 자동 스냅샷)
- 문서 검색 (제목/본문 $regex)
- 데스크톱 앱 다운로드 페이지 (/download)
- 데스크톱 자동업데이트 재시작 흐름 보강
- 모바일 워크스페이스 반응형 레이아웃
- 대시보드 허브 개선
- 디스코드 봇 연동 (회원가입/에러 알림)

### Fixed
- 프론트엔드 빌드 에러 (TeamInvitePreview 타입 export)
- 마크다운 테이블 렌더링 (구분선 없는 테이블)

## [1.0.0] - 2026-03-24

### Added
- 초기 릴리즈
- 실시간 채팅 (Socket.IO WebSocket)
- 팀/워크스페이스 관리
- 채널 (public/private/dm/group)
- 메시지 반응/편집/삭제/핀
- 이슈 트래커 (칸반 보드)
- 문서/위키
- 공지사항
- 팀원 온라인 프레즌스
- GitHub Webhook 알림
- Confluence 문서 가져오기
- 데스크톱 앱 (Electron, Mac/Windows)
- 마케팅 랜딩 페이지
