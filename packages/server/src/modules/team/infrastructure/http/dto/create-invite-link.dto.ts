import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateInviteLinkDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsIn(['admin', 'member'])
    defaultRole?: 'admin' | 'member';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(9999)
    maxUses?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    expiresInDays?: number;
}
