
import React, { useMemo, useState, useEffect } from 'react';
import { Member, Deposit } from '../types';
import { getCurrentYear } from '../utils/dateUtils';
import DepositHistory from './DepositHistory';
import { PencilIcon, TrashIcon } from './icons';

interface MemberCardProps {
  member: Member;
  onAddDeposit: (memberId: string, weekNumber: number, penalty: number) => void;
  onUpdateMember: (memberId: string, name: string, weeklyGoal: number) => void;
  onDeleteMember: (memberId: string) => void;
  onUpdateDeposit: (memberId: string, depositId: string, newPenalty: number) => void;
  onDeleteDeposit: (memberId: string, depositId: string) => void;
  formatCurrency: (amount: number) => string;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onAddDeposit, onUpdateMember, onDeleteMember, onUpdateDeposit, onDeleteDeposit, formatCurrency }) => {
  const [isDepositFormVisible, setIsDepositFormVisible] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [penalty, setPenalty] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editedName, setEditedName] = useState(member.name);
  const [editedGoal, setEditedGoal] = useState(member.weeklyGoal.toString());
  
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [editedPenalty, setEditedPenalty] = useState<string>('');

  useEffect(() => {
    setEditedName(member.name);
    setEditedGoal(member.weeklyGoal.toString());
  }, [member]);

  const { totalSaved, totalPenalties } = useMemo(() => {
    let saved = 0;
    let penalties = 0;
    for (const deposit of member.deposits) {
        saved += deposit.amount;
        penalties += deposit.penalty;
    }
    return { totalSaved: saved, totalPenalties: penalties };
  }, [member.deposits]);
  
  const totalRegularSavings = totalSaved - totalPenalties;
  const currentSavingsYear = getCurrentYear();
  const paidWeeks = useMemo(() => new Set(member.deposits.filter(d => d.year === currentSavingsYear).map(d => d.weekNumber)), [member.deposits, currentSavingsYear]);

  const handleRegisterClick = () => {
    setIsDepositFormVisible(!isDepositFormVisible);
    setSelectedWeek('');
    setPenalty('');
    setError('');
  };

  const handleConfirmDeposit = () => {
    const weekNum = parseInt(selectedWeek, 10);
    const penaltyNum = penalty ? parseFloat(penalty) : 0;
    if (!selectedWeek || isNaN(weekNum)) { setError('Please select a week.'); return; }
    if (isNaN(penaltyNum) || penaltyNum < 0) { setError('Please enter a valid penalty amount (0 or more).'); return; }
    onAddDeposit(member.id, weekNum, penaltyNum);
    handleRegisterClick();
  };
  
  const handleMemberEditSubmit = () => {
      const goal = parseFloat(editedGoal);
      if (!editedName.trim() || isNaN(goal) || goal <= 0) {
          alert('Please enter a valid name and a positive weekly goal.');
          return;
      }
      onUpdateMember(member.id, editedName, goal);
      setIsEditingMember(false);
  };
  
  const handleDepositEditSubmit = (depositId: string) => {
      const penaltyNum = parseFloat(editedPenalty);
      if (isNaN(penaltyNum) || penaltyNum < 0) {
          alert('Please enter a valid penalty amount (0 or more).');
          return;
      }
      onUpdateDeposit(member.id, depositId, penaltyNum);
      setEditingDepositId(null);
      setEditedPenalty('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
            {isEditingMember ? (
                <div className="flex-grow space-y-2">
                    <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="block w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm" />
                    <input type="number" value={editedGoal} onChange={e => setEditedGoal(e.target.value)} className="block w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm" step="0.01" min="0.01" />
                </div>
            ) : (
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-slate-500">Weekly Goal: <span className="font-semibold text-emerald-600">{formatCurrency(member.weeklyGoal)}</span></p>
                </div>
            )}
             <div className="flex items-center space-x-2 ml-4">
                {isEditingMember ? (
                    <>
                        <button onClick={handleMemberEditSubmit} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800">Save</button>
                        <button onClick={() => setIsEditingMember(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditingMember(true)} className="p-1 text-slate-400 hover:text-sky-600"><PencilIcon className="w-5 h-5" /></button>
                        <button onClick={() => onDeleteMember(member.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                    </>
                )}
            </div>
        </div>
        <div className="mt-4 text-right">
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-slate-500">Savings: {formatCurrency(totalRegularSavings)} + Penalties: {formatCurrency(totalPenalties)}</p>
        </div>
      </div>
      <div className="px-6 pb-6 space-y-6">
        <DepositHistory deposits={member.deposits} />
        <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Deposit Details</h4>
            <div className="max-h-60 overflow-y-auto border rounded-lg bg-slate-50 p-2 space-y-2">
                {member.deposits.length > 0 ? [...member.deposits].reverse().map(dep => (
                     <div key={dep.id} className="text-sm bg-white p-2 rounded-md border flex justify-between items-center">
                         {editingDepositId === dep.id ? (
                             <div className="flex-grow flex items-center gap-2">
                                <span>Week {dep.weekNumber} ({dep.year}): {formatCurrency(member.weeklyGoal)} + Penalty:</span>
                                <input type="number" value={editedPenalty} onChange={e => setEditedPenalty(e.target.value)} className="w-20 px-1 py-0.5 border rounded-md" step="0.01" min="0"/>
                                <button onClick={() => handleDepositEditSubmit(dep.id)} className="font-semibold text-emerald-600">Save</button>
                                <button onClick={() => setEditingDepositId(null)} className="text-slate-500">Cancel</button>
                             </div>
                         ) : (
                             <>
                                <div>
                                    <p className="font-medium text-slate-800">Week {dep.weekNumber} <span className="text-xs text-slate-400">({dep.year})</span> - Total: {formatCurrency(dep.amount)}</p>
                                    <p className="text-xs text-slate-500">Payment on {new Date(dep.date).toLocaleDateString()} (Penalty: {formatCurrency(dep.penalty)})</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => {setEditingDepositId(dep.id); setEditedPenalty(dep.penalty.toString());}} className="p-1 text-slate-400 hover:text-sky-600"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => onDeleteDeposit(member.id, dep.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                             </>
                         )}
                     </div>
                )) : <p className="text-center text-sm text-slate-500 py-4">No deposits recorded yet.</p>}
            </div>
        </div>
      </div>
      <div className="bg-slate-50 px-6 py-4">
        {isDepositFormVisible && (
          <div className="mb-4 p-4 bg-slate-100 rounded-lg space-y-3 border border-slate-200">
            <h4 className="font-semibold text-slate-700">New Deposit</h4>
            <div>
              <label htmlFor={`week-select-${member.id}`} className="block text-sm font-medium text-slate-600">Week to Pay</label>
              <select id={`week-select-${member.id}`} value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                <option value="">-- Select a week --</option>
                {Array.from({ length: 50 }, (_, i) => i + 1).map(week => (
                  <option key={week} value={week} disabled={paidWeeks.has(week)}>Week {week} {paidWeeks.has(week) ? '(Paid)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`penalty-input-${member.id}`} className="block text-sm font-medium text-slate-600">Penalty (Optional)</label>
              <input type="number" id={`penalty-input-${member.id}`} value={penalty} onChange={(e) => setPenalty(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" placeholder="0.00" min="0" step="0.01"/>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex space-x-2 pt-2">
              <button onClick={handleConfirmDeposit} className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Save Deposit</button>
              <button onClick={handleRegisterClick} className="flex-1 px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">Cancel</button>
            </div>
          </div>
        )}
        <button onClick={handleRegisterClick} className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">{isDepositFormVisible ? 'Close Form' : 'Register a Payment'}</button>
      </div>
    </div>
  );
};

export default MemberCard;
