import { Injectable } from '@nestjs/common';
import { BaseApiException } from 'src/common/exceptions/base-api.exception';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: IpfsStorage,
  ) {}

  create(createArticleDto: CreateArticleDto) {
    return 'This action adds a new article';
  }

  async findAll() {
    return await this.prisma.post.findMany({
      include: {
        author: true,
      },
    });
  }

  async findOne(url: string) {
    const article = await this.prisma.post.findUnique({
      include: {
        author: true,
      },
      where: {
        internalUrl: url,
      },
    });
    if (!article) {
      throw new BaseApiException('article not found', 401);
    }
    const data = await this.storage.get(article.url);

    return {
      ...article,
      data: JSON.parse(data!),
    };
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    return `This action updates a #${id} article`;
  }

  remove(id: number) {
    return `This action removes a #${id} article`;
  }
}
