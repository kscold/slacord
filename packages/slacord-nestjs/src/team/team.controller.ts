import { Controller, Get, Post, Put, Delete, Body, Param, Logger, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TeamService } from './team.service';

import { Team } from '../schema/team.schema';
import { Room } from '../schema/room.schema';

/**
 * Team & Room 관리 API 컨트롤러
 */
@Controller('teams')
export class TeamController {
    private readonly logger = new Logger(TeamController.name);

    constructor(private readonly teamService: TeamService) {}

    /**
     * 채널 생성 (중앙집중식 MVP)
     * POST /api/teams
     * - JWT 인증 필수
     * - Slacord 공식 Slack/Discord에 채널 자동 생성
     */
    @Post()
    @UseGuards(AuthGuard('jwt'))
    async createTeam(@Request() req: any, @Body() body: { name: string; description?: string }) {
        this.logger.log(`[createTeam] 채널 생성 요청: ${body.name}`);

        // JwtStrategy의 validate()에서 반환한 userId 사용
        const userId = req.user.userId;
        this.logger.log(`[createTeam] 사용자 ID: ${userId}`);

        const team = await this.teamService.createTeam(body.name, body.description, userId);

        return {
            success: true,
            data: team,
            message: '채널이 생성되었습니다.',
        };
    }

    /**
     * 모든 팀 조회
     * GET /api/teams
     */
    @Get()
    async getAllTeams() {
        this.logger.log('[getAllTeams] 팀 목록 조회');

        const teams = await this.teamService.getAllTeams();

        return {
            success: true,
            data: teams,
            count: teams.length,
        };
    }

    /**
     * 팀 상세 조회
     * GET /api/teams/:teamId
     */
    @Get(':teamId')
    async getTeamById(@Param('teamId') teamId: string) {
        this.logger.log(`[getTeamById] 팀 조회: ${teamId}`);

        const team = await this.teamService.getTeamById(teamId);

        return {
            success: true,
            data: team,
        };
    }

    /**
     * 팀 수정
     * PUT /api/teams/:teamId
     */
    @Put(':teamId')
    async updateTeam(@Param('teamId') teamId: string, @Body() updateData: Partial<Team>) {
        this.logger.log(`[updateTeam] 팀 수정: ${teamId}`);

        const updated = await this.teamService.updateTeam(teamId, updateData);

        return {
            success: true,
            data: updated,
            message: '팀이 수정되었습니다.',
        };
    }

    /**
     * 팀 삭제
     * DELETE /api/teams/:teamId
     */
    @Delete(':teamId')
    async deleteTeam(@Param('teamId') teamId: string) {
        this.logger.log(`[deleteTeam] 팀 삭제: ${teamId}`);

        await this.teamService.deleteTeam(teamId);

        return {
            success: true,
            message: '팀이 삭제되었습니다.',
        };
    }

    /**
     * Room 생성
     * POST /api/teams/:teamId/rooms
     */
    @Post(':teamId/rooms')
    async createRoom(@Param('teamId') teamId: string, @Body() roomData: Partial<Room>) {
        this.logger.log(`[createRoom] Room 생성 요청: ${roomData.name}`);

        const room = await this.teamService.createRoom({ ...roomData, teamId: teamId as any });

        return {
            success: true,
            data: room,
            message: 'Room이 생성되었습니다.',
        };
    }

    /**
     * 팀의 모든 Room 조회
     * GET /api/teams/:teamId/rooms
     */
    @Get(':teamId/rooms')
    async getRoomsByTeam(@Param('teamId') teamId: string) {
        this.logger.log(`[getRoomsByTeam] Room 목록 조회: ${teamId}`);

        const rooms = await this.teamService.getRoomsByTeam(teamId);

        return {
            success: true,
            data: rooms,
            count: rooms.length,
        };
    }

    /**
     * Room 상세 조회
     * GET /api/teams/rooms/:roomId
     */
    @Get('rooms/:roomId')
    async getRoomById(@Param('roomId') roomId: string) {
        this.logger.log(`[getRoomById] Room 조회: ${roomId}`);

        const room = await this.teamService.getRoomById(roomId);

        return {
            success: true,
            data: room,
        };
    }

