import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { Movie, Prisma } from '@prisma/client';
import { z } from 'zod';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

const dateTransformer = z
  .string()
  .transform((str) => new Date(str))
  .optional();

const searchSchema = z.object({
  title: z.string().optional(),
  release_date_gte: dateTransformer,
  release_date_gt: dateTransformer,
  release_date_lt: dateTransformer,
  release_date_lte: dateTransformer,
  release_date_eq: dateTransformer,
});

@Controller()
@UseInterceptors(CacheInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  private readonly logger = new Logger(MovieController.name);

  @CacheKey('movies')
  @CacheTTL(300) // 5 minutes
  @Get('movies')
  async getFilteredMovies(
    @Query() query?: Record<string, string>,
  ): Promise<Movie[]> {
    try {
      this.logger.log(`GET movies`, {
        query,
      });
      const validatedQuery = searchSchema.parse(query);

      const searchParams: Prisma.MovieWhereInput = {};
      if (validatedQuery.title)
        searchParams.title = { contains: validatedQuery.title };

      if (
        validatedQuery.release_date_gte ||
        validatedQuery.release_date_gt ||
        validatedQuery.release_date_lt ||
        validatedQuery.release_date_lte ||
        validatedQuery.release_date_eq
      ) {
        searchParams.release_date = {};
        if (validatedQuery.release_date_gte)
          searchParams.release_date.gte = new Date(
            validatedQuery.release_date_gte,
          );
        if (validatedQuery.release_date_gt)
          searchParams.release_date.gt = new Date(
            validatedQuery.release_date_gt,
          );
        if (validatedQuery.release_date_lt)
          searchParams.release_date.lt = new Date(
            validatedQuery.release_date_lt,
          );
        if (validatedQuery.release_date_lte)
          searchParams.release_date.lte = new Date(
            validatedQuery.release_date_lte,
          );
        if (validatedQuery.release_date_eq)
          searchParams.release_date.equals = new Date(
            validatedQuery.release_date_eq,
          );
      }

      // use this to simulate a slow response
      // await new Promise((resolve) => setTimeout(resolve, 500));

      return await this.movieService.movies({
        where: {
          AND: [searchParams],
        },
      });
    } catch (error) {
      this.logger.error('Error fetching movies', error);
      if (error instanceof z.ZodError) {
        throw new BadRequestException(error.errors);
      }
      throw error;
    }
  }
}
