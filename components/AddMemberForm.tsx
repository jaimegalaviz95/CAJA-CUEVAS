
import React, { useState } from 'react';
import { PlusCircleIcon } from './icons';

interface AddMemberFormProps {
  onAddMember: (name: string, weeklyGoal: number) => void;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAddMember }) => {
  const [name, setName] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal = parseFloat(weeklyGoal);
    if (!name.trim() || isNaN(goal) || goal <= 0) {
      setError('Please enter a valid name and a positive weekly goal.');
      return;
    }
    onAddMember(name, goal);
    setName('');
    setWeeklyGoal('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Member Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="e.g., John Doe"
          />
        </div>
      </div>
      <div>
        <label htmlFor="weeklyGoal" className="block text-sm font-medium text-slate-700">
          Weekly Savings Goal ($)
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="weeklyGoal"
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="e.g., 25"
            min="0.01"
            step="0.01"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
      >
        <PlusCircleIcon className="w-5 h-5 mr-2" />
        Add Member
      </button>
    </form>
  );
};

export default AddMemberForm;
