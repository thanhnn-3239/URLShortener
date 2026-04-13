'use client';

import React, { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';

export type DateRangeChangeEvent = {
  startDate: string;
  endDate: string;
  groupBy: 'daily' | 'weekly';
};

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (event: DateRangeChangeEvent) => void;
  groupBy?: 'daily' | 'weekly';
}

export default function DateRangePicker({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onRangeChange,
  groupBy: initialGroupBy = 'daily',
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly'>(initialGroupBy);

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      if (newStartDate <= endDate) {
        setStartDate(newStartDate);
        onRangeChange({ startDate: newStartDate, endDate, groupBy });
      }
    },
    [endDate, groupBy, onRangeChange]
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEndDate = e.target.value;
      if (newEndDate >= startDate) {
        setEndDate(newEndDate);
        onRangeChange({ startDate, endDate: newEndDate, groupBy });
      }
    },
    [startDate, groupBy, onRangeChange]
  );

  const handleGroupByChange = useCallback(
    (newGroupBy: 'daily' | 'weekly') => {
      setGroupBy(newGroupBy);
      onRangeChange({ startDate, endDate, groupBy: newGroupBy });
    },
    [startDate, endDate, onRangeChange]
  );

  const handlePreset = useCallback(
    (type: 'today' | 'last7' | 'last30') => {
      const now = new Date();
      const newEndDate = now.toISOString().split('T')[0];
      let newStartDate;

      switch (type) {
        case 'today':
          newStartDate = newEndDate;
          break;
        case 'last7':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          newStartDate = sevenDaysAgo.toISOString().split('T')[0];
          break;
        case 'last30':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          newStartDate = thirtyDaysAgo.toISOString().split('T')[0];
          break;
      }

      setStartDate(newStartDate);
      setEndDate(newEndDate);
      onRangeChange({ startDate: newStartDate, endDate: newEndDate, groupBy });
    },
    [groupBy, onRangeChange]
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        {/* Grouping Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Grouping
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleGroupByChange('daily')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                groupBy === 'daily'
                  ? 'active bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => handleGroupByChange('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                groupBy === 'weekly'
                  ? 'active bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Start date"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate}
                max={today}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="End date"
              />
            </div>
          </div>
        </div>

        {/* Preset Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handlePreset('today')}
              className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handlePreset('last7')}
              className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePreset('last30')}
              className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Past 30 Days
            </button>
          </div>
        </div>

        {/* Date Range Display */}
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Selected Range:</span> {startDate} to {endDate}
            {' '}
            <span className="text-blue-700">
              ({Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
