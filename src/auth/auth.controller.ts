import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { IsString } from 'class-validator';
import { XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { AuthService } from './auth.service';
export class LoginDto {
  @IsString()
  address: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('complete-auth')
  async completeAuth(@Body() body: XummWebhookBody): Promise<void> {
    return this.service.completeAuth(body);
  }
}
