import { useEffect, useState } from "react";
import { GetMoviesResponse } from './types'

export const useMovies = (filterQuery?: Record<string, string>) => {
  const [movies, setMovies] = useState<GetMoviesResponse | null>(null);
  const [isLoading, setLoading] = useState(false)
  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true)
        const res = await fetch(`http://localhost:3000/movies?${new URLSearchParams(filterQuery ?? {})}`)
        setMovies(await res.json())
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [filterQuery]);
  return {
    movies,
    isLoading
  }
}