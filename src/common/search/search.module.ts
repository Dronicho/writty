import { Module } from '@nestjs/common';
import {
  ElasticsearchModule,
} from '@nestjs/elasticsearch';
import { SearchQueryBuilderService } from './search.builder';
import { SearchServiceController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  // imports: [
  //   ElasticsearchModule.register({
  //     node: 'http://localhost:9200',
  //   }),
  // ],
  controllers: [SearchServiceController],
  providers: [
    SearchService,
    SearchQueryBuilderService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
