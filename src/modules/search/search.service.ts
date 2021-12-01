/* eslint-disable unicorn/no-array-for-each */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Interval } from '@nestjs/schedule';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import Bodybuilder from 'bodybuilder';
import _ from 'lodash';
import type { UserDto } from 'modules/user/dto/user.dto';

import type { MemberOptionsDto } from './dto/member-options.dto';
import { PaginatedResultDto } from './dto/paginated-result.dto';
import type { SearchWordDto, SearchWordsDto } from './dto/searchword.dto';
import { SearchWordRepository } from './repositories/searchword.repository';
import { SearchWordDeletedRepository } from './repositories/searchword-deleted.repository';
import { SearchWordType } from './search.enum';

enum EsIndex {
  AutoCompletionEtc = 'auto_completion_etc',
  AutoCompletionPositions = 'auto_completion_positions',
  AutoCompletionProjects = 'auto_completion_projects',
  AutoCompletionSkills = 'auto_completion_skills',
  AutoCompletionTags = 'auto_completion_tags',
  Projects = 'projects',
  Users = 'users',
}

const searchWordTypeToEsIndex: Record<SearchWordType, EsIndex> = {
  ETC: EsIndex.AutoCompletionEtc,
  POS: EsIndex.AutoCompletionPositions,
  PRJ: EsIndex.AutoCompletionProjects,
  SKL: EsIndex.AutoCompletionSkills,
  TAG: EsIndex.AutoCompletionTags,
};

interface IPutAutoCompletionQueueType {
  type: SearchWordType;
  word: string;
}

@Injectable()
export class SearchService {
  _qAutoCompletion: IPutAutoCompletionQueueType[] = [];

  constructor(
    @InjectSentry() private readonly sentry: SentryService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly searchWordRepository: SearchWordRepository,
    private readonly searchWordDeletedRepository: SearchWordDeletedRepository,
  ) {}

  async queryAutoCompletion(
    type: SearchWordType | undefined,
    query: string,
    size = 10,
  ): Promise<SearchWordsDto> {
    const index = type ? searchWordTypeToEsIndex[type] : 'auto_completion*';

    const res = await this.elasticsearchService.search({
      index,
      body: Bodybuilder()
        .query('match', 'word', query)
        .size(size)
        .sort('weight', 'desc')
        .build(),
    });

    const list = _.map(_.get(res, 'body.hits.hits', []), ({ _source }) =>
      _.pick(_source, ['word', 'weight']),
    );

    return {
      list,
    };
  }

  async deleteAutoCompletion(
    type: SearchWordType,
    _word: string,
  ): Promise<void> {
    const word = _word.toUpperCase();

    try {
      const rowDeleted = await this.searchWordDeletedRepository.findOne({
        word,
      });

      if (!rowDeleted) {
        await this.searchWordDeletedRepository.insert({ word });
      }
    } catch (error) {
      this.sentry.instance().captureException(error);
    }

    const index = searchWordTypeToEsIndex[type];

    const row = await this.searchWordRepository.findOne({
      type,
      word,
    });

    if (!row) {
      return;
    }

    await this.elasticsearchService.delete({
      index,
      id: `${row.id}`,
    });

    await this.searchWordRepository.remove(row);
  }

  async putAutoCompletion(
    type: SearchWordType,
    _word: string,
    throwOnDeleted = true,
  ): Promise<SearchWordDto | undefined> {
    const word = _word.toUpperCase();

    if (
      await this.searchWordDeletedRepository.findOne({
        word,
      })
    ) {
      if (throwOnDeleted) {
        throw new ForbiddenException();
      }

      return undefined;
    }

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async queryUser(
    params: MemberOptionsDto,
  ): Promise<PaginatedResultDto<UserDto>> {
    const index = EsIndex.Users;

    const from = params.from ? params.from : 0;
    const size = params?.size && params.size > 0 ? params.size : 10;

    const body = _.chain(Bodybuilder())
      .tap((bb) => bb.notFilter('term', 'deleted', 'true'))
      .tap((bb) => {
        // range filtering
        const fields = ['level'];

        for (const field of fields) {
          const range = _.omitBy(
            {
              gte: params[`${field}Min`],
              lte: params[`${field}Max`],
            },
            // eslint-disable-next-line @typescript-eslint/unbound-method
            _.isUndefined,
          );

          if (_.keys(range).length > 0) {
            bb.andFilter('range', field, range);
          }
        }
      })
      .tap((bb) => {
        // records field
        const fields = [
          'prjCreated',
          'prjStarted',
          'prjFinished',
          'prjDropped',
        ];

        for (const field of fields) {
          const minField = `${field}Min`,
            maxField = `${field}Max`;

          if (params[minField]) {
            bb.addFilter('nested', {
              path: 'records',
              ...Bodybuilder()
                .query('range', `records.${field}`, {
                  gte: params[minField],
                })
                .build(),
            });
          }

          if (params[maxField]) {
            bb.addFilter('nested', {
              path: 'records',
              ...Bodybuilder()
                .query('range', `records.${field}`, {
                  lte: params[maxField],
                })
                .build(),
            });
          }
        }
      })
      .tap((bb) => {
        // text querying
        const fields = [
          'username',
          'languages',
          'positions',
          'interesting',
          'skills',
        ];

        for (const field of fields) {
          if (params[field]) {
            const v = params[field];

            if (Array.isArray(v)) {
              for (const ve of v) {
                bb.addQuery('match', field, ve);
              }
            } else {
              bb.addQuery('match', field, v);
            }
          }
        }
      })
      .tap((bb) => {
        if (params.sortKey) {
          bb.sort(params.sortKey, params.sortDirection || 'asc');
        }

        bb.from(from).size(size);
      })
      .value()
      .build();

    const res = await this.elasticsearchService.search({
      index,
      body,
    });

    const data = _.map(
      _.get(res, 'body.hits.hits', []),
      ({ _source }) => _source as UserDto,
    );
    const total = _.get(res, 'body.hits.total.value', 0);
    const took = _.get(res, 'body.took', 0);

    if (total > 0) {
      const mapping = {
        interesting: SearchWordType.TAG,
        positions: SearchWordType.POSITION,
        skills: SearchWordType.SKILL,
      };
      const fields = _.keys(mapping);

      for (const field of fields) {
        if (!params[field]) {
          continue;
        }

        if (Array.isArray(params[field])) {
          const list = params[field];

          for (const word of list) {
            this._qAutoCompletion.push({
              type: mapping[field],
              word,
            });
          }
        } else {
          this._qAutoCompletion.push({
            type: mapping[field],
            word: params[field],
          });
        }
      }
    }

    return new PaginatedResultDto<UserDto>(data, total, from, size, took);
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

  @Interval(1000)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  private async daemonQueuedAutoCompletion(): Promise<void> {
    if (this._qAutoCompletion.length === 0) {
      return;
    }

    const list = this._qAutoCompletion;
    this._qAutoCompletion = [];

    await Promise.allSettled(
      list.map((e) => this.putAutoCompletion(e.type, e.word, false)),
    );
  }
}
