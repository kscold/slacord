import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateMemberAccessDto {
    @IsOptional()
    @IsIn(['admin', 'member'])
    role?: 'admin' | 'member';

    @IsOptional()
    @IsBoolean()
    canManageInvites?: boolean;
}
