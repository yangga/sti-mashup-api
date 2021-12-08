import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../../value-transformers/bool-bit.transformer';
import { ProjectMemberPositionDto } from '../dto/project-member-position.dto';
import { ProjectMemberEntity } from './project-member.entity';

@Entity({ name: 'project_member_positions' })
@UseDto(ProjectMemberPositionDto)
@Index(['member', 'position'], { unique: true })
export class ProjectMemberPositionEntity extends AbstractEntity<ProjectMemberPositionDto> {
  @ManyToOne(() => ProjectMemberEntity, (project) => project.positions)
  member: ProjectMemberEntity;

  @Index()
  @Column({ nullable: false })
  position: string;

  @Column({
    type: 'bit',
    transformer: new BoolBitTransformer(),
    nullable: true,
  })
  deleted?: boolean;
}
