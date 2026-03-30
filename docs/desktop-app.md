# Slacord Desktop

## Stack

- `packages/desktop`: Electron main process + preload
- `packages/contracts`: web/desktop 공유 IPC 타입
- hosted web app 로드: `https://slacord.cloud/auth/login`
- `electron-builder` 기반 DMG 생성
- `electron-updater` 기반 GitHub Releases 업데이트 체크

## Scripts

- `yarn dev:desktop`
- `yarn build:desktop`
- `yarn dist:desktop`
- `yarn dist:desktop:win`
- `yarn release:desktop:mac`
- `yarn release:desktop:win`
- `yarn version:all 1.0.1`

`yarn dev:desktop` 는 모노레포 루트에서 `@slacord/web` dev 서버와 `@slacord/desktop` shell을 같이 띄우는 진입점임.

## Local Packaging

- mac DMG: `yarn dist:desktop`
- Windows installer: `yarn dist:desktop:win`

로컬 mac 패키징은 [`packages/desktop/release`](/Users/kscold/Desktop/slacord/packages/desktop/release) 에 DMG와 `latest-mac.yml` 을 남김.

## GitHub Release Flow

1. `yarn version:all 1.0.1`
2. 커밋 후 `git tag v1.0.1`
3. `git push origin main --tags`
4. GitHub Actions가 mac DMG/ZIP, Windows NSIS EXE, update metadata를 Releases에 업로드

워크플로우는 태그 버전과 [`packages/desktop/package.json`](/Users/kscold/Desktop/slacord/packages/desktop/package.json) 버전이 다르면 실패하도록 잡아둠.

## Release Prerequisites

- `GH_TOKEN`: GitHub Releases 업로드/업데이트 메타데이터
- `CSC_LINK`, `CSC_KEY_PASSWORD`: macOS signing 인증서
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: notarization
- Windows 코드사인 시 `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`

## Notes

- 코드사인 없이도 로컬 DMG는 만들 수 있지만, macOS 자동업데이트는 서명·공증된 앱 기준으로 잡는 게 맞음.
- electron-builder 공식 문서 기준으로 mac 자동업데이트는 `dmg` 와 `zip` 둘 다 살아 있어야 안정적임.
- Windows 설치파일은 NSIS `.exe` 기준으로 GitHub Releases에 올라가게 잡았음.
- remote content를 로드하므로 `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` 조합 유지해야 함.

## macOS Signing Checklist

1. Apple Developer 계정에서 `Developer ID Application` 인증서를 `.p12` 로 export
2. `CSC_LINK`, `CSC_KEY_PASSWORD` 를 GitHub Secrets에 등록
3. `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` 를 GitHub Secrets에 등록
4. 태그 릴리즈를 올리면 GitHub Actions가 서명 + 공증까지 같이 진행
5. 서명 없는 예전 앱에서 서명된 첫 버전으로 넘어갈 때는 한 번 수동 재설치가 필요할 수 있음
