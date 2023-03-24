import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('')
  findAll() {
    return this.articlesService.findAll();
  }

  @Get('my')
  findMyArticles(@Req() request: Request) {
    return this.articlesService.findMyArticles(request.headers.authorization!);
  }

  @Get('collected')
  findCollectedArticles(@Req() request: Request) {
    return this.articlesService.findCollectedArticles(
      request.headers.authorization!,
    );
  }

  @Get(':url')
  findOne(@Param('url') url: string, @Req() request: Request) {
    return this.articlesService.findOne(url, request.headers.authorization);
  }
}
