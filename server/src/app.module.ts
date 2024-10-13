import { Module } from '@nestjs/common';
import { MovieController } from './movie/movie.controller';
import { MovieService } from './movie/movie.service';
import { PrismaService } from './db/prisma.service';
import { CacheModule } from '@nestjs/cache-manager';
import { DataService } from './data/data.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [MovieController],
  providers: [PrismaService, MovieService, DataService],
})
export class AppModule {}