    /**
     * Room 수정
     * PUT /api/teams/rooms/:roomId
     */
    @Put('rooms/:roomId')
    async updateRoom(@Param('roomId') roomId: string, @Body() updateData: Partial<Room>) {
        this.logger.log(`[updateRoom] Room 수정: ${roomId}`);

        const updated = await this.teamService.updateRoom(roomId, updateData);

        return {
            success: true,
            data: updated,
            message: 'Room이 수정되었습니다.',
        };
    }

    /**
     * Room 삭제
     * DELETE /api/teams/rooms/:roomId
     */
    @Delete('rooms/:roomId')
    async deleteRoom(@Param('roomId') roomId: string) {
        this.logger.log(`[deleteRoom] Room 삭제: ${roomId}`);

        await this.teamService.deleteRoom(roomId);

        return {
            success: true,
            message: 'Room이 삭제되었습니다.',
        };
    }

    /**
     * 초대 링크 생성 (팀장만 가능)
     * POST /api/teams/:teamId/invite
     */
    @Post(':teamId/invite')
    @UseGuards(AuthGuard('jwt'))
    async generateInviteLink(
        @Param('teamId') teamId: string,
        @Query('expiresInDays') expiresInDays?: number,
        @Query('maxUses') maxUses?: number,
    ) {
        this.logger.log(`[generateInviteLink] 초대 링크 생성: ${teamId}`);

        const result = await this.teamService.generateInviteLink(teamId, expiresInDays || 7, maxUses);

        return {
            success: true,
            data: result,
            message: '초대 링크가 생성되었습니다.',
        };
    }

    /**
     * 초대 링크로 팀 참여
     * POST /api/teams/join/:inviteToken
     */
    @Post('join/:inviteToken')
    @UseGuards(AuthGuard('jwt'))
    async joinTeamByInvite(@Param('inviteToken') inviteToken: string, @Request() req: any) {
        this.logger.log(`[joinTeamByInvite] 팀 참여 요청: ${inviteToken}`);

        const userId = req.user._id;
        const team = await this.teamService.joinTeamByInvite(inviteToken, userId);

        return {
            success: true,
            data: team,
            message: '팀에 참여했습니다.',
        };
    }

    /**
     * 초대 링크 비활성화
     * DELETE /api/teams/:teamId/invite
     */
    @Delete(':teamId/invite')
    @UseGuards(AuthGuard('jwt'))
    async deactivateInviteLink(@Param('teamId') teamId: string) {
        this.logger.log(`[deactivateInviteLink] 초대 링크 비활성화: ${teamId}`);

        await this.teamService.deactivateInviteLink(teamId);

        return {
            success: true,
            message: '초대 링크가 비활성화되었습니다.',
        };
    }

    /**
     * 팀 멤버 목록 조회
     * GET /api/teams/:teamId/members
     */
    @Get(':teamId/members')
    @UseGuards(AuthGuard('jwt'))
    async getTeamMembers(@Param('teamId') teamId: string) {
        this.logger.log(`[getTeamMembers] 멤버 목록 조회: ${teamId}`);

        const members = await this.teamService.getTeamMembers(teamId);

        return {
            success: true,
            data: members,
            count: members.length,
        };
    }

    /**
     * 팀 멤버 제거 (팀장만 가능)
     * DELETE /api/teams/:teamId/members/:userId
     */
    @Delete(':teamId/members/:userId')
    @UseGuards(AuthGuard('jwt'))
    async removeMember(@Param('teamId') teamId: string, @Param('userId') userId: string, @Request() req: any) {
        this.logger.log(`[removeMember] 멤버 제거: ${teamId} - ${userId}`);

        const requestUserId = req.user._id;
        await this.teamService.removeMember(teamId, userId, requestUserId);

        return {
            success: true,
            message: '멤버가 제거되었습니다.',
        };
    }
}
