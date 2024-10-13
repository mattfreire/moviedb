import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/db/prisma.service';
import { MovieService } from 'src/movie/movie.service';

const API = {
  moviesTitles: 'https://moviesdatabase.p.rapidapi.com/titles',
  actors: 'https://moviesdatabase.p.rapidapi.com/actors',
};

const options = {
  method: 'GET',
  headers: {
    'x-rapidapi-key': process.env.RAPID_API_KEY || '',
    'x-rapidapi-host': 'moviesdatabase.p.rapidapi.com',
  },
};

type ActorResponse = {
  page: number;
  next: string;
  entries: number;
  results: {
    _id: string;
    nconst: string;
    primaryName: string;
    birthYear: number;
    deathYear: number;
    primaryProfession: string;
    knownForTitles: string;
  }[];
};

type MovieResponse = {
  page: number;
  next: string;
  entries: number;
  results: [
    {
      _id: string;
      id: string;
      primaryImage: {
        id: string;
        width: number;
        height: number;
        url: string;
        caption: {
          plainText: string;
          __typename: string;
        };
        __typename: string;
      } | null;
      titleType: {
        text: string;
        id: string;
        isSeries: boolean;
        isEpisode: boolean;
        __typename: string;
      };
      titleText: { text: string; __typename: string };
      originalTitleText: {
        text: string;
        __typename: string;
      };
      releaseYear: { year: number; endYear: null; __typename: string };
      releaseDate: {
        year: number;
        month: number;
        day: number | null;
      } | null;
    },
  ];
};

@Injectable()
export class DataService {
  constructor(
    private movieService: MovieService,
    private prisma: PrismaService,
  ) {}

  private readonly logger = new Logger(DataService.name);

  async fetch_movies() {
    try {
      const response = await fetch(API.moviesTitles, options);
      return (await response.json()) as MovieResponse;
    } catch (error) {
      this.logger.error('Error fetching movies', error);
      return null;
    }
  }

  async fetch_actors() {
    try {
      const response = await fetch(API.actors, options);
      return (await response.json()) as ActorResponse;
    } catch (error) {
      this.logger.error('Error fetching actors', error);
      return null;
    }
  }

  async load_actors_and_movies() {
    const actorResponse = await this.fetch_actors();
    if (!actorResponse) return;

    this.logger.log('LOADING ACTORS');
    const actorsInput: Prisma.ActorCreateManyInput[] = [];
    const movieInput: Prisma.MovieCreateManyInput[] = [];

    for (const obj of actorResponse.results) {
      const knownForTitles = obj.knownForTitles.split(',');

      actorsInput.push({
        name: obj.primaryName,
        // We don't get the birthdate so just setting it to jan 1
        birthdate: new Date(obj.birthYear, 0, 1),
        metadata: obj,
      });

      // Fetch and prepare movie data
      for (const title of knownForTitles) {
        const response = await fetch(`${API.moviesTitles}/${title}`, options);
        const data = (await response.json()) as {
          results: MovieResponse['results'][0] | null;
        };
        if (data.results) {
          movieInput.push({
            title: data.results.titleText.text,
            image: data.results.primaryImage
              ? data.results.primaryImage.url
              : '',
            release_date: data.results.releaseDate
              ? new Date(
                  data.results.releaseDate.year,
                  data.results.releaseDate.month,
                  data.results.releaseDate.day ?? 1,
                )
              : new Date(1970, 1, 1),
            metadata: data.results,
          });
        }
      }
    }

    await this.movieService.bulk_create_actors(actorsInput);
    await this.movieService.bulk_create_movies(movieInput);

    const actors = await this.prisma.actor.findMany();
    const movies = await this.prisma.movie.findMany();

    for (const actor of actors) {
      const metadata = actor.metadata as ActorResponse['results'][0];
      const knownForTitles = metadata.knownForTitles.split(',');
      const actorMovies = movies.filter((movie) => {
        const metadata = movie.metadata as MovieResponse['results'][0];
        return knownForTitles.includes(metadata.id);
      });

      await this.prisma.actor.update({
        where: { id: actor.id },
        data: {
          movies: {
            connect: actorMovies.map((movie) => ({ id: movie.id })),
          },
        },
      });
    }

    this.logger.log('CREATED ACTORS AND MOVIES, AND LINKED THEM');
  }

  async clear_db() {
    this.logger.log('CLEARING DB');
    await this.movieService.delete_actors_and_movies();
  }

  async load() {
    await this.clear_db();
    await this.load_actors_and_movies();
  }

  async onModuleInit() {
    this.logger.log('INIT DATASERVICE');
    const loadOnStart = process.env.LOAD_ON_START === 'true';
    if (loadOnStart) {
      await this.load();
    }
  }
}
