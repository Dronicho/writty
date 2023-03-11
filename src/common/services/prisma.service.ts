import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Scope,
} from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async getUser(address: string): Promise<User | null> {
    return this.user.findUnique({where: {address}})
  }
}
