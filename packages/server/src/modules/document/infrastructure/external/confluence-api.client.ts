import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

interface ConfluencePage {
    id: string;
    title: string;
    parentId: string | null;
    content: string;
    url: string | null;
}

@Injectable()
export class ConfluenceApiClient {
    async getSpacePages(input: { siteUrl: string; email: string; apiToken: string; spaceKey: string }) {
        const siteUrl = input.siteUrl.replace(/\/+$/, '');
        const auth = Buffer.from(`${input.email}:${input.apiToken}`).toString('base64');
        const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
        const spaceResponse = await axios.get(`${siteUrl}/wiki/api/v2/spaces`, {
            headers,
            params: { keys: input.spaceKey, limit: 1 },
        });
        const space = spaceResponse.data?.results?.[0];
        if (!space?.id) throw new BadRequestException('Confluence space를 찾지 못했습니다.');

        const pages: ConfluencePage[] = [];
        let nextPath = `/wiki/api/v2/pages?space-id=${space.id}&body-format=storage&limit=100`;
        while (nextPath) {
            const response = await axios.get(nextPath.startsWith('http') ? nextPath : `${siteUrl}${nextPath}`, { headers });
            for (const page of response.data?.results ?? []) {
                pages.push({
                    id: String(page.id),
                    title: page.title,
                    parentId: page.parentId ? String(page.parentId) : null,
                    content: page.body?.storage?.value ?? '',
                    url: page._links?.webui ? `${siteUrl}${page._links.webui}` : null,
                });
            }
            nextPath = response.data?._links?.next ?? '';
        }
        return pages;
    }
}
