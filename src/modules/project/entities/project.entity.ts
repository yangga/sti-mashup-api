import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { ProjectStateType } from '../../../common/constants/project-state.type';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { BoolBitTransformer } from '../../../value-transformers/bool-bit.transformer';
import type { ProjectDtoOptions } from '../dto/project.dto';
import { ProjectDto } from '../dto/project.dto';
import { ProjectApplicantEntity } from './project-applicant.entity';
import { ProjectMemberEntity } from './project-member.entity';
import { ProjectPositionStatusEntity } from './project-position-status.entity';

@Entity({ name: 'projects' })
@UseDto(ProjectDto)
export class ProjectEntity extends AbstractEntity<
  ProjectDto,
  ProjectDtoOptions
> {
  @Index()
  @Column({
    type: 'enum',
    enum: ProjectStateType,
    default: ProjectStateType.OPEN,
  })
  state: ProjectStateType = ProjectStateType.OPEN;

  @Column({ type: 'simple-array' })
  languages: string[];

  @Column({ nullable: false })
  title: string;

  // nullable: true 은 type 정의가 꼭 필요함.
  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @Column({ nullable: false })
  descriptionHtml: string;

  @Column({ nullable: true })
  teamIntroHtml: string;

  @Column({ nullable: true })
  profitShare: string;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[];

  @Column({ type: 'simple-array' })
  tags: string[];

  @Column({
    type: 'timestamp',
  })
  beginAt?: Date;

  @Column({
    type: 'smallint',
    unsigned: true,
  })
  period?: number;

  @OneToMany(() => ProjectPositionStatusEntity, (ps) => ps.project)
  positionStatus: Promise<ProjectPositionStatusEntity[]>;

  @OneToMany(() => ProjectApplicantEntity, (applicant) => applicant.project)
  applicants: Promise<ProjectApplicantEntity[]>;

  @OneToMany(() => ProjectMemberEntity, (member) => member.project)
  members: Promise<ProjectMemberEntity[]>;

  @Column({
    type: 'bit',
    transformer: new BoolBitTransformer(),
    nullable: true,
  })
  deleted?: boolean;
}
