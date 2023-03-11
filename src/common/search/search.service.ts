import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import debug from 'debug';
import { SearchQueryBuilderService } from './search.builder';
import { Mapping } from './search.mapping';

interface PostSearchResult {
  hits: {
    total: number;
    hits: Array<{
      _source: any;
    }>;
  };
}

const error = debug('lib:error:azure');

@Injectable()
export class SearchService {
  constructor(
    private readonly esService: ElasticsearchService,
    private readonly builderService: SearchQueryBuilderService,
  ) {}
  public async createIndex() {
    // create index if doesn't exist
    try {
      const index = process.env.ELASTIC_INDEX!;
      const checkIndex = await this.esService.indices.exists({ index });
      if (!checkIndex) {
        await this.esService.indices.create({
          index,
        });
      }
    } catch (err) {
      error(err, 'SearchService -> createIndex');
      throw err;
    }
  }
  public async indexData(payload: any) {
    try {
      return await this.esService.index({
        index: process.env.ELASTIC_INDEX!,
        body: payload,
      });
    } catch (err) {
      error(err, 'SearchService -> indexData');
      throw err;
    }
  }
  public async search(term: string) {
    try {
      const res = await this.esService.search<PostSearchResult>({
        index: process.env.ELASTIC_INDEX,
        body: this.builderService.buildSearchQuery(term),
        from: 0,
        size: 1000,
      });

      const totalCount = res.hits.total;
      const hits = res.hits.hits;
      const data = hits.map((item: any) => item._source);
      return {
        totalCount,
        data,
      };
    } catch (err) {
      error(err, 'SearchService || search query issue || -> search');
      throw err;
    }
  }
}
