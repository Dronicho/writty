import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [EventsModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
