
import React from 'react';
import { Deposit } from '../types';
import { getWeekInfo, getCurrentYear } from '../utils/dateUtils';

interface DepositHistoryProps {
  deposits: Deposit[];
}

const DepositHistory: React.FC<DepositHistoryProps> = ({ deposits }) => {
  const currentYear = getCurrentYear();
  const { weekNumber: currentWeek } = getWeekInfo(new Date());

  const depositsForCurrentYear = new Set(
    deposits
      .filter(d => d.year === currentYear)
      .map(d => d.weekNumber)
  );

  const weeks = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-600 mb-2">{currentYear} Deposit History</h4>
      <div className="grid grid-cols-10 gap-1.5">
        {weeks.map(week => {
          const hasDeposited = depositsForCurrentYear.has(week);
          const isCurrentWeek = week === currentWeek;
          const isFutureWeek = week > currentWeek;

          let bgColor = 'bg-slate-200';
          if (hasDeposited) {
            bgColor = 'bg-emerald-500';
          } else if (isCurrentWeek) {
            bgColor = 'bg-sky-400';
          } else if (isFutureWeek) {
             bgColor = 'bg-slate-100';
          }

          return (
            <div
              key={week}
              className={`w-full aspect-square rounded-sm tooltip-container ${bgColor} relative flex items-center justify-center`}
              title={`Week ${week}`}
            >
              <span className={`text-xs font-bold ${hasDeposited || isCurrentWeek ? 'text-white' : 'text-slate-500'}`}>{week}</span>
              <span className="tooltip-text">{`Week ${week}`}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .grid-cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)); }
        .tooltip-container { position: relative; }
        .tooltip-text {
          visibility: hidden;
          width: 80px;
          background-color: #334155;
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 5px 0;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -40px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #334155 transparent transparent transparent;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
       <div className="flex justify-end space-x-4 mt-3 text-xs text-slate-500">
         <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-emerald-500 mr-1.5"></span>Paid</div>
         <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-slate-200 mr-1.5"></span>Missed</div>
         <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-sky-400 mr-1.5"></span>Current</div>
       </div>
    </div>
  );
};

export default DepositHistory;
