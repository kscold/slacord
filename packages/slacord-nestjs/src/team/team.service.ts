import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
}
