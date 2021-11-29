import { Injectable } from '@nestjs/common';
import _ from 'lodash';

import { SearchService } from '../search/services/search.service';
import type { TagDto } from './dto/tag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly searchService: SearchService,
  ) {}

  async putTag(tag: string): Promise<void> {
    const row =
      (await this.tagRepository.findOne({
        word: tag,
      })) || this.tagRepository.create();

    row.word = tag;
    row.weight = (row.weight || 0) + 1;

    await Promise.all([
      this.tagRepository.save(row),
      this.searchService.putAutoCompletionTag(row),
    ]);
  }

  async getRelatedTags(tag: string): Promise<TagDto[]> {
    return this.searchService.queryAutoCompletionTag(tag, 10);
  }
}
