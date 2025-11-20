import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from "lucide-react";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isBetweenDates = (date: Date, start: Date, end: Date): boolean => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  return checkDate > startDate && checkDate < endDate;
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTempRange(value);
    }
  }, [isOpen, value]);

  const handleDayClick = (day: number, month: Date) => {
    const selectedDate = new Date(month.getFullYear(), month.getMonth(), day);
    const { from, to } = tempRange;

    if (!from || (from && to)) {
      // Start new selection
      setTempRange({ from: selectedDate, to: undefined });
    } else if (from && !to) {
      // Select end date
      if (selectedDate < from) {
        setTempRange({ from: selectedDate, to: from });
      } else if (isSameDay(selectedDate, from)) {
        setTempRange({ from: undefined, to: undefined });
      } else {
        setTempRange({ from, to: selectedDate });
      }
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handlePrevYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
  };

  const formatDateDisplay = () => {
    if (!value.from && !value.to) {
      return "";
    }
    if (value.from && !value.to) {
      return value.from.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    }
    return `${value.from?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} - ${value.to?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}`;
  };

  const CalendarMonth = ({ month }: { month: Date }) => {
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const monthName = month.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="flex-1">
        <h3 className="text-center font-semibold text-gray-700 mb-2 text-xs">
          {monthName}
        </h3>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-7" />;

            const date = new Date(month.getFullYear(), month.getMonth(), day);
            const isStart = tempRange.from && isSameDay(date, tempRange.from);
            const isEnd = tempRange.to && isSameDay(date, tempRange.to);
            const isInRange =
              tempRange.from &&
              tempRange.to &&
              isBetweenDates(date, tempRange.from, tempRange.to);
            const isFuture = date > new Date();

            return (
              <button
                key={day}
                onClick={() => !isFuture && handleDayClick(day, month)}
                disabled={isFuture}
                className={`
                  h-7 rounded text-xs font-medium transition-all relative
                  ${isFuture ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}
                  ${isStart || isEnd ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
                  ${isInRange ? "bg-purple-100 text-purple-900" : ""}
                  ${!isStart && !isEnd && !isInRange && !isFuture ? "text-gray-700" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const quickOptions = [
    { label: "Today", onClick: () => {
      const today = new Date();
      setTempRange({ from: today, to: today });
    }},
    { label: "This Week", onClick: () => {
      const today = new Date();
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setTempRange({ from: firstDay, to: lastDay });
    }},
    { label: "Last 7 days", onClick: () => {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setTempRange({ from: lastWeek, to: new Date() });
    }},
    { label: "This Month", onClick: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setTempRange({ from: firstDay, to: lastDay });
    }},
    { label: "Last Month", onClick: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setTempRange({ from: firstDay, to: lastDay });
    }},
    { label: "This Year", onClick: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      setTempRange({ from: firstDay, to: lastDay });
    }},
    { label: "Last Year", onClick: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear() - 1, 0, 1);
      const lastDay = new Date(today.getFullYear() - 1, 11, 31);
      setTempRange({ from: firstDay, to: lastDay });
    }},
    { label: "All Time", onClick: () => {
      setTempRange({ from: undefined, to: undefined });
    }},
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Box */}
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formatDateDisplay()}
          onClick={() => setIsOpen(!isOpen)}
          placeholder="MM/DD/YYYY - MM/DD/YYYY"
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
        />
        <Calendar 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[700px]">
          <div className="flex">
            {/* Left sidebar with quick options */}
            <div className="w-32 border-r border-gray-200 p-2">
              {quickOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={option.onClick}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 transition-colors text-gray-700"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Main calendar area */}
            <div className="flex-1 p-3">
              {/* Navigation controls */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevYear}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Previous Year"
                  >
                    <ChevronsLeft size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                </div>

                <div className="flex items-center gap-6 text-sm font-semibold text-gray-800">
                  <span>{currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  <span>{nextMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Next Month"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={handleNextYear}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title="Next Year"
                  >
                    <ChevronsRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Two calendars side by side */}
              <div className="flex gap-4 mb-3">
                <CalendarMonth month={currentMonth} />
                <CalendarMonth month={nextMonth} />
              </div>

              {/* Date inputs and Apply button */}
              <div className="flex items-end gap-3 pt-3 border-t border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">START DATE</label>
                  <input
                    type="text"
                    value={tempRange.from?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) || ""}
                    readOnly
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">END DATE</label>
                  <input
                    type="text"
                    value={tempRange.to?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) || ""}
                    readOnly
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <button
                  onClick={handleApply}
                  disabled={!tempRange.from || !tempRange.to}
                  className={`px-5 py-1.5 rounded font-medium transition-colors text-sm ${
                    tempRange.from && tempRange.to
                      ? "bg-purple-700 text-white hover:bg-purple-800 cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;





// import React, { useState, useRef, useEffect } from "react";
// import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from "lucide-react";

// interface DateRange {
//   from?: Date;
//   to?: Date;
// }

// interface DateRangePickerProps {
//   value: DateRange;
//   onChange: (range: DateRange) => void;
//   className?: string;
// }

// const getDaysInMonth = (date: Date) => {
//   return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
// };

// const getFirstDayOfMonth = (date: Date) => {
//   return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
// };

// const isSameDay = (date1: Date, date2: Date): boolean => {
//   return (
//     date1.getFullYear() === date2.getFullYear() &&
//     date1.getMonth() === date2.getMonth() &&
//     date1.getDate() === date2.getDate()
//   );
// };

// const isBetweenDates = (date: Date, start: Date, end: Date): boolean => {
//   const checkDate = new Date(date);
//   checkDate.setHours(0, 0, 0, 0);
//   const startDate = new Date(start);
//   startDate.setHours(0, 0, 0, 0);
//   const endDate = new Date(end);
//   endDate.setHours(0, 0, 0, 0);
//   return checkDate > startDate && checkDate < endDate;
// };

// const DateRangePicker: React.FC<DateRangePickerProps> = ({
//   value,
//   onChange,
//   className = "",
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [tempRange, setTempRange] = useState<DateRange>(value);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [activeTab, setActiveTab] = useState<"eng" | "heb">("eng");
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const nextMonth = new Date(currentMonth);
//   nextMonth.setMonth(nextMonth.getMonth() + 1);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen]);

//   // Sync tempRange with value when picker opens
//   useEffect(() => {
//     if (isOpen) {
//       setTempRange(value);
//     }
//   }, [isOpen, value]);

//   const handleDayClick = (day: number, month: Date) => {
//     const selectedDate = new Date(month.getFullYear(), month.getMonth(), day);
//     const { from, to } = tempRange;

//     if (!from) {
//       setTempRange({ from: selectedDate, to: undefined });
//     } else if (!to) {
//       if (selectedDate < from) {
//         setTempRange({ from: selectedDate, to: from });
//       } else if (isSameDay(selectedDate, from)) {
//         setTempRange({ from: undefined, to: undefined });
//       } else {
//         setTempRange({ from, to: selectedDate });
//       }
//     } else {
//       setTempRange({ from: selectedDate, to: undefined });
//     }
//   };

//   const handleApply = () => {
//     onChange(tempRange);
//     setIsOpen(false);
//   };

//   const handlePrevYear = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
//   };

//   const handlePrevMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
//   };

//   const handleNextYear = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
//   };

//   const formatDateDisplay = () => {
//     if (!value.from && !value.to) {
//       return "";
//     }
//     if (value.from && !value.to) {
//       return value.from.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
//     }
//     return `${value.from?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} - ${value.to?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}`;
//   };

//   const CalendarMonth = ({ month }: { month: Date }) => {
//     const daysInMonth = getDaysInMonth(month);
//     const firstDay = getFirstDayOfMonth(month);
//     const days = [];

//     for (let i = 0; i < firstDay; i++) {
//       days.push(null);
//     }

//     for (let i = 1; i <= daysInMonth; i++) {
//       days.push(i);
//     }

//     const monthName = month.toLocaleDateString("en-US", {
//       month: "long",
//       year: "numeric",
//     });

//     return (
//       <div className="flex-1">
//         <h3 className="text-center font-semibold text-gray-800 mb-3 text-sm">
//           {monthName}
//         </h3>

//         <div className="grid grid-cols-7 gap-1 mb-2">
//           {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
//             <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
//               {day}
//             </div>
//           ))}
//         </div>

//         <div className="grid grid-cols-7 gap-1">
//           {days.map((day, idx) => {
//             if (!day) return <div key={`empty-${idx}`} className="h-8" />;

//             const date = new Date(month.getFullYear(), month.getMonth(), day);
//             const isStart = tempRange.from && isSameDay(date, tempRange.from);
//             const isEnd = tempRange.to && isSameDay(date, tempRange.to);
//             const isInRange =
//               tempRange.from &&
//               tempRange.to &&
//               isBetweenDates(date, tempRange.from, tempRange.to);
//             const isFuture = date > new Date();

//             return (
//               <button
//                 key={day}
//                 onClick={() => !isFuture && handleDayClick(day, month)}
//                 disabled={isFuture}
//                 className={`
//                   h-8 rounded text-sm font-medium transition-all relative
//                   ${isFuture ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}
//                   ${isStart || isEnd ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
//                   ${isInRange ? "bg-purple-100 text-purple-900" : ""}
//                   ${!isStart && !isEnd && !isInRange && !isFuture ? "text-gray-700" : ""}
//                 `}
//               >
//                 {day}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   const quickOptions = [
//     { label: "Today", onClick: () => {
//       const today = new Date();
//       setTempRange({ from: today, to: today });
//     }},
//     { label: "This Week", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
//       const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Last 7 days", onClick: () => {
//       const today = new Date();
//       const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
//       setTempRange({ from: lastWeek, to: new Date() });
//     }},
//     { label: "This Month", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
//       const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Last Month", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Next Month", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
//       const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "This Year", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear(), 0, 1);
//       const lastDay = new Date(today.getFullYear(), 11, 31);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Last Year", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear() - 1, 0, 1);
//       const lastDay = new Date(today.getFullYear() - 1, 11, 31);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Next Year", onClick: () => {
//       const today = new Date();
//       const firstDay = new Date(today.getFullYear() + 1, 0, 1);
//       const lastDay = new Date(today.getFullYear() + 1, 11, 31);
//       setTempRange({ from: firstDay, to: lastDay });
//     }},
//     { label: "Custom Range", onClick: () => {} },
//     { label: "All Time", onClick: () => {
//       setTempRange({ from: undefined, to: undefined });
//     }},
//   ];

//   return (
//     <div className={`relative ${className}`} ref={dropdownRef}>
//       {/* Input Box */}
//       <div className="relative">
//         <input
//           type="text"
//           readOnly
//           value={formatDateDisplay()}
//           onClick={() => setIsOpen(!isOpen)}
//           placeholder="Select date range"
//           className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
//         />
//         <Calendar 
//           size={18} 
//           className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
//         />
//       </div>

//       {/* Dropdown Calendar */}
//       {isOpen && (
//         <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[850px]">
//           <div className="flex">
//             {/* Left sidebar with quick options */}
//             <div className="w-40 border-r border-gray-200 p-2">
//               {quickOptions.map((option, idx) => (
//                 <button
//                   key={idx}
//                   onClick={option.onClick}
//                   className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors
//                     ${option.label === "Last 7 days" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-700"}
//                   `}
//                 >
//                   {option.label}
//                 </button>
//               ))}
//             </div>

//             {/* Main calendar area */}
//             <div className="flex-1 p-4">
//               {/* Language tabs */}
//               <div className="flex gap-2 mb-4">
//                 <button
//                   onClick={() => setActiveTab("eng")}
//                   className={`px-4 py-1 rounded-full text-sm font-medium transition-colors
//                     ${activeTab === "eng" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"}
//                   `}
//                 >
//                   Eng
//                 </button>
//                 <button
//                   onClick={() => setActiveTab("heb")}
//                   className={`px-4 py-1 rounded-full text-sm font-medium transition-colors
//                     ${activeTab === "heb" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"}
//                   `}
//                 >
//                   Heb
//                 </button>
//               </div>

//               {/* Navigation controls */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={handlePrevYear}
//                     className="p-1 hover:bg-gray-100 rounded transition"
//                     title="Previous Year"
//                   >
//                     <ChevronsLeft size={20} className="text-gray-600" />
//                   </button>
//                   <button
//                     onClick={handlePrevMonth}
//                     className="p-1 hover:bg-gray-100 rounded transition"
//                     title="Previous Month"
//                   >
//                     <ChevronLeft size={20} className="text-gray-600" />
//                   </button>
//                 </div>

//                 <div className="flex items-center gap-8 text-base font-semibold text-gray-800">
//                   <span>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
//                   <span>{nextMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
//                 </div>

//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={handleNextMonth}
//                     className="p-1 hover:bg-gray-100 rounded transition"
//                     title="Next Month"
//                   >
//                     <ChevronRight size={20} className="text-gray-600" />
//                   </button>
//                   <button
//                     onClick={handleNextYear}
//                     className="p-1 hover:bg-gray-100 rounded transition"
//                     title="Next Year"
//                   >
//                     <ChevronsRight size={20} className="text-gray-600" />
//                   </button>
//                 </div>
//               </div>

//               {/* Two calendars side by side */}
//               <div className="flex gap-6 mb-4">
//                 <CalendarMonth month={currentMonth} />
//                 <CalendarMonth month={nextMonth} />
//               </div>

//               {/* Date inputs and Apply button */}
//               <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
//                 <div className="flex-1">
//                   <label className="block text-xs text-gray-500 mb-1">START DATE</label>
//                   <input
//                     type="text"
//                     value={tempRange.from?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) || ""}
//                     readOnly
//                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
//                     placeholder="MM/DD/YYYY"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <label className="block text-xs text-gray-500 mb-1">END DATE</label>
//                   <input
//                     type="text"
//                     value={tempRange.to?.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) || ""}
//                     readOnly
//                     className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
//                     placeholder="MM/DD/YYYY"
//                   />
//                 </div>
//                 <button
//                   onClick={handleApply}
//                   className="px-6 py-2 bg-purple-700 text-white rounded font-medium hover:bg-purple-800 transition-colors self-end"
//                 >
//                   Apply
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DateRangePicker;
