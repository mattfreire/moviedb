import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie/movie.controller';
import { MovieService } from './movie/movie.service';

describe('MovieService', () => {
  let appController: MovieController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [MovieService],
    }).compile();

    appController = app.get<MovieController>(MovieController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getFilteredMovies()).toBe([]);
    });
  });
});
