export interface DocumentNode {
    id: string;
    teamId: string;
    title: string;
    parentId: string | null;
    contentFormat?: 'plain' | 'html' | 'json';
    externalSource?: string | null;
    externalId?: string | null;
    externalUrl?: string | null;
    visibility?: 'team' | 'restricted';
    editPolicy?: 'owner_admin' | 'all' | 'restricted';
    archivedAt?: string | null;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentFull extends DocumentNode {
    content: string;
    allowedViewerIds?: string[];
    allowedEditorIds?: string[];
    canEdit?: boolean;
    canDelete?: boolean;
}

export interface DocumentVersion {
    id: string;
    documentId: string;
    teamId: string;
    title: string;
    content: string;
    contentFormat: 'plain' | 'html' | 'json';
    savedBy: string;
    createdAt: string;
}

export interface DocumentComment {
    id: string;
    teamId: string;
    documentId: string;
    parentId: string | null;
    content: string;
    anchorText: string | null;
    createdBy: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
    editedAt: string | null;
    deletedAt: string | null;
    deletedBy: string | null;
    createdAt: string;
    updatedAt: string;
}
