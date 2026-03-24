export interface DocumentNode {
    id: string;
    teamId: string;
    title: string;
    parentId: string | null;
    contentFormat?: 'plain' | 'html';
    externalSource?: string | null;
    externalId?: string | null;
    externalUrl?: string | null;
    visibility?: 'team' | 'restricted';
    editPolicy?: 'owner_admin' | 'all' | 'restricted';
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
