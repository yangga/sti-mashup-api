import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CommonHeader } from '../../decorators/common-header.decorator';
import { ResponseData } from '../../decorators/response-data.decorators';
import { TagsDto } from './dto/tag.dto';
import { TagService } from './tag.service';

@CommonHeader()
@Controller({ path: 'tags', version: '1' })
@ApiTags('tags')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('/')
  @ApiOperation({
    summary: '',
    description: 'Search recommend tags',
  })
  @ResponseData(TagsDto)
  async getTags(@Query('query') query: string): Promise<TagsDto> {
    const tags = await this.tagService.getRelatedTags(query);

    return {
      tags,
    };
  }
}
