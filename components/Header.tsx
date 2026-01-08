
import React from 'react';
import { PiggyBankIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <PiggyBankIcon className="h-8 w-8 text-emerald-500" />
            <h1 className="ml-3 text-2xl font-bold text-slate-800">
              Caja Cuevas <span className="font-light text-slate-500">Savings Tracker</span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
