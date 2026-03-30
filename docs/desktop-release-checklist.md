# Desktop Release Checklist

## 목표

- `v1.0.9`: 기존 unsigned mac 앱 사용자가 새 설치 파일로 다시 올라오는 전환 버전
- `v1.1.0`: 서명과 공증이 적용된 첫 자동 업데이트 기준선

## mac 서명/공증 준비물

- `CSC_LINK`
  - `Developer ID Application` 인증서 `.p12`
  - `electron-builder` 공식 문서 기준으로 `base64`, `file://`, 로컬 경로, HTTPS 링크를 사용할 수 있음
- `CSC_KEY_PASSWORD`
  - `.p12` 인증서 비밀번호
- `APPLE_ID`
  - Apple Developer 계정 이메일
- `APPLE_APP_SPECIFIC_PASSWORD`
  - Apple ID 앱 전용 비밀번호
- `APPLE_TEAM_ID`
  - Apple Developer Team ID

공식 문서
- `CSC_LINK`, `CSC_KEY_PASSWORD`: https://www.electron.build/code-signing.html
- `Developer ID Application` export: https://www.electron.build/code-signing-mac.html

## 인증서 export 순서

1. macOS 키체인 접근을 엽니다.
2. `login` 키체인과 `내 인증서`를 선택합니다.
3. `Developer ID Application` 인증서를 찾습니다.
4. 우클릭 후 export 해서 `.p12` 파일로 저장합니다.
5. 비밀번호를 설정합니다.

## GitHub Secrets 등록 순서

1. `.p12` 파일을 base64로 인코딩합니다.
2. `Settings > Secrets and variables > Actions` 로 이동합니다.
3. 아래 값을 등록합니다.

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`
- 선택: `WIN_CSC_LINK`
- 선택: `WIN_CSC_KEY_PASSWORD`

## 로컬 사전 점검

```bash
cd /Users/kscold/Desktop/slacord
node scripts/check-desktop-release-secrets.mjs --target=mac
```

Windows까지 함께 보려면:

```bash
cd /Users/kscold/Desktop/slacord
node scripts/check-desktop-release-secrets.mjs --target=all
```

## 릴리즈 순서

1. 버전을 올립니다.

```bash
cd /Users/kscold/Desktop/slacord
yarn version:all 1.1.0
```

2. 웹/서버/데스크톱 빌드를 확인합니다.

```bash
yarn build:server
yarn build:web
yarn build:desktop
```

3. 커밋과 태그를 만듭니다.

```bash
git add .
git commit -m "chore(release): 데스크톱 릴리즈 버전 1.1.0 동기화"
git tag v1.1.0
git push origin main --tags
```

4. GitHub Actions `desktop-release` 가 mac/win 둘 다 성공하는지 확인합니다.

## 완료 기준

- `v1.1.0` 릴리즈에 `DMG`, `ZIP`, `EXE`, `latest-mac.yml`, `latest.yml` 이 모두 존재
- mac job 이 `Validate mac signing secrets` 와 `Publish desktop artifacts` 를 통과
- 설치된 `v1.0.9` 또는 이후 앱에서 다음 버전 알림이 뜨고, 사용자가 다운로드를 선택하면 재시작 후 적용

## 주의

- unsigned mac 앱은 signed line 으로 넘어올 때 한 번 수동 재설치가 필요할 수 있습니다.
- `v1.1.0` 이후부터를 진짜 자동 업데이트 기준선으로 보는 게 맞습니다.
