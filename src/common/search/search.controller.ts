import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@Controller('search')
@ApiTags('search')
export class SearchServiceController {
  private readonly log = new Logger(SearchServiceController.name);

  constructor(private readonly service: SearchService) {
    
  }

  @Get(':search')
  async search(@Param('search') term: string) {
    return this.service.search(term);
  }
}
