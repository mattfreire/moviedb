import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";

export const DateFilter = ({
  selected,
  onSelect,
}: {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const years = Array.from({ length: 100 }, (_, i) => 2022 - i);

  const handleYearChange = (year: number) => {
    const newDate = new Date(year, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
    onSelect(newDate);
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + increment,
      1
    );
    setCurrentDate(newDate);
    onSelect(newDate);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Select
          value={currentDate.getFullYear().toString()}
          onValueChange={(e) => handleYearChange(parseInt(e))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue>{currentDate.getFullYear()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange(-1)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <div className="w-[100px] text-center font-medium">
            {format(currentDate, "MMMM")}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleMonthChange(1)}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => {
          if (!date) return;
          onSelect(date);
        }}
        month={currentDate}
        onMonthChange={setCurrentDate}
        className="rounded-md border shadow"
      />
    </div>
  );
};
