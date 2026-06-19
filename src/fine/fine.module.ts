import { Module } from '@nestjs/common';
import { FineService } from './fine.service';
import { FineController } from './fine.controller';

@Module({
  providers: [FineService],
  controllers: [FineController]
})
export class FineModule {}
