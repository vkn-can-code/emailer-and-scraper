'use client';

import { useState, useRef, useEffect } from 'react';

interface CalendarWidgetProps {
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export default function CalendarWidget({ onDateSelect, selectedDate }: CalendarWidgetProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const years: number[] = [];
  for (let y = today.getFullYear() - 5; y <= today.getFullYear() + 2; y++) {
    years.push(y);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setShowMonthSelect(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDays = () => {
    const totalDays = daysInMonth(viewDate.getMonth(), viewDate.getFullYear());
    const firstDay = firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());
    const days = [];

    // Blanks for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} className="h-10 w-10"></div>);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <button
          key={d}
          onClick={() => onDateSelect(isSelected ? null : date)}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm transition-all duration-300 relative group
            ${isSelected ? 'font-extrabold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 z-10' : 
              isToday ? 'bg-white/5 text-indigo-400 font-bold border border-indigo-500/30' : 
              'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
        >
          {isSelected && (
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl -z-10"></div>
          )}
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="glass-card p-8 w-full max-w-sm relative overflow-hidden group/calendar">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/calendar:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      <div className="flex items-center justify-between mb-8 relative z-50">
        <div className="flex gap-2">
          {/* Month Selector */}
          <div className="relative" ref={monthRef}>
            <button 
              onClick={() => setShowMonthSelect(!showMonthSelect)}
              className="text-lg font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              {monthNames[viewDate.getMonth()]}
              <svg className={`w-4 h-4 transition-transform ${showMonthSelect ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {showMonthSelect && (
              <div className="absolute top-full left-0 mt-3 w-44 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 py-2 animate-in fade-in slide-in-from-top-2">
                {monthNames.map((name, i) => (
                  <button
                    key={name}
                    onClick={() => {
                      setViewDate(new Date(viewDate.getFullYear(), i, 1));
                      setShowMonthSelect(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 text-sm hover:bg-white/10 transition-colors ${viewDate.getMonth() === i ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-extrabold' : 'text-zinc-400'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Selector */}
          <div className="relative" ref={yearRef}>
            <button 
              onClick={() => setShowYearSelect(!showYearSelect)}
              className="text-lg font-bold text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              {viewDate.getFullYear()}
              <svg className={`w-4 h-4 transition-transform ${showYearSelect ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {showYearSelect && (
              <div className="absolute top-full left-0 mt-3 w-32 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 py-2 animate-in fade-in slide-in-from-top-2 max-h-48 overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setViewDate(new Date(year, viewDate.getMonth(), 1));
                      setShowYearSelect(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 text-sm hover:bg-white/10 transition-colors ${viewDate.getFullYear() === year ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-extrabold' : 'text-zinc-400'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button onClick={handleNextMonth} className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-4 relative z-10">
        {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
          <div key={d} className="text-[10px] font-extrabold text-zinc-600 tracking-[0.1em]">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 relative z-10">
        {renderDays()}
      </div>

      <div className="mt-6 flex justify-center">
        <button 
          onClick={() => {
            setViewDate(new Date());
            onDateSelect(new Date());
          }}
          className="text-[11px] text-zinc-500 hover:text-indigo-400 font-medium uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Quick jump to today
        </button>
      </div>
    </div>
  );
}
