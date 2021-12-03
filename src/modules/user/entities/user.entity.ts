import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { RoleType } from '../../../common/constants/role.type';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../../value-transformers/bool-bit.transformer';
import { ProjectApplicantEntity } from '../../project/entities/project-applicant.entity';
import { ProjectMemberEntity } from '../../project/entities/project-member.entity';
import type { UserDtoOptions } from '../dto/user.dto';
import { UserDto } from '../dto/user.dto';
import { UserSettingsEntity } from './user-settings.entity';

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

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  passwordChangedAt: Date;

  // nullable: true 은 type 정의가 꼭 필요함.
  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @Column({
    type: 'integer',
    unsigned: true,
    nullable: false,
    default: 1,
    transformer: {
      to: (v: unknown) => v,
      from: (v: string) => Number.parseInt(v || '0', 10),
    },
  })
  level: number;

  @Column({ type: 'simple-array' })
  languages?: string[];

  @Column({ type: 'simple-array' })
  positions?: string[];

  @Column({ type: 'simple-array' })
  interesting?: string[];

  @Column({ type: 'simple-array' })
  skills?: string[];

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

  @OneToOne(() => UserSettingsEntity, (settings) => settings.user)
  @JoinColumn()
  settings: Promise<UserSettingsEntity>;

  @OneToMany(() => ProjectApplicantEntity, (applicant) => applicant.user)
  prjAppliedHistories: Promise<ProjectApplicantEntity[]>;

  @OneToMany(() => ProjectMemberEntity, (member) => member.user)
  prjMemberHistories: Promise<ProjectMemberEntity[]>;
}
