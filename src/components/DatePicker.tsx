import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDisplayDate, getNextDay, getPreviousDay } from '../utils/date';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const handlePrevDay = () => {
    onDateChange(getPreviousDay(selectedDate));
  };

  const handleNextDay = () => {
    onDateChange(getNextDay(selectedDate));
  };

  return (
    <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-lg shadow-md">
      <button
        onClick={handlePrevDay}
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CD5C5C]"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>
      <div className="text-xl font-semibold text-gray-900 px-4">
        {formatDisplayDate(selectedDate)}
      </div>
      <button
        onClick={handleNextDay}
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CD5C5C]"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}