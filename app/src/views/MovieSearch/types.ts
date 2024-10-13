export type GetMoviesResponse = {
  id: number,
  title: string,
  release_date: string,
  image: string,
  actors: {
    name: string,
    birthdate: string,
  }[]
}[]
