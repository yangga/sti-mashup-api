import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { SearchWordType } from '../search.enum';

@Entity({ name: 'searchwords' })
@Index(['type', 'word'], { unique: true })
export class SearchWordEntity extends AbstractEntity {
  @Column({
    type: 'enum',
    enum: SearchWordType,
    nullable: false,
    default: SearchWordType.ETC,
  })
  type: SearchWordType = SearchWordType.ETC;

  @Column({ nullable: false })
  word: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    default: 0,
    transformer: {
      to: (v: unknown) => v,
      from: (v: string) => Number.parseInt(v || '0', 10),
    },
  })
  weight: number;
}
