export function shouldFallbackToManualDownload(error: Error) {
    const message = error.message.toLowerCase();
    return process.platform === 'darwin' && (
        message.includes('code signature') ||
        message.includes('did not pass validation') ||
        message.includes('not pass validation')
    );
}

export function normalizeUpdateError(error: Error) {
    if (shouldFallbackToManualDownload(error)) {
        return 'macOS 서명 검증을 통과하지 못했어요. 다운로드 페이지에서 새 버전을 다시 설치해 주세요.';
    }
    return error.message ?? '업데이트를 처리하지 못했어요.';
}
