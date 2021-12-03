import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { UserDto } from 'modules/user/dto/user.dto';

import { RoleType } from '../../common/constants/role.type';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { AutoCompletionOptionsDto } from './dto/ac-options.dto';
import { MemberOptionsDto } from './dto/member-options.dto';
import { PaginatedResultDto } from './dto/paginated-result.dto';
import { SearchWordsDto } from './dto/searchword.dto';
import { SearchService } from './search.service';

@CommonHeader()
@Controller({ path: 'search', version: '1' })
@ApiTags('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('/ac')
  @ApiOperation({
    summary: '',
    description: 'Search recommend words',
  })
  @ResponseData(SearchWordsDto)
  async searchAutoCompletion(
    @Query(new ValidationPipe({ transform: true }))
    options: AutoCompletionOptionsDto,
  ): Promise<SearchWordsDto> {
    return this.searchService.queryAutoCompletion(options.type, options.q, 10);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @Get('/users')
  @ApiOperation({
    summary: '',
    description: 'Search users',
  })
  @Auth([RoleType.USER])
  @ResponseData(PaginatedResultDto)
  async searchUsers(
    @Query(new ValidationPipe({ transform: true }))
    params: MemberOptionsDto,
  ): Promise<PaginatedResultDto<UserDto>> {
    return this.searchService.queryUser(params);
  }
}
