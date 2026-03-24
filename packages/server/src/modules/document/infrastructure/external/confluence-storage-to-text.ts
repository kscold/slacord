const ENTITY_RE = /&(nbsp|amp|lt|gt|quot|#39);/g;
const ENTITY_MAP: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
};

export function confluenceStorageToHtml(storage: string) {
    return sanitizeHtml(
        storage
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<ac:structured-macro[^>]*ac:name="code"[^>]*>[\s\S]*?<ac:plain-text-body[^>]*>([\s\S]*?)<\/ac:plain-text-body>[\s\S]*?<\/ac:structured-macro>/gi, (_match, code) => `<pre><code>${escapeHtml(decodeEntities(code.trim()))}</code></pre>`)
            .replace(/<ac:task-list>([\s\S]*?)<\/ac:task-list>/gi, (_match, body) => `<ul class="slacord-task-list">${body.replace(/<ac:task>([\s\S]*?)<\/ac:task>/gi, (_task, taskBody) => taskMacroToHtml(taskBody))}</ul>`)
            .replace(/<ac:structured-macro[^>]*ac:name="(info|note|tip|warning|panel)"[^>]*>[\s\S]*?<ac:rich-text-body>([\s\S]*?)<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/gi, (_match, kind, body) => `<div class="slacord-callout slacord-callout-${kind.toLowerCase()}">${body}</div>`)
            .replace(/<\/?ac:layout-section[^>]*>/gi, '<section>')
            .replace(/<\/?ac:layout-cell[^>]*>/gi, '<div>')
            .replace(/<\/?ac:rich-text-body[^>]*>/gi, '')
            .replace(/<ac:link>[\s\S]*?<ri:url[^>]*ri:value="([^"]+)"[^>]*\/>[\s\S]*?<\/ac:link>/gi, (_match, url) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`)
            .replace(/<ac:link>[\s\S]*?<ri:page[^>]*ri:content-title="([^"]+)"[^>]*\/>[\s\S]*?<\/ac:link>/gi, (_match, title) => `<span>${escapeHtml(title)}</span>`)
            .replace(/<\/?(?:ac|ri):[^>]+>/gi, '')
            .replace(/<colgroup[\s\S]*?<\/colgroup>/gi, '')
            .trim(),
    );
}

function taskMacroToHtml(taskBody: string) {
    const status = /<ac:task-status>([\s\S]*?)<\/ac:task-status>/i.exec(taskBody)?.[1]?.trim() ?? 'incomplete';
    const body = /<ac:task-body>([\s\S]*?)<\/ac:task-body>/i.exec(taskBody)?.[1]?.trim() ?? '';
    return `<li><label class="slacord-task-item"><input type="checkbox" disabled ${status === 'complete' ? 'checked' : ''} /><span>${body}</span></label></li>`;
}

function sanitizeHtml(html: string) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
}

function decodeEntities(value: string) {
    return value.replace(ENTITY_RE, (entity) => ENTITY_MAP[entity] ?? entity);
}

function escapeHtml(value: string) {
    return decodeEntities(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
    return value.replace(/"/g, '&quot;');
}
