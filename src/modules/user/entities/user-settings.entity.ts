import {
  BaseEntity,
  Column,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserSettingsDto } from '../dto/user-settings.dto';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_settings' })
export class UserSettingsEntity extends BaseEntity {
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
