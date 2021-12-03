import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { ProjectMemberRoleType } from '../../../common/constants/project-member-role.type';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { ProjectMemberDto } from '../dto/project-member.dto';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'project_members' })
@UseDto(ProjectMemberDto)
@Index(['project', 'user'], { unique: true })
export class ProjectMemberEntity extends AbstractEntity<ProjectMemberDto> {
  @ManyToOne(() => ProjectEntity, (project) => project.members)
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, (user) => user.prjMemberHistories)
  user: UserEntity;

  @Index()
  @Column({ nullable: false })
  position: string;

  @Column({
    type: 'enum',
    enum: ProjectMemberRoleType,
    default: ProjectMemberRoleType.GUEST,
  })
  role: ProjectMemberRoleType = ProjectMemberRoleType.GUEST;
}
