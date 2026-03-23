export interface UploadBinaryInput {
    buffer: Buffer;
    objectName: string;
    mimeType: string;
    size: number;
}

export interface StoredFile {
    key: string;
    url: string;
    mimeType: string;
    size: number;
}

export interface IFileStorage {
    upload(input: UploadBinaryInput): Promise<StoredFile>;
}

export const FILE_STORAGE = Symbol('IFileStorage');
