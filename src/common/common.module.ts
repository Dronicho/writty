import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventsModule } from 'src/events/events.module';

import { configModuleOptions } from './configs/module-options';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { AppLoggerModule } from './logger/logger.module';
import { SearchModule } from './search/search.module';
import { IpfsStorage } from './services/ipfs';
import { PrismaService } from './services/prisma.service';
import XRPLService from './services/xrpl.service';
import { XummService } from './services/xumm.service';

@Global()
@Module({
  imports: [
    SearchModule,
    MulterModule.register({
      dest: './upload',
    }),

    ConfigModule.forRoot(configModuleOptions),
    AppLoggerModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 50,
    }),
  ],
  exports: [
    AppLoggerModule,
    ConfigModule,
    PrismaService,
    XummService,
    IpfsStorage,
    SearchModule,
    XRPLService,
  ],
  providers: [
    XRPLService,

    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    PrismaService,
    XummService,
    {
      provide: IpfsStorage,
      useFactory: async () => {
        return await IpfsStorage.create();
      },
    },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class CommonModule {}
