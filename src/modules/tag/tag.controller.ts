import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role-type';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { SearchWordType } from '../../modules/search/search.enum';
import { SearchService } from '../../modules/search/search.service';
import type { SearchWordDto } from '../search/dto/searchword.dto';
import {
  SearchWordCreateDto,
  SearchWordsDto,
} from '../search/dto/searchword.dto';

@CommonHeader()
@Controller({ path: 'tags', version: '1' })
@ApiTags('tags')
export class TagController {
  constructor(private searchService: SearchService) {}

  @Get('/ac')
  @ApiOperation({
    summary: '',
    description: 'Search recommend tags',
  })
  @ResponseData(SearchWordsDto)
  async getTags(@Query('query') query: string): Promise<SearchWordsDto> {
    return this.searchService.queryAutoCompletion(
      SearchWordType.TAG,
      query,
      10,
    );
  }

  @Post('/')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  async createTag(@Body() body: SearchWordCreateDto): Promise<SearchWordDto> {
    return this.searchService.putAutoCompletion(
      SearchWordType.TAG,
      body.word.toUpperCase(),
    );
  }
}
