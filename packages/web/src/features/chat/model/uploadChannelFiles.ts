import { messageApi, unwrapApiData } from '@/lib/api-client';
import type { Attachment } from '@/src/entities/message/types';

export async function uploadChannelFiles(channelId: string, teamId: string, files: File[]) {
    const results = await Promise.all(files.map((file) => messageApi.uploadAttachment(channelId, teamId, file)));
    return results.map((result) => {
        const attachment = unwrapApiData<Attachment>(result);
        if (!attachment) throw new Error('파일 업로드에 실패했습니다.');
        return attachment;
    });
}
