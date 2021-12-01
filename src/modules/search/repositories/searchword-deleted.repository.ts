import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { SearchWordDeletedEntity } from '../entities/searchword-deleted.entity';

@EntityRepository(SearchWordDeletedEntity)
export class SearchWordDeletedRepository extends Repository<SearchWordDeletedEntity> {}
