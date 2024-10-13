import { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layout } from "./Layout";
import { useMovies } from "./useMovies";
import { format } from "date-fns";
import debounce from "lodash.debounce";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "./TableSkeleton";
import { DateFilter } from "./DateFilter";
import { GetMoviesResponse } from "./types";

export function MovieSearchView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [titleFilter, setTitleFilter] = useState("");
  const [debouncedTitleFilter, setDebouncedTitleFilter] = useState("");
  const [dateComparison, setDateComparison] = useState("eq");

  const filterQuery = useMemo(() => {
    const query: Record<string, string> = {};

    // based on the date comparison, we can set the correct filter
    if (dateFilter) {
      if (dateComparison === "lte") query.release_date_lte = dateFilter;
      if (dateComparison === "lt") query.release_date_lt = dateFilter;
      if (dateComparison === "eq") query.release_date_eq = dateFilter;
      if (dateComparison === "gte") query.release_date_gte = dateFilter;
      if (dateComparison === "gt") query.release_date_gt = dateFilter;
    }

    if (debouncedTitleFilter) query.title = debouncedTitleFilter;
    return query;
  }, [dateFilter, debouncedTitleFilter, dateComparison]);

  const debouncedSetTitleFilter = useCallback(
    debounce((value: string) => {
      setDebouncedTitleFilter(value);
    }, 300),
    []
  );

  const handleTitleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleFilter(e.target.value);
    debouncedSetTitleFilter(e.target.value);
  };

  const { movies, isLoading } = useMovies(filterQuery);

  if (!movies) {
    return <div>No movies</div>;
  }

  const getDateFilterLabel = () => {
    if (!dateFilter) return "Select date";
    const formattedDate = format(dateFilter, "PPP");
    switch (dateComparison) {
      case "lte":
        return `On or before ${formattedDate}`;
      case "lt":
        return `Before ${formattedDate}`;
      case "eq":
        return `On ${formattedDate}`;
      case "gte":
        return `On or after ${formattedDate}`;
      case "gt":
        return `After ${formattedDate}`;
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="titleFilter" className="mb-2 block">
            Filter by title
          </Label>
          <Input
            id="titleFilter"
            placeholder="Filter by title"
            value={titleFilter}
            onChange={handleTitleFilterChange}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="dateFilter" className="mb-2 block">
            Filter by release date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateFilter"
                variant="outline"
                role="combobox"
                aria-expanded={false}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {getDateFilterLabel()}
                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <Select
                  value={dateComparison}
                  onValueChange={setDateComparison}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Date comparison" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lte">On or before</SelectItem>
                    <SelectItem value="lt">Before</SelectItem>
                    <SelectItem value="eq">On</SelectItem>
                    <SelectItem value="gte">On or after</SelectItem>
                    <SelectItem value="gt">After</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DateFilter
                selected={date}
                onSelect={(date) => {
                  console.log(date);
                  if (!date) return;
                  setDate(date);
                  setDateFilter(date.toISOString());
                  if (!dateComparison) setDateComparison("eq");
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="max-h-[calc(100vh-300px)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead className="text-right">Cast</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && !movies.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No movies found
                </TableCell>
              </TableRow>
            )}
            {isLoading && <TableSkeleton />}
            {!isLoading &&
              movies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-row items-center space-x-2">
                      {movie.image && movie.image != "" ? (
                        <img
                          src={movie.image}
                          alt={movie.title}
                          className="w-auto h-16 mr-2 rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 mr-2 bg-gray-200 rounded" />
                      )}
                      <span>{movie.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(movie.release_date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-3">
                      {movie.actors.map((actor) => (
                        <ActorCard actor={actor} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}

type Actor = GetMoviesResponse[0]["actors"][0];

function ActorCard({ actor }: { actor: Actor }) {
  return (
    <div className="p-2 border border-gray-200 rounded">
      <p>{actor.name}</p>
      <p>{format(actor.birthdate, "dd MMM yyyy")}</p>
    </div>
  );
}
