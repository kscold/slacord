import { messageApi } from '@/lib/api-client';
import type { Attachment } from '@/src/entities/message/types';

export async function uploadChannelFiles(channelId: string, teamId: string, files: File[]) {
    const results = await Promise.all(files.map((file) => messageApi.uploadAttachment(channelId, teamId, file)));
    return results.map((result) => result.data as Attachment);
}
