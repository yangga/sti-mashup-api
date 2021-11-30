import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import _ from 'lodash';
import type { UserDto } from 'modules/user/dto/user.dto';

import type { SearchWordDto, SearchWordsDto } from './dto/searchword.dto';
import type { SearchWordType } from './search.enum';
import { SearchWordRepository } from './searchword.repository';

enum EsIndex {
  AutoCompletionEtc = 'auto_completion_etc',
  AutoCompletionTags = 'auto_completion_tags',
  Users = 'users',
}

const searchWordTypeToEsIndex: Record<SearchWordType, EsIndex> = {
  ETC: EsIndex.AutoCompletionEtc,
  TAG: EsIndex.AutoCompletionTags,
};

// export type SearchMemberParam = {
//   query?: string;
//   username?: string;
//   level?: number;
//   projectResult?: unknown;
//   languages?: string;
//   positions?: string;
//   interesting?: string;
//   skills?: string;

//   sort?: Record<string, 'asc' | 'desc'>;
// };

@Injectable()
export class SearchService {
  constructor(
    private readonly searchWordRepository: SearchWordRepository,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async queryAutoCompletion(
    type: SearchWordType,
    tag: string,
    size: number,
  ): Promise<SearchWordsDto> {
    const index = searchWordTypeToEsIndex[type];

    const res = await this.elasticsearchService.search({
      index,
      body: {
        query: {
          match: {
            word: tag,
          },
        },
        size,
        sort: {
          weight: 'desc',
        },
      },
    });

    const list = _.map(_.get(res, 'body.hits.hits', []), ({ _source }) =>
      _.pick(_source, ['id', 'word', 'weight']),
    );

    return {
      list,
    };
  }

  async putAutoCompletion(
    type: SearchWordType,
    word: string,
  ): Promise<SearchWordDto> {
    const index = searchWordTypeToEsIndex[type];

    const row =
      (await this.searchWordRepository.findOne({
        type,
        word,
      })) || this.searchWordRepository.create({ type, word });

    row.weight = (row.weight || 0) + 1;

    const inserted = await this.searchWordRepository.save(row);

    await this.elasticsearchService.update({
      id: `${inserted.id}`,
      index,
      body: {
        doc: inserted,
        doc_as_upsert: true,
      },
    });

    return inserted;
  }

  async putUser(doc: UserDto): Promise<void> {
    await this.elasticsearchService.update({
      id: `${doc.id}`,
      index: EsIndex.Users,
      body: {
        doc,
        doc_as_upsert: true,
      },
    });
  }
}
