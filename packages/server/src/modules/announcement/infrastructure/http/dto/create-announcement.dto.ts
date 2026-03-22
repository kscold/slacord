import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
    @ApiProperty({ example: '3월 스프린트 일정 공지' })
    @IsString()
    @MinLength(1)
    title: string;

    @ApiProperty({ example: '이번 스프린트는 3/18 ~ 3/31 입니다.' })
    @IsString()
    @MinLength(1)
    content: string;
}
