import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Movie, Prisma } from '@prisma/client';

@Injectable()
export class MovieService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(MovieService.name);

  async movies(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MovieWhereUniqueInput;
    where?: Prisma.MovieWhereInput;
    orderBy?: Prisma.MovieOrderByWithRelationInput;
  }): Promise<Movie[]> {
    const { skip, take, cursor, where, orderBy } = params;
    this.logger.debug(`GET movies ${JSON.stringify(params)}`);
    return await this.prisma.movie.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        release_date: true,
        image: true,
        actors: {
          select: {
            name: true,
            birthdate: true,
          },
        },
        metadata: true,
      },
    });
  }

  async bulk_create_movies(movies: Prisma.MovieCreateManyInput[]) {
    return await this.prisma.movie.createMany({
      data: movies,
    });
  }

  async bulk_create_actors(actors: Prisma.ActorCreateManyInput[]) {
    return await this.prisma.actor.createMany({
      data: actors,
    });
  }

  async delete_actors_and_movies() {
    await this.prisma.$transaction(async (tx) => {
      await tx.actor.deleteMany();
      await tx.movie.deleteMany();
    });
  }
}
