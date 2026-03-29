import type { DocumentFull } from '../types';

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatInline = (value: string) =>
    escapeHtml(value)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
        .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');

const isTableBlock = (lines: string[]) =>
    lines.length >= 2 && lines.every((line) => line.trimStart().startsWith('|') && line.trimEnd().endsWith('|'));

const renderTable = (lines: string[]) => {
    const isSeparator = (line: string) => /^\|\s*[-: ]+(\|\s*[-: ]+)*\|?\s*$/.test(line.trim());
    const parseRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => formatInline(cell.trim()));
    const dataLines = lines.filter((line) => !isSeparator(line));
    if (dataLines.length === 0) return '';
    const [head, ...body] = dataLines.map(parseRow);
    return `<table><thead><tr>${head.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

const renderList = (lines: string[], ordered: boolean) => {
    const tag = ordered ? 'ol' : 'ul';
    const items = lines.map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^-\s+/, '')).map((line) => `<li>${formatInline(line)}</li>`).join('');
    return `<${tag}>${items}</${tag}>`;
};

const renderBlock = (block: string) => {
    const lines = block.split('\n').map((line) => line.trimEnd()).filter(Boolean);
    if (lines.length === 0) return '';
    if (isTableBlock(lines)) return renderTable(lines);
    if (lines.every((line) => /^-\s+/.test(line.trim()))) return renderList(lines, false);
    if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) return renderList(lines, true);
    if (lines.every((line) => /^>\s?/.test(line.trim()))) return `<blockquote>${lines.map((line) => formatInline(line.replace(/^>\s?/, ''))).join('<br />')}</blockquote>`;
    if (/^#{1,4}\s+/.test(lines[0])) {
        const level = Math.min(lines[0].match(/^#+/)?.[0].length ?? 1, 4);
        return `<h${level}>${formatInline(lines[0].replace(/^#{1,4}\s+/, ''))}</h${level}>`;
    }
    return `<p>${lines.map((line) => formatInline(line)).join('<br />')}</p>`;
};

/** 위험한 HTML 태그/속성을 제거하여 XSS 방지 */
function sanitizeHtml(html: string): string {
    return html
        // script, iframe, object, embed, form 태그 제거
        .replace(/<\s*\/?\s*(script|iframe|object|embed|form|base|meta|link|style)\b[^>]*>/gi, '')
        // 이벤트 핸들러 속성 제거 (on*)
        .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // javascript: 프로토콜 제거
        .replace(/\b(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""')
        // data: 프로토콜 제거 (이미지 제외)
        .replace(/\b(href|action)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, '$1=""');
}

export function renderDocumentContent(doc: Pick<DocumentFull, 'content' | 'contentFormat'>) {
    if (!doc.content.trim()) return '';
    if (doc.contentFormat === 'html') return sanitizeHtml(doc.content);
    return doc.content.replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => renderBlock(block)).join('');
}
