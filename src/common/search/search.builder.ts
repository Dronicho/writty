import { Injectable } from '@nestjs/common';
import { BaseApiException } from '../exceptions/base-api.exception';

@Injectable()
export class SearchQueryBuilderService {
  constructor() {}

  public buildSearchQuery(search: string) {
    try {
      const query = <any>[];
      let flag = false;
      if (search) {
        flag = true;
        query.push({
          wildcard: {
            title: {
              value: `*${search}*`
            }
          }
        });
        return {
          query: {
            bool: {
              must: query,
            },
          },
        };
      }
      
      return {};
    } catch (err) {
      throw new BaseApiException('cant perform the search', 503);
    }
  }
}
