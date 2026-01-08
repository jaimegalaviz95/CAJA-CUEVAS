
export interface Deposit {
  id: string;
  date: string; // ISO string
  amount: number; // This is the total: weeklyGoal + penalty
  penalty: number;
  weekNumber: number;
  year: number;
}

export interface Member {
  id:string;
  name: string;
  weeklyGoal: number;
  joinDate: string; // ISO string
  deposits: Deposit[];
}

export interface LoanPayment {
    id: string;
    date: string; // ISO string
    amount: number;
}

export interface Loan {
    id: string;
    memberId: string;
    principalAmount: number;
    loanDate: string; // ISO string
    status: 'active' | 'paid';
    payments: LoanPayment[];
    paidDate?: string; // ISO string
}
