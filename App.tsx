
import React, { useState, useEffect, useMemo } from 'react';
import { Member, Deposit, Loan, LoanPayment } from './types';
import { getWeekInfo, getMonthsPassed } from './utils/dateUtils';
import Header from './components/Header';
import AddMemberForm from './components/AddMemberForm';
import MemberCard from './components/MemberCard';
import LoanManagement from './components/LoanManagement';
import DataManagement from './components/DataManagement';
import { PiggyBankIcon, UsersIcon, TrendingUpIcon, ExclamationTriangleIcon, BanknotesIcon, ChartBarIcon, ScaleIcon } from './components/icons';

const App: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const savedMembers = localStorage.getItem('cajaCuevasMembers');
      return savedMembers ? JSON.parse(savedMembers) : [];
    } catch (error) {
      console.error("Could not load members from localStorage", error);
      return [];
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const savedLoans = localStorage.getItem('cajaCuevasLoans');
      return savedLoans ? JSON.parse(savedLoans) : [];
    } catch (error) {
      console.error("Could not load loans from localStorage", error);
      return [];
    }
  });
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('cajaCuevasMembers', JSON.stringify(members));
      localStorage.setItem('cajaCuevasLoans', JSON.stringify(loans));
    } catch (error) {
      console.error("Could not save to localStorage", error);
    }
  }, [members, loans]);

  const handleAddMember = (name: string, weeklyGoal: number) => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      weeklyGoal,
      joinDate: new Date().toISOString(),
      deposits: [],
    };
    setMembers(prevMembers => [...prevMembers, newMember].sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedMemberId(newMember.id);
  };
  
  const handleUpdateMember = (memberId: string, name: string, weeklyGoal: number) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, name, weeklyGoal } : m));
  };

  const handleDeleteMember = (memberId: string) => {
      if (loans.some(loan => loan.memberId === memberId)) {
          alert("Cannot delete a member with existing loans (active or paid). Please resolve their loans first.");
          return;
      }
      if (window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
          setMembers(prev => prev.filter(m => m.id !== memberId));
          if (selectedMemberId === memberId) {
              setSelectedMemberId(null);
          }
      }
  };

  const handleAddDeposit = (memberId: string, weekNumber: number, penalty: number) => {
    setMembers(prevMembers =>
      prevMembers.map(member => {
        if (member.id === memberId) {
          const { year } = getWeekInfo(new Date());
          const alreadyPaid = member.deposits.some(d => d.weekNumber === weekNumber && d.year === year);
          if (alreadyPaid) {
            alert(`Deposit for week ${weekNumber} has already been registered.`);
            return member;
          }
          const newDeposit: Deposit = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount: member.weeklyGoal + penalty,
            penalty: penalty,
            weekNumber,
            year,
          };
          const updatedDeposits = [...member.deposits, newDeposit].sort((a, b) => a.year - b.year || a.weekNumber - b.weekNumber);
          return { ...member, deposits: updatedDeposits };
        }
        return member;
      })
    );
  };
  
  const handleUpdateDeposit = (memberId: string, depositId: string, newPenalty: number) => {
    setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
            const updatedDeposits = m.deposits.map(d => {
                if (d.id === depositId) {
                    return { ...d, penalty: newPenalty, amount: m.weeklyGoal + newPenalty };
                }
                return d;
            });
            return { ...m, deposits: updatedDeposits };
        }
        return m;
    }));
  };

  const handleDeleteDeposit = (memberId: string, depositId: string) => {
      if (!window.confirm("Are you sure you want to delete this deposit? This action cannot be undone.")) {
          return;
      }
      
      setMembers(currentMembers => {
          const memberIndex = currentMembers.findIndex(m => m.id === memberId);
          if (memberIndex === -1) return currentMembers;

          const memberToUpdate = currentMembers[memberIndex];
          const updatedDeposits = memberToUpdate.deposits.filter(d => d.id !== depositId);
          
          const updatedMember = { ...memberToUpdate, deposits: updatedDeposits };

          const newMembers = [...currentMembers];
          newMembers[memberIndex] = updatedMember;

          return newMembers;
      });
  };

  const { totalRegularSavings, totalPenalties, totalLoanedOut, totalInterestPaid, fundBalance, totalEarnings } = useMemo(() => {
    let totalDeposits = 0;
    let penalties = 0;
    members.forEach(member => {
        member.deposits.forEach(deposit => {
            totalDeposits += deposit.amount;
            penalties += deposit.penalty;
        });
    });
    const regularSavings = totalDeposits - penalties;
    let activeLoanPrincipals = 0;
    let interestEffectivelyPaid = 0;
    let totalPrincipalEverLoaned = 0;
    let totalPaymentsReceived = 0;
    loans.forEach(loan => {
        totalPrincipalEverLoaned += loan.principalAmount;
        const totalPaidForLoan = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        totalPaymentsReceived += totalPaidForLoan;
        const accruedInterest = getMonthsPassed(loan.loanDate, loan.paidDate) * loan.principalAmount * 0.05;
        const interestPaidForThisLoan = Math.min(totalPaidForLoan, accruedInterest);
        interestEffectivelyPaid += interestPaidForThisLoan;
        if (loan.status === 'active') {
            const principalPaid = totalPaidForLoan - interestPaidForThisLoan;
            activeLoanPrincipals += loan.principalAmount - principalPaid;
        }
    });
    const cashBalance = totalDeposits - totalPrincipalEverLoaned + totalPaymentsReceived;
    const totalEarnings = penalties + interestEffectivelyPaid;
    return { 
        totalRegularSavings: regularSavings,
        totalPenalties: penalties,
        totalLoanedOut: activeLoanPrincipals,
        totalInterestPaid: interestEffectivelyPaid,
        fundBalance: cashBalance,
        totalEarnings,
    };
  }, [members, loans]);
  
  const handleAddLoan = (memberId: string, amount: number) => {
    if (amount > fundBalance) {
      alert("Loan amount exceeds available funds.");
      return;
    }
    const newLoan: Loan = {
      id: crypto.randomUUID(),
      memberId,
      principalAmount: amount,
      loanDate: new Date().toISOString(),
      status: 'active',
      payments: [],
    };
    setLoans(prevLoans => [...prevLoans, newLoan]);
  };
  
  const handleDeleteLoan = (loanId: string) => {
      if (window.confirm("Are you sure you want to delete this loan and all its payments? This action cannot be undone.")) {
          setLoans(prev => prev.filter(l => l.id !== loanId));
      }
  };

  const handleRecordLoanPayment = (loanId: string, amount: number) => {
    const loanToUpdate = loans.find(l => l.id === loanId);
    if (!loanToUpdate) return;
    const monthsPassed = getMonthsPassed(loanToUpdate.loanDate);
    const interest = loanToUpdate.principalAmount * 0.05 * monthsPassed;
    const totalPaid = loanToUpdate.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = loanToUpdate.principalAmount + interest - totalPaid;
    if (amount > balance + 0.001) {
        alert(`Payment of ${formatCurrency(amount)} exceeds the outstanding balance of ${formatCurrency(balance)}. Payment not recorded.`);
        return;
    }
    setLoans(prevLoans => prevLoans.map(loan => {
        if (loan.id === loanId) {
            const newPayment: LoanPayment = { id: crypto.randomUUID(), date: new Date().toISOString(), amount };
            const updatedPayments = [...loan.payments, newPayment];
            const totalOwed = loan.principalAmount + interest;
            const newTotalPaid = totalPaid + amount;
            const newStatus = newTotalPaid >= totalOwed - 0.001 ? 'paid' : 'active';
            const paidDate = newStatus === 'paid' && !loan.paidDate ? new Date().toISOString() : loan.paidDate;
            return { ...loan, payments: updatedPayments, status: newStatus, paidDate };
        }
        return loan;
    }));
  };

  const handleUpdateLoanPayment = (loanId: string, paymentId: string, newAmount: number) => {
      setLoans(prev => prev.map(loan => {
          if (loan.id === loanId) {
              const otherPaymentsTotal = loan.payments.filter(p => p.id !== paymentId).reduce((sum, p) => sum + p.amount, 0);
              const monthsPassed = getMonthsPassed(loan.loanDate);
              const interest = loan.principalAmount * 0.05 * monthsPassed;
              const totalOwed = loan.principalAmount + interest;
              const balanceBeforeThisPayment = totalOwed - otherPaymentsTotal;
              
              if (newAmount > balanceBeforeThisPayment + 0.001) {
                  alert(`Updated amount of ${formatCurrency(newAmount)} exceeds the outstanding balance of ${formatCurrency(balanceBeforeThisPayment)}. Please enter a smaller amount.`);
                  return loan;
              }

              const updatedPayments = loan.payments.map(p => p.id === paymentId ? { ...p, amount: newAmount } : p);
              const newTotalPaid = otherPaymentsTotal + newAmount;
              const newStatus = newTotalPaid >= totalOwed - 0.001 ? 'paid' : 'active';
              const paidDate = newStatus === 'paid' && !loan.paidDate ? new Date().toISOString() : (newStatus === 'active' ? undefined : loan.paidDate);
              return { ...loan, payments: updatedPayments, status: newStatus, paidDate };
          }
          return loan;
      }));
  };

  const handleDeleteLoanPayment = (loanId: string, paymentId: string) => {
      if (!window.confirm("Are you sure you want to delete this payment?")) return;
      setLoans(prev => prev.map(loan => {
          if (loan.id === loanId) {
              const updatedPayments = loan.payments.filter(p => p.id !== paymentId);
              const monthsPassed = getMonthsPassed(loan.loanDate);
              const interest = loan.principalAmount * 0.05 * monthsPassed;
              const totalOwed = loan.principalAmount + interest;
              const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
              const newStatus = totalPaid >= totalOwed - 0.001 ? 'paid' : 'active';
              const paidDate = newStatus === 'paid' && !loan.paidDate ? new Date().toISOString() : (newStatus === 'active' ? undefined : loan.paidDate);
              return { ...loan, payments: updatedPayments, status: newStatus, paidDate };
          }
          return loan;
      }));
  };

  const handleImportData = (data: { members: Member[], loans: Loan[] }) => {
    if (window.confirm("Are you sure you want to replace all current data with the data from this file? This action cannot be undone.")) {
      const sortedMembers = data.members.sort((a, b) => a.name.localeCompare(b.name));
      try {
        localStorage.setItem('cajaCuevasMembers', JSON.stringify(sortedMembers));
        localStorage.setItem('cajaCuevasLoans', JSON.stringify(data.loans));
      } catch (error) {
        console.error("Failed to save imported data to storage:", error);
        alert("An error occurred while saving the imported data. Please check the console and try again.");
        return;
      }
      setMembers(sortedMembers);
      setLoans(data.loans);
      setSelectedMemberId(null);
      alert("Data imported successfully!");
    }
  };

  const handleDeleteAllData = () => {
    if (window.confirm("DANGER: Are you sure you want to delete ALL application data? This includes all members, deposits, and loans. This action cannot be undone.")) {
        if (window.confirm("This is your final confirmation. Deleting all data is irreversible. Are you absolutely sure?")) {
            try {
              localStorage.removeItem('cajaCuevasMembers');
              localStorage.removeItem('cajaCuevasLoans');
            } catch (error) {
                console.error("Failed to clear data from storage:", error);
                alert("An error occurred while trying to delete the data. Please check the console and try again.");
                return;
            }
            setMembers([]);
            setLoans([]);
            setSelectedMemberId(null);
            alert("All data has been successfully deleted.");
        }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find(m => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-8 bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col lg:h-[calc(100vh-4rem)]">
            <div className="flex-grow overflow-y-auto -mr-6 pr-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Add New Member</h2>
              <AddMemberForm onAddMember={handleAddMember} />
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Fund Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600"><UsersIcon className="w-5 h-5 mr-3 text-sky-500" /><span className="font-semibold">Total Members:</span><span className="ml-auto font-bold text-slate-800">{members.length}</span></div>
                  <div className="flex items-center text-slate-600"><PiggyBankIcon className="w-5 h-5 mr-3 text-emerald-500" /><span className="font-semibold">Total Saved:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(totalRegularSavings)}</span></div>
                  <div className="flex items-center text-slate-600"><ExclamationTriangleIcon className="w-5 h-5 mr-3 text-amber-500" /><span className="font-semibold">Total Penalties:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(totalPenalties)}</span></div>
                  <div className="flex items-center text-slate-600"><BanknotesIcon className="w-5 h-5 mr-3 text-red-500" /><span className="font-semibold">Money Loaned Out:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(totalLoanedOut)}</span></div>
                  <div className="flex items-center text-slate-600"><ChartBarIcon className="w-5 h-5 mr-3 text-blue-500" /><span className="font-semibold">Interest Generated:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(totalInterestPaid)}</span></div>
                  <div className="flex items-center text-slate-600"><ScaleIcon className="w-5 h-5 mr-3 text-purple-500" /><span className="font-semibold">Total Earnings:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(totalEarnings)}</span></div>
                  <div className="flex items-center text-slate-600 pt-3 mt-3 border-t border-slate-200"><PiggyBankIcon className="w-5 h-5 mr-3 text-teal-500" /><span className="font-semibold">Available Cash:</span><span className="ml-auto font-bold text-slate-800">{formatCurrency(fundBalance)}</span></div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200">
                  <LoanManagement
                      members={members}
                      loans={loans}
                      availableForLoan={fundBalance}
                      onAddLoan={handleAddLoan}
                      onRecordLoanPayment={handleRecordLoanPayment}
                      onDeleteLoan={handleDeleteLoan}
                      onUpdateLoanPayment={handleUpdateLoanPayment}
                      onDeleteLoanPayment={handleDeleteLoanPayment}
                      formatCurrency={formatCurrency}
                  />
              </div>
            </div>
            <div className="flex-shrink-0 mt-auto pt-6 border-t border-slate-200">
              <DataManagement
                  members={members}
                  loans={loans}
                  onImportData={handleImportData}
                  onDeleteAllData={handleDeleteAllData}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            {members.length > 0 ? (
                <div>
                    <div className="mb-6 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                        <label htmlFor="member-select" className="block text-lg font-medium text-slate-700 mb-2">Select Member to View</label>
                        <select
                        id="member-select"
                        value={selectedMemberId || ''}
                        onChange={(e) => setSelectedMemberId(e.target.value || null)}
                        className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-base"
                        >
                        <option value="">-- Choose a member --</option>
                        {members.map(member => (
                            <option key={member.id} value={member.id}>
                            {member.name}
                            </option>
                        ))}
                        </select>
                    </div>

                    {selectedMember ? (
                        <MemberCard
                        key={selectedMember.id}
                        member={selectedMember}
                        onAddDeposit={handleAddDeposit}
                        onUpdateMember={handleUpdateMember}
                        onDeleteMember={handleDeleteMember}
                        onUpdateDeposit={handleUpdateDeposit}
                        onDeleteDeposit={handleDeleteDeposit}
                        formatCurrency={formatCurrency}
                        />
                    ) : (
                        <div className="text-center bg-white p-12 rounded-2xl shadow-md border border-slate-200">
                        <UsersIcon className="w-16 h-16 mx-auto text-slate-300" />
                        <h3 className="mt-4 text-xl font-semibold text-slate-700">Select a Member</h3>
                        <p className="mt-1 text-slate-500">Choose a member from the dropdown above to view their savings details.</p>
                        </div>
                    )}
                </div>
            ) : (
              <div className="text-center bg-white p-12 rounded-2xl shadow-md border border-slate-200">
                <TrendingUpIcon className="w-16 h-16 mx-auto text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-slate-700">No members yet!</h3>
                <p className="mt-1 text-slate-500">Add a member using the form to start tracking savings.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
