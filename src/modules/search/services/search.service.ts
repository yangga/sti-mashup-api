import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import _ from 'lodash';
import type { UserEntity } from 'modules/user/user.entity';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async updateUser(doc: UserEntity): Promise<void> {
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
      index: 'users',
      body: {
        doc: docNotSensitive,
        doc_as_upsert: true,
      },
    });
  }
}
