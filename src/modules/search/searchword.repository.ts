import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { SearchWordEntity } from './entities/searchword.entity';

@EntityRepository(SearchWordEntity)
export class SearchWordRepository extends Repository<SearchWordEntity> {}
