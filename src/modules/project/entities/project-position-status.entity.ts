import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'project_position_status' })
@Index(['position', 'project'], { unique: true })
export class ProjectPositionStatusEntity extends AbstractEntity {
  @Column({ nullable: false })
  position: string;

  @ManyToOne(() => ProjectEntity, (project) => project.positionStatus)
  project: ProjectEntity;

  @Column({
    type: 'smallint',
    unsigned: true,
    nullable: false,
    default: 0,
  })
  openCnt: number;

  @Column({
    type: 'smallint',
    unsigned: true,
    nullable: false,
    default: 0,
  })
  closeCnt: number;
}
