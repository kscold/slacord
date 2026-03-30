const args = new Set(process.argv.slice(2));
const targetArg = [...args].find((arg) => arg.startsWith('--target='));
const target = targetArg?.split('=')[1] ?? 'all';

const groups = {
  mac: ['CSC_LINK', 'CSC_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID'],
  win: ['WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD'],
};

const targets = target === 'all' ? ['mac', 'win'] : [target];

if (!targets.every((item) => item in groups)) {
  console.error('사용법: node scripts/check-desktop-release-secrets.mjs [--target=mac|win|all]');
  process.exit(1);
}

let hasError = false;

for (const currentTarget of targets) {
  const keys = groups[currentTarget];
  const missing = keys.filter((key) => !process.env[key]);
  const title = currentTarget === 'mac' ? 'mac 서명/공증' : 'Windows 코드사인';

  console.log(`\n[${title}]`);

  if (missing.length === 0) {
    console.log('모든 시크릿이 준비되어 있습니다.');
    continue;
  }

  hasError = true;
  console.log('누락된 시크릿이 있습니다.');
  for (const key of missing) console.log(`- ${key}`);

  if (currentTarget === 'mac') {
    console.log('다음 순서로 준비하면 됩니다.');
    console.log('- Developer ID Application 인증서를 .p12로 export');
    console.log('- CSC_LINK에 base64 문자열 또는 접근 가능한 인증서 링크 등록');
    console.log('- CSC_KEY_PASSWORD에 인증서 비밀번호 등록');
    console.log('- APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID 등록');
  }

  if (currentTarget === 'win') {
    console.log('Windows 서명 시크릿은 선택입니다.');
    console.log('- 없으면 릴리즈는 가능하지만 SmartScreen 경고가 남을 수 있습니다.');
  }
}

if (hasError) {
  console.error('\n데스크톱 릴리즈 사전 점검에 실패했습니다.');
  process.exit(1);
}

console.log('\n데스크톱 릴리즈 사전 점검이 통과했습니다.');
