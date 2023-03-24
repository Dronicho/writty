import { Injectable } from '@nestjs/common';
import { BaseApiException } from 'src/common/exceptions/base-api.exception';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import XRPLService from 'src/common/services/xrpl.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: IpfsStorage,
    private readonly xrpl: XRPLService,
  ) {}

  async findMyArticles(address: string) {
    return this.prisma.post.findMany({
      where: {
        author: {
          address,
        },
      },
      include: {
        author: true,
        _count: {
          select: {
            collectors: true,
          },
        },
      },
    });
  }

  async findCollectedArticles(address: string) {
    return this.prisma.post.findMany({
      where: {
        collectors: {
          some: {
            address,
          },
        },
      },
      include: {
        author: true,
        _count: {
          select: {
            collectors: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.post.findMany({
      include: {
        author: true,
        _count: {
          select: {
            collectors: true,
          },
        },
      },
    });
  }

  async findOne(url: string, address?: string) {
    const article = await this.prisma.post.findUnique({
      include: {
        author: true,
        _count: {
          select: {
            collectors: true,
          },
        },
      },
      where: {
        internalUrl: url,
      },
    });
    if (!article) {
      throw new BaseApiException('article not found', 401);
    }
    var collected = false;
    if (address) {
      const balances = await this.xrpl.client.getBalances(address);
      console.log(balances);
      collected =
        balances.findIndex((e) => e.currency === article.currency) !== -1;
    }

    const data = await this.storage.get(article);

    return {
      ...article,
      data: JSON.parse(data!),
      collected: collected,
    };
  }
}
