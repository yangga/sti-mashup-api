import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';
import { RoleType } from '../../common/constants/role-type';
import { UseDto } from '../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../value-transformers/bool-bit.transformer';
import type { UserDtoOptions } from './dto/user.dto';
import { UserDto } from './dto/user.dto';

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity extends AbstractEntity<UserDto, UserDtoOptions> {
  @Index({ unique: true })
  @Column({ nullable: false })
  username: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  role: RoleType = RoleType.USER;

  @Index({ unique: true })
  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  // nullable: true 은 type 정의가 꼭 필요함.
  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  blockUntilAt?: Date | null;

  @Column({
    type: 'bit',
    transformer: new BoolBitTransformer(),
    nullable: true,
  })
  deleted?: boolean;
}
