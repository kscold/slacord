import { useState } from 'react';
import { documentApi, unwrapApiData } from '@/lib/api-client';

interface UploadedFile {
    url: string;
    name: string;
}

export function useDocumentFileUpload(teamId: string) {
    const [uploading, setUploading] = useState(false);

    const uploadFile = async (documentId: string, file: File): Promise<UploadedFile> => {
        setUploading(true);
        try {
            const response = await documentApi.uploadDocumentFile(teamId, documentId, file);
            const data = unwrapApiData<{ name: string; url: string }>(response);
            if (!data?.url) throw new Error('파일 업로드에 실패했습니다.');
            return { url: data.url, name: data.name };
        } finally {
            setUploading(false);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const response = await documentApi.uploadDocumentImage(teamId, file);
        const url = unwrapApiData<{ url: string }>(response)?.url;
        if (!url) throw new Error('이미지 업로드에 실패했습니다.');
        return url;
    };

    return { uploading, uploadFile, uploadImage };
}
