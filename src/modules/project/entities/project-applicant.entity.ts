import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../../value-transformers/bool-bit.transformer';
import { UserEntity } from '../../user/entities/user.entity';
import { ProjectApplicantDto } from '../dto/project-applicant.dto';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'project_applicants' })
@UseDto(ProjectApplicantDto)
@Index(['project', 'user'], { unique: true })
export class ProjectApplicantEntity extends AbstractEntity<ProjectApplicantDto> {
  @ManyToOne(() => ProjectEntity, (project) => project.applicants)
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, (user) => user.prjAppliedHistories)
  user: UserEntity;

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
