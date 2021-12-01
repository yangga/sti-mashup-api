import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiConfigService } from '../../shared/services/api-config.service';
import { SearchWordRepository } from './repositories/searchword.repository';
import { SearchWordDeletedRepository } from './repositories/searchword-deleted.repository';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SearchWordRepository,
      SearchWordDeletedRepository,
    ]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ApiConfigService) => ({
        node: configService.esConfig.url,
      }),
      inject: [ApiConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
