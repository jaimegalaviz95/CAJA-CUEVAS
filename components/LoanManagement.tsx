
import React, { useState } from 'react';
import { Member, Loan, LoanPayment } from '../types';
import { getMonthsPassed } from '../utils/dateUtils';
import { PlusCircleIcon, CheckCircleIcon, TrashIcon, PencilIcon } from './icons';

interface LoanManagementProps {
    members: Member[];
    loans: Loan[];
    availableForLoan: number;
    onAddLoan: (memberId: string, amount: number) => void;
    onRecordLoanPayment: (loanId: string, amount: number) => void;
    onDeleteLoan: (loanId: string) => void;
    onUpdateLoanPayment: (loanId: string, paymentId: string, newAmount: number) => void;
    onDeleteLoanPayment: (loanId: string, paymentId: string) => void;
    formatCurrency: (amount: number) => string;
}

const LoanPaymentItem: React.FC<{
    loanId: string;
    payment: LoanPayment;
    onUpdate: (loanId: string, paymentId: string, newAmount: number) => void;
    onDelete: (loanId: string, paymentId: string) => void;
    formatCurrency: (amount: number) => string;
}> = ({ loanId, payment, onUpdate, onDelete, formatCurrency }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState(payment.amount.toString());

    const handleSave = () => {
        const newAmount = parseFloat(amount);
        if (isNaN(newAmount) || newAmount <= 0) {
            alert("Please enter a valid positive amount.");
            return;
        }
        onUpdate(loanId, payment.id, newAmount);
        setIsEditing(false);
    };

    return (
        <div className="flex justify-between items-center text-xs p-1.5 bg-white rounded">
            {isEditing ? (
                <div className="flex-grow flex items-center gap-2">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min="0.01" className="w-20 px-1 py-0.5 border rounded-md" />
                    <button onClick={handleSave} className="font-semibold text-emerald-600">Save</button>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500">Cancel</button>
                </div>
            ) : (
                <>
                    <div>
                        <p>{new Date(payment.date).toLocaleDateString()}: <span className="font-medium">{formatCurrency(payment.amount)}</span></p>
                    </div>
                    <div className="flex items-center">
                        <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-sky-600"><PencilIcon className="w-3 h-3" /></button>
                        <button onClick={() => onDelete(loanId, payment.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-3 h-3" /></button>
                    </div>
                </>
            )}
        </div>
    );
};

const LoanItem: React.FC<{
    loan: Loan;
    memberName: string;
    onRecordLoanPayment: (loanId: string, amount: number) => void;
    onDeleteLoan: (loanId: string) => void;
    onUpdateLoanPayment: (loanId: string, paymentId: string, newAmount: number) => void;
    onDeleteLoanPayment: (loanId: string, paymentId: string) => void;
    formatCurrency: (amount: number) => string;
}> = ({ loan, memberName, onRecordLoanPayment, onDeleteLoan, onUpdateLoanPayment, onDeleteLoanPayment, formatCurrency }) => {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [showPayments, setShowPayments] = useState(false);

    const monthsPassed = getMonthsPassed(loan.loanDate);
    const accruedInterest = loan.principalAmount * 0.05 * monthsPassed;
    const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = loan.principalAmount + accruedInterest - totalPaid;

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return;
        if (amount > balance + 0.001) {
            alert(`Payment cannot exceed the outstanding balance of ${formatCurrency(balance)}.`);
            return;
        }
        onRecordLoanPayment(loan.id, amount);
        setPaymentAmount('');
        setIsPaying(false);
    };
    
    return (
        <div className="p-3 bg-slate-100 rounded-lg text-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-slate-800">{memberName}</p>
                    <p className="text-xs text-slate-500">Date: {new Date(loan.loanDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                    <p className="font-bold text-red-600 mr-2">{formatCurrency(balance)}</p>
                    <button onClick={() => onDeleteLoan(loan.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="text-slate-600 mt-2 grid grid-cols-3 gap-x-2 text-xs">
                <p>Principal: <span className="block font-medium text-slate-700">{formatCurrency(loan.principalAmount)}</span></p>
                <p>Interest ({monthsPassed} mo): <span className="block font-medium text-slate-700">{formatCurrency(accruedInterest)}</span></p>
                <p>Paid: <span className="block font-medium text-slate-700">{formatCurrency(totalPaid)}</span></p>
            </div>

            {loan.payments.length > 0 && (
                <div className="mt-2">
                    <button onClick={() => setShowPayments(!showPayments)} className="text-xs text-sky-600 font-semibold">{showPayments ? 'Hide' : 'Show'} Payments ({loan.payments.length})</button>
                    {showPayments && (
                        <div className="mt-1 space-y-1 p-2 bg-slate-200 rounded-md">
                            {loan.payments.map(p => <LoanPaymentItem key={p.id} loanId={loan.id} payment={p} onUpdate={onUpdateLoanPayment} onDelete={onDeleteLoanPayment} formatCurrency={formatCurrency} />)}
                        </div>
                    )}
                </div>
            )}
            
            {loan.status === 'active' && balance > 0.001 && (
              <div className="mt-3">
                  {isPaying ? (
                      <form onSubmit={handlePaymentSubmit} className="flex gap-2 items-center">
                          <input type="number" step="0.01" min="0.01" max={balance.toFixed(2)} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount" className="block w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded-md" required/>
                          <button type="submit" className="px-3 py-1 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">Pay</button>
                          <button type="button" onClick={() => setIsPaying(false)} className="px-3 py-1 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 border">X</button>
                      </form>
                  ) : (
                      <button onClick={() => setIsPaying(true)} className="w-full px-4 py-1.5 text-xs font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700">Record Payment</button>
                  )}
              </div>
            )}
        </div>
    );
};

const PaidLoanItem: React.FC<{
    loan: Loan;
    memberName: string;
    onDeleteLoan: (loanId: string) => void;
    onUpdateLoanPayment: (loanId: string, paymentId: string, newAmount: number) => void;
    onDeleteLoanPayment: (loanId: string, paymentId: string) => void;
    formatCurrency: (amount: number) => string;
}> = ({ loan, memberName, onDeleteLoan, onUpdateLoanPayment, onDeleteLoanPayment, formatCurrency }) => {
    const [showPayments, setShowPayments] = useState(false);
    const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const interestPaid = Math.max(0, totalPaid - loan.principalAmount);
    return (
        <div className="p-3 bg-emerald-50 rounded-lg text-sm border border-emerald-200">
             <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-slate-800">{memberName}</p>
                    <p className="text-xs text-slate-500">Loan: {new Date(loan.loanDate).toLocaleDateString()} | Paid: {loan.paidDate ? new Date(loan.paidDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="flex items-center">
                    <div className="flex items-center text-emerald-600 mr-2"><CheckCircleIcon className="w-5 h-5 mr-1" /><span className="font-bold">Paid</span></div>
                    <button onClick={() => onDeleteLoan(loan.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
             <div className="text-slate-600 mt-2 grid grid-cols-2 gap-x-2 text-xs">
                <p>Principal: <span className="block font-medium text-slate-700">{formatCurrency(loan.principalAmount)}</span></p>
                <p>Interest Paid: <span className="block font-medium text-slate-700">{formatCurrency(interestPaid)}</span></p>
            </div>
             {loan.payments.length > 0 && (
                <div className="mt-2">
                    <button onClick={() => setShowPayments(!showPayments)} className="text-xs text-sky-600 font-semibold">{showPayments ? 'Hide' : 'Show'} Payments ({loan.payments.length})</button>
                    {showPayments && (
                        <div className="mt-1 space-y-1 p-2 bg-emerald-100 rounded-md">
                            {loan.payments.map(p => <LoanPaymentItem key={p.id} loanId={loan.id} payment={p} onUpdate={onUpdateLoanPayment} onDelete={onDeleteLoanPayment} formatCurrency={formatCurrency} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const LoanManagement: React.FC<LoanManagementProps> = ({ members, loans, availableForLoan, onAddLoan, onRecordLoanPayment, onDeleteLoan, onUpdateLoanPayment, onDeleteLoanPayment, formatCurrency }) => {
    const [selectedMember, setSelectedMember] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const amount = parseFloat(loanAmount);
        if (!selectedMember) { setError('Please select a member.'); return; }
        if (isNaN(amount) || amount <= 0) { setError('Please enter a valid amount.'); return; }
        if (amount > availableForLoan) { setError(`Amount exceeds available funds (${formatCurrency(availableForLoan)}).`); return; }
        onAddLoan(selectedMember, amount);
        setSelectedMember('');
        setLoanAmount('');
    };
    
    const activeLoans = loans.filter(l => l.status === 'active').sort((a,b) => new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime());
    const paidLoans = loans.filter(l => l.status === 'paid').sort((a,b) => new Date(b.paidDate || 0).getTime() - new Date(a.paidDate || 0).getTime());
    const memberMap = new Map(members.map(m => [m.id, m.name]));

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Loan Management</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="loan-member" className="block text-sm font-medium text-slate-700">Member</label>
                    <select id="loan-member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                        <option value="">-- Select Member --</option>
                        {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="loan-amount" className="block text-sm font-medium text-slate-700">Loan Amount ($)</label>
                    <input type="number" id="loan-amount" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 500" min="0.01" step="0.01" />
                    <p className="text-xs text-slate-500 mt-1">Available cash: {formatCurrency(availableForLoan)}</p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Create Loan
                </button>
            </form>
            <div className="mt-6">
                <div className="border-b border-slate-200 mb-2">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('active')} className={`${activeTab === 'active' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Active ({activeLoans.length})</button>
                        <button onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>History ({paidLoans.length})</button>
                    </nav>
                </div>
                {activeTab === 'active' && (
                    activeLoans.length > 0 ? (
                        <div className="space-y-2">
                            {activeLoans.map(loan => (
                                <LoanItem key={loan.id} loan={loan} memberName={memberMap.get(loan.memberId) || 'Unknown Member'} onRecordLoanPayment={onRecordLoanPayment} onDeleteLoan={onDeleteLoan} onUpdateLoanPayment={onUpdateLoanPayment} onDeleteLoanPayment={onDeleteLoanPayment} formatCurrency={formatCurrency} />
                            ))}
                        </div>
                    ) : ( <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md text-center">No active loans.</p> )
                )}
                 {activeTab === 'history' && (
                    paidLoans.length > 0 ? (
                        <div className="space-y-2">
                            {paidLoans.map(loan => (
                                <PaidLoanItem key={loan.id} loan={loan} memberName={memberMap.get(loan.memberId) || 'Unknown Member'} onDeleteLoan={onDeleteLoan} onUpdateLoanPayment={onUpdateLoanPayment} onDeleteLoanPayment={onDeleteLoanPayment} formatCurrency={formatCurrency} />
                            ))}
                        </div>
                    ) : ( <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md text-center">No paid loans in history.</p> )
                )}
            </div>
        </div>
    );
};

export default LoanManagement;
