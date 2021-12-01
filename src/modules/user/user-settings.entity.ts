import {
  Column,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UseDto } from '../../decorators/use-dto.decorator';
import { UserDto } from './dto/user.dto';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_settings' })
@UseDto(UserDto)
export class UserSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  agreeMarketingAt?: Date | null;

  @OneToOne(() => UserEntity, (user) => user.settings)
  user: Promise<UserEntity>;

  toDto(): UserSettingsDto {
    return new UserSettingsDto(this);
  }
}
