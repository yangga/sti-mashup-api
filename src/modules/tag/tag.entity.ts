import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';

@Entity({ name: 'tags' })
export class TagEntity extends AbstractEntity {
  @Index({ unique: true })
  @Column({ nullable: false })
  word: string;

  @Column({ type: 'bigint', nullable: false, default: 0 })
  weight: number;
}
