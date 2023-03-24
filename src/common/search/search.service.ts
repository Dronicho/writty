import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as Prisma from 'prisma';

import debug from 'debug';
import { PrismaService } from '../services/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly builderService: SearchQueryBuilderService,
  ) {}

  public async searchAll(search: string) {
    return this.prisma.post.findMany(this.buildSearchQuery(search));
  }

  public async searchMy(address: string, term: string) {
    const query = this.buildSearchQuery(term);
    console.log('address: ', address);
    return this.prisma.post.findMany({
      ...query,
      where: {
        author: {
          address: {
            equals: address,
          },
        },
        AND: [
          {
            OR: query.where.OR,
          },
        ],
      },
    });
  }

  public async searchCollected(address: string, term: string) {
    const query = this.buildSearchQuery(term);
    return this.prisma.post.findMany({
      ...query,
      where: {
        OR: query.where.OR,
        collectors: {
          some: {
            address,
          },
        },
      },
    });
  }

  private buildSearchQuery(search: string): Prisma.PostWhereInput {
    return {
      include: {
        author: true,
        _count: {
          select: {
            collectors: true,
          },
        },
      },
      where: {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
        ],
      },
    };
  }
}
