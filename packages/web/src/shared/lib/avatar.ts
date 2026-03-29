const AVATAR_COLORS = ['#e06c75', '#61afef', '#98c379', '#c678dd', '#e5c07b', '#56b6c2', '#d19a66', '#be5046'];

export function getAvatarColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
