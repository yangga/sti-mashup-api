import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { ProjectMemberRoleType } from '../../../common/constants/project-member-role.type';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../../value-transformers/bool-bit.transformer';
import { UserEntity } from '../../user/entities/user.entity';
import { ProjectMemberDto } from '../dto/project-member.dto';
import { ProjectEntity } from './project.entity';
import { ProjectMemberPositionEntity } from './project-member-position.entity';

@Entity({ name: 'project_members' })
@UseDto(ProjectMemberDto)
@Index(['project', 'user'], { unique: true })
export class ProjectMemberEntity extends AbstractEntity<ProjectMemberDto> {
  @ManyToOne(() => ProjectEntity, (project) => project.members)
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, (user) => user.prjMember)
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: ProjectMemberRoleType,
    default: ProjectMemberRoleType.GUEST,
  })
  role: ProjectMemberRoleType = ProjectMemberRoleType.GUEST;

  @OneToMany(() => ProjectMemberPositionEntity, (position) => position.member)
  positions: ProjectMemberPositionEntity[];

  @Column({
    type: 'bit',
    transformer: new BoolBitTransformer(),
    nullable: true,
  })
  deleted?: boolean;
}
