import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import _ from 'lodash';
import type { TagDto } from 'modules/tag/dto/tag.dto';
import type { TagEntity } from 'modules/tag/tag.entity';
import type { UserEntity } from 'modules/user/user.entity';

enum EsIndex {
  AutoCompletionTags = 'auto_completion_tags',
  Users = 'users',
}

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async queryAutoCompletionTag(tag: string, size: number): Promise<TagDto[]> {
    const res = await this.elasticsearchService.search({
      index: EsIndex.AutoCompletionTags,
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

    return _.map(_.get(res, 'body.hits.hits', []), ({ _source }) =>
      _.pick(_source, ['word', 'weight']),
    );
  }

  async putAutoCompletionTag(doc: TagEntity): Promise<void> {
    await this.elasticsearchService.update({
      id: `${doc.id}`,
      index: EsIndex.Users,
      body: {
        doc,
        doc_as_upsert: true,
      },
    });
  }

  async putUser(doc: UserEntity): Promise<void> {
    const docNotSensitive = _.omitBy(
      {
        ...doc,
        password: undefined,
        blockUntilAt: undefined,
      },
      // eslint-disable-next-line @typescript-eslint/unbound-method
      _.isUndefined,
    );

    await this.elasticsearchService.update({
      id: `${docNotSensitive.id}`,
      index: EsIndex.Users,
      body: {
        doc: docNotSensitive,
        doc_as_upsert: true,
      },
    });
  }
}
