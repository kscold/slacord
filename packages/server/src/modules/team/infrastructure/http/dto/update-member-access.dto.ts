import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateMemberAccessDto {
    @IsOptional()
    @IsIn(['admin', 'member', 'guest'])
    role?: 'admin' | 'member' | 'guest';

    @IsOptional()
    @IsBoolean()
    canManageInvites?: boolean;
}
