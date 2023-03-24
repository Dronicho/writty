import { Controller, Get, Logger, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SearchService } from './search.service';

@Controller('search')
@ApiTags('search')
export class SearchServiceController {
  private readonly log = new Logger(SearchServiceController.name);

  constructor(private readonly service: SearchService) {}

  @Get('all/:search')
  async searchAll(@Param('search') term: string) {
    return this.service.searchAll(term);
  }

  @Get('all')
  async searchAllEmpty() {
    return this.service.searchAll('');
  }

  @Get('my/:search')
  async searchMy(@Param('search') term: string, @Req() req: Request) {
    return this.service.searchMy(req.headers.authorization!, term);
  }
  @Get('my')
  async searchMyEmpty(@Req() req: Request) {
    return this.service.searchMy(req.headers.authorization!, '');
  }

  @Get('collected/:search')
  async searchCollected(@Param('search') term: string, @Req() req: Request) {
    return this.service.searchCollected(req.headers.authorization!, term);
  }

  @Get('collected')
  async searchCollectedEmpty(@Req() req: Request) {
    return this.service.searchCollected(req.headers.authorization!, '');
  }
}
