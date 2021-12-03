import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role.type';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import LocaleCodes from '../../i18n/locale-short-codes.json';
import type { SearchWordDto } from '../search/dto/searchword.dto';
import {
  SearchWordCreateDto,
  SearchWordsDto,
} from '../search/dto/searchword.dto';
import { SearchWordType } from '../search/search.enum';
import { SearchService } from '../search/search.service';

@CommonHeader()
@Controller({ path: 'meta', version: '1' })
@ApiTags('meta')
export class MetaController {
  constructor(private searchService: SearchService) {}

  @Get('/languages')
  @ApiOperation({
    summary: '',
    description: 'Get all language list',
  })
  @ResponseData(SearchWordsDto)
  getLanguages(): string[] {
    return LocaleCodes;
  }

  @Delete('positions')
  @ApiOperation({
    summary: '',
    description: 'Delete skill word',
  })
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  async deletePosition(@Body() body: SearchWordCreateDto): Promise<void> {
    await this.searchService.deleteAutoCompletion(
      SearchWordType.POSITION,
      body.word,
    );
  }

  @Post('positions')
  @ApiOperation({
    summary: '',
    description: 'Register skill word',
  })
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  async createPosition(
    @Body() body: SearchWordCreateDto,
  ): Promise<SearchWordDto | undefined> {
    return this.searchService.putAutoCompletion(
      SearchWordType.POSITION,
      body.word,
    );
  }

  @Get('/positions/ac')
  @ApiOperation({
    summary: '',
    description: 'Search recommend skills',
  })
  @ResponseData(SearchWordsDto)
  async searchPositions(
    @Query('query') query: string,
  ): Promise<SearchWordsDto> {
    return this.searchService.queryAutoCompletion(
      SearchWordType.POSITION,
      query,
      10,
    );
  }

  @Delete('skills')
  @ApiOperation({
    summary: '',
    description: 'Delete skill word',
  })
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  async deleteSkill(@Body() body: SearchWordCreateDto): Promise<void> {
    await this.searchService.deleteAutoCompletion(
      SearchWordType.SKILL,
      body.word,
    );
  }

  @Post('skills')
  @ApiOperation({
    summary: '',
    description: 'Register skill word',
  })
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  async createSkill(
    @Body() body: SearchWordCreateDto,
  ): Promise<SearchWordDto | undefined> {
    return this.searchService.putAutoCompletion(
      SearchWordType.SKILL,
      body.word,
    );
  }

  @Get('/skills/ac')
  @ApiOperation({
    summary: '',
    description: 'Search recommend skills',
  })
  @ResponseData(SearchWordsDto)
  async searchSkills(@Query('query') query: string): Promise<SearchWordsDto> {
    return this.searchService.queryAutoCompletion(
      SearchWordType.SKILL,
      query,
      10,
    );
  }

  @Delete('tags')
  @ApiOperation({
    summary: '',
    description: 'Delete tag word',
  })
  @Auth([RoleType.ADMIN])
  @HttpCode(HttpStatus.OK)
  async deleteTag(@Body() body: SearchWordCreateDto): Promise<void> {
    await this.searchService.deleteAutoCompletion(
      SearchWordType.TAG,
      body.word,
    );
  }

  @Post('tags')
  @ApiOperation({
    summary: '',
    description: 'Register tag/interesting word',
  })
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  async createTag(
    @Body() body: SearchWordCreateDto,
  ): Promise<SearchWordDto | undefined> {
    return this.searchService.putAutoCompletion(SearchWordType.TAG, body.word);
  }

  @Get('/tags/ac')
  @ApiOperation({
    summary: '',
    description: 'Search recommend tags',
  })
  @ResponseData(SearchWordsDto)
  async searchTags(@Query('query') query: string): Promise<SearchWordsDto> {
    return this.searchService.queryAutoCompletion(
      SearchWordType.TAG,
      query,
      10,
    );
  }
}
