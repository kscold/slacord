import { MessageSearchController } from './message-search.controller';

describe('MessageSearchController', () => {
    const mockGetMessageSearchUseCase = {
        execute: jest.fn(),
    };

    let controller: MessageSearchController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MessageSearchController(mockGetMessageSearchUseCase as any);
    });

    it('현재 사용자 기준으로 검색 use case를 호출한다', async () => {
        mockGetMessageSearchUseCase.execute.mockResolvedValue({
            teamCount: 1,
            results: [],
            recentResults: [],
            pinnedResults: [],
        });

        const result = await controller.searchMessages({ userId: 'user-1' }, 'release', '24');

        expect(mockGetMessageSearchUseCase.execute).toHaveBeenCalledWith({
            userId: 'user-1',
            query: 'release',
            limit: 24,
        });
        expect(result).toEqual({
            success: true,
            data: {
                teamCount: 1,
                results: [],
                recentResults: [],
                pinnedResults: [],
            },
        });
    });
});
