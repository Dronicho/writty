import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { AppController } from './app.controller';
import { XummService } from './common/services/xumm.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [CommonModule, AuthModule, ArticlesModule],
  providers: [
    XummService,
    
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
