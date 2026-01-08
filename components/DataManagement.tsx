
import React from 'react';
import * as XLSX from 'xlsx';
import { Member, Loan, Deposit, LoanPayment } from '../types';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from './icons';

interface DataManagementProps {
    members: Member[];
    loans: Loan[];
    onImportData: (data: { members: Member[], loans: Loan[] }) => void;
    onDeleteAllData: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ members, loans, onImportData, onDeleteAllData }) => {
    const handleExport = () => {
        try {
            // 1. Flatten the data into separate arrays for each sheet
            const membersSheetData = members.map(({ deposits, ...rest }) => rest);
            const depositsSheetData = members.flatMap(member => 
                member.deposits.map(deposit => ({ ...deposit, memberId: member.id }))
            );
            const loansSheetData = loans.map(({ payments, ...rest }) => rest);
            const paymentsSheetData = loans.flatMap(loan => 
                loan.payments.map(payment => ({ ...payment, loanId: loan.id }))
            );
            
            // 2. Create worksheets from the flattened data
            const wsMembers = XLSX.utils.json_to_sheet(membersSheetData);
            const wsDeposits = XLSX.utils.json_to_sheet(depositsSheetData);
            const wsLoans = XLSX.utils.json_to_sheet(loansSheetData);
            const wsPayments = XLSX.utils.json_to_sheet(paymentsSheetData);

            // 3. Create a new workbook and append the worksheets
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsMembers, "Members");
            XLSX.utils.book_append_sheet(wb, wsDeposits, "Deposits");
            XLSX.utils.book_append_sheet(wb, wsLoans, "Loans");
            XLSX.utils.book_append_sheet(wb, wsPayments, "Loan Payments");
            
            // 4. Trigger the download of the .xlsx file
            const date = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `caja-cuevas-backup-${date}.xlsx`);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("An error occurred while exporting the data to Excel.");
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) throw new Error("File could not be read.");
                
                const workbook = XLSX.read(data, { type: 'array' });

                const requiredSheets = ["Members", "Deposits", "Loans", "Loan Payments"];
                const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
                if (missingSheets.length > 0) {
                    throw new Error(`Invalid Excel file. Missing required sheets: ${missingSheets.join(', ')}`);
                }
                
                const membersData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets["Members"]);
                const depositsData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets["Deposits"]);
                const loansData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets["Loans"]);
                const paymentsData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets["Loan Payments"]);

                // Reconstruct the nested data structure
                const memberMap = new Map<string, Member>();
                const reconstructedMembers: Member[] = membersData.map((m) => {
                    const member: Member = { ...m, deposits: [] };
                    memberMap.set(member.id, member);
                    return member;
                });
                
                depositsData.forEach((d) => {
                    const member = memberMap.get(d.memberId);
                    if (member) {
                        const { memberId, ...deposit } = d;
                        member.deposits.push(deposit as Deposit);
                    }
                });

                const loanMap = new Map<string, Loan>();
                const reconstructedLoans: Loan[] = loansData.map((l) => {
                    const loan: Loan = { ...l, payments: [] };
                    loanMap.set(loan.id, loan);
                    return loan;
                });

                paymentsData.forEach((p) => {
                    const loan = loanMap.get(p.loanId);
                    if (loan) {
                        const { loanId, ...payment } = p;
                        loan.payments.push(payment as LoanPayment);
                    }
                });
                
                onImportData({ members: reconstructedMembers, loans: reconstructedLoans });

            } catch (error) {
                console.error("Failed to import data:", error);
                alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const triggerImport = () => {
        document.getElementById('import-file-input')?.click();
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Data Management</h3>
            <div className="space-y-3">
                <button
                    onClick={handleExport}
                    className="w-full flex justify-center items-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Export to Excel
                </button>
                 <button
                    onClick={triggerImport}
                    className="w-full flex justify-center items-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    Import from Excel
                </button>
                <button
                    onClick={onDeleteAllData}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete All Data
                </button>
                <input type="file" id="import-file-input" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleImport} />
                 <p className="text-xs text-slate-500 text-center">Export your data to an Excel file for backup. You can view it with Excel or Google Sheets.</p>
            </div>
        </div>
    );
};

export default DataManagement;
