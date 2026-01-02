import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Team, TeamDocument } from './team.schema';
import { Room, RoomDocument } from './room.schema';

/**
 * Team 관리 서비스
 */
@Injectable()
export class TeamService {
    private readonly logger = new Logger(TeamService.name);

    constructor(
        @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
        @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    ) {}

    /**
     * 팀 생성
     */
    async createTeam(teamData: Partial<Team>): Promise<TeamDocument> {
        try {
            const team = new this.teamModel(teamData);
            const saved = await team.save();
            this.logger.log(`[createTeam] 팀 생성 완료: ${saved.name}`);
            return saved;
        } catch (error) {
            this.logger.error(`[createTeam] 팀 생성 실패: ${error.message}`, error.stack);
            throw new BadRequestException('팀 생성에 실패했습니다.');
        }
    }

    /**
     * 모든 팀 조회
     */
    async getAllTeams(): Promise<TeamDocument[]> {
        try {
            const teams = await this.teamModel.find().sort({ createdAt: -1 }).exec();
            this.logger.log(`[getAllTeams] 팀 목록 조회: ${teams.length}개`);
            return teams;
        } catch (error) {
            this.logger.error(`[getAllTeams] 팀 목록 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 팀 상세 조회
     */
    async getTeamById(teamId: string): Promise<TeamDocument> {
        try {
            const team = await this.teamModel.findById(teamId).exec();
            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }
            return team;
        } catch (error) {
            this.logger.error(`[getTeamById] 팀 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 팀 수정
     */
    async updateTeam(teamId: string, updateData: Partial<Team>): Promise<TeamDocument> {
        try {
            const updated = await this.teamModel
                .findByIdAndUpdate(teamId, { ...updateData, updatedAt: new Date() }, { new: true })
                .exec();

            if (!updated) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            this.logger.log(`[updateTeam] 팀 수정 완료: ${updated.name}`);
            return updated;
        } catch (error) {
            this.logger.error(`[updateTeam] 팀 수정 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 팀 삭제
     */
    async deleteTeam(teamId: string): Promise<void> {
        try {
            // 팀에 속한 모든 Room 삭제
            await this.roomModel.deleteMany({ teamId: new Types.ObjectId(teamId) }).exec();

            // 팀 삭제
            const deleted = await this.teamModel.findByIdAndDelete(teamId).exec();
            if (!deleted) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            this.logger.log(`[deleteTeam] 팀 삭제 완료: ${deleted.name}`);
        } catch (error) {
            this.logger.error(`[deleteTeam] 팀 삭제 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Room 생성
     */
    async createRoom(roomData: Partial<Room>): Promise<RoomDocument> {
        try {
            // 팀 존재 확인
            const team = await this.teamModel.findById(roomData.teamId).exec();
            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            const room = new this.roomModel(roomData);
            const saved = await room.save();
            this.logger.log(`[createRoom] Room 생성 완료: ${saved.name} (팀: ${team.name})`);
            return saved;
        } catch (error) {
            this.logger.error(`[createRoom] Room 생성 실패: ${error.message}`, error.stack);
            throw new BadRequestException('Room 생성에 실패했습니다.');
        }
    }

    /**
     * 팀의 모든 Room 조회
     */
    async getRoomsByTeam(teamId: string): Promise<RoomDocument[]> {
        try {
            const rooms = await this.roomModel.find({ teamId: new Types.ObjectId(teamId) }).sort({ createdAt: -1 }).exec();
            this.logger.log(`[getRoomsByTeam] Room 목록 조회: ${rooms.length}개`);
            return rooms;
        } catch (error) {
            this.logger.error(`[getRoomsByTeam] Room 목록 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Room 상세 조회
     */
    async getRoomById(roomId: string): Promise<RoomDocument> {
        try {
            const room = await this.roomModel.findById(roomId).exec();
            if (!room) {
                throw new NotFoundException('Room을 찾을 수 없습니다.');
            }
            return room;
        } catch (error) {
            this.logger.error(`[getRoomById] Room 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Room 수정
     */
    async updateRoom(roomId: string, updateData: Partial<Room>): Promise<RoomDocument> {
        try {
            const updated = await this.roomModel
                .findByIdAndUpdate(roomId, { ...updateData, updatedAt: new Date() }, { new: true })
                .exec();

            if (!updated) {
                throw new NotFoundException('Room을 찾을 수 없습니다.');
            }

            this.logger.log(`[updateRoom] Room 수정 완료: ${updated.name}`);
            return updated;
        } catch (error) {
            this.logger.error(`[updateRoom] Room 수정 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Room 삭제
     */
    async deleteRoom(roomId: string): Promise<void> {
        try {
            const deleted = await this.roomModel.findByIdAndDelete(roomId).exec();
            if (!deleted) {
                throw new NotFoundException('Room을 찾을 수 없습니다.');
            }

            this.logger.log(`[deleteRoom] Room 삭제 완료: ${deleted.name}`);
        } catch (error) {
            this.logger.error(`[deleteRoom] Room 삭제 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Slack 채널 ID로 Room 조회
     */
    async getRoomBySlackChannel(slackChannelId: string): Promise<RoomDocument | null> {
        try {
            const room = await this.roomModel.findOne({ 'slackChannel.channelId': slackChannelId }).exec();
            return room;
        } catch (error) {
            this.logger.error(`[getRoomBySlackChannel] Room 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Room 메시지 카운트 증가
     */
    async incrementMessageCount(roomId: string): Promise<void> {
        try {
            await this.roomModel
                .findByIdAndUpdate(roomId, {
                    $inc: { messageCount: 1 },
                    lastBackupAt: new Date(),
                })
                .exec();
        } catch (error) {
            this.logger.error(`[incrementMessageCount] 카운트 증가 실패: ${error.message}`, error.stack);
        }
    }

    /**
     * 초대 링크 생성
     */
    async generateInviteLink(
        teamId: string,
        expiresInDays: number = 7,
        maxUses?: number,
    ): Promise<{ inviteToken: string; inviteUrl: string }> {
        try {
            const team = await this.teamModel.findById(teamId).exec();
            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            // 랜덤 토큰 생성
            const inviteToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            // 팀에 초대 링크 정보 저장
            team.inviteLink = {
                token: inviteToken,
                expiresAt,
                isActive: true,
                maxUses,
                currentUses: 0,
            };

            await team.save();

            const inviteUrl = `https://slacord.cloud/invite/${inviteToken}`;

            this.logger.log(`[generateInviteLink] 초대 링크 생성: ${team.name}`);
            return { inviteToken, inviteUrl };
        } catch (error) {
            this.logger.error(`[generateInviteLink] 초대 링크 생성 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 초대 링크로 팀 참여
     */
    async joinTeamByInvite(inviteToken: string, userId: Types.ObjectId): Promise<TeamDocument> {
        try {
            const team = await this.teamModel.findOne({ 'inviteLink.token': inviteToken }).exec();

            if (!team) {
                throw new BadRequestException('유효하지 않은 초대 링크입니다.');
            }

            if (!team.inviteLink || !team.inviteLink.isActive) {
                throw new BadRequestException('비활성화된 초대 링크입니다.');
            }

            if (new Date() > team.inviteLink.expiresAt) {
                throw new BadRequestException('만료된 초대 링크입니다.');
            }

            if (team.inviteLink.maxUses && team.inviteLink.currentUses >= team.inviteLink.maxUses) {
                throw new BadRequestException('초대 링크 사용 횟수가 초과되었습니다.');
            }

            // 이미 팀 멤버인지 확인
            const isMember = team.members.some((member) => member.userId.toString() === userId.toString());
            if (isMember) {
                throw new BadRequestException('이미 팀에 참여하고 있습니다.');
            }

            // 팀에 멤버 추가
            team.members.push({
                userId,
                role: 'member',
                joinedAt: new Date(),
            });

            // 초대 링크 사용 횟수 증가
            team.inviteLink.currentUses += 1;

            await team.save();

            this.logger.log(`[joinTeamByInvite] 팀 참여 완료: ${team.name}`);
            return team;
        } catch (error) {
            this.logger.error(`[joinTeamByInvite] 팀 참여 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 초대 링크 비활성화
     */
    async deactivateInviteLink(teamId: string): Promise<void> {
        try {
            const team = await this.teamModel.findById(teamId).exec();
            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            if (team.inviteLink) {
                team.inviteLink.isActive = false;
                await team.save();
                this.logger.log(`[deactivateInviteLink] 초대 링크 비활성화: ${team.name}`);
            }
        } catch (error) {
            this.logger.error(`[deactivateInviteLink] 초대 링크 비활성화 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 팀 멤버 목록 조회
     */
    async getTeamMembers(teamId: string): Promise<any[]> {
        try {
            const team = await this.teamModel.findById(teamId).populate('members.userId', 'username email profileImage').exec();

            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            return team.members;
        } catch (error) {
            this.logger.error(`[getTeamMembers] 멤버 목록 조회 실패: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 팀 멤버 제거 (팀장만 가능)
     */
    async removeMember(teamId: string, userId: string, requestUserId: Types.ObjectId): Promise<void> {
        try {
            const team = await this.teamModel.findById(teamId).exec();

            if (!team) {
                throw new NotFoundException('팀을 찾을 수 없습니다.');
            }

            // 팀장 권한 확인
            if (team.ownerId.toString() !== requestUserId.toString()) {
                throw new BadRequestException('팀장만 멤버를 제거할 수 있습니다.');
            }

            // 팀장은 제거할 수 없음
            if (userId === requestUserId.toString()) {
                throw new BadRequestException('팀장은 스스로를 제거할 수 없습니다.');
            }

            // 멤버 제거
            team.members = team.members.filter((member) => member.userId.toString() !== userId);
            await team.save();

            this.logger.log(`[removeMember] 멤버 제거 완료: ${team.name}`);
        } catch (error) {
            this.logger.error(`[removeMember] 멤버 제거 실패: ${error.message}`, error.stack);
            throw error;
        }
    }
}
