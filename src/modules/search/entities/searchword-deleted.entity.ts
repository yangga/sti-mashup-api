import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity({ name: 'searchwords_deleted' })
export class SearchWordDeletedEntity extends AbstractEntity {
  @Column({ nullable: false, unique: true })
  word: string;
}
