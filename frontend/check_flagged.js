const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching PND flagged ledgers...");
  const { data, error } = await supabase
    .from('daily_ledgers')
    .select('ledger_date, status, variance, opening_balance, closing_balance, transfer_in, transfer_out, loan_issued_total, redemption_total, interest_rec_total, recovery_total, insurance_total, expenses_total')
    .eq('branch_id', 'PND')
    .in('ledger_date', ['2025-01-14', '2025-01-15', '2025-01-17', '2025-01-18'])
    .order('ledger_date');

  if (error) {
    console.error("DB Error:", error.message);
    return;
  }

  for (const row of data) {
    console.log(`\n=== Date: ${row.ledger_date} ===`);
    console.log(`Status: ${row.status} (Variance: ${row.variance})`);
    console.log(`1. Opening Balance:  + ${row.opening_balance}`);
    console.log(`2. Transfer In:      + ${row.transfer_in}`);
    console.log(`3. Transfer Out:     - ${row.transfer_out}`);
    console.log(`4. Loan Issued:      - ${row.loan_issued_total}`);
    console.log(`5. Redemption:       + ${row.redemption_total}`);
    console.log(`6. Interest:         + ${row.interest_rec_total}`);
    console.log(`7. Recovery:         + ${row.recovery_total}`);
    console.log(`8. Insurance:        + ${row.insurance_total}`);
    console.log(`9. Expenses:         - ${row.expenses_total}`);
    
    const calc = (Number(row.opening_balance) 
                + Number(row.transfer_in) 
                - Number(row.transfer_out) 
                - Number(row.loan_issued_total) 
                + Number(row.redemption_total) 
                + Number(row.interest_rec_total) 
                + Number(row.recovery_total) 
                + Number(row.insurance_total) 
                - Number(row.expenses_total)).toFixed(2);
                
    console.log(`----------------------------------`);
    console.log(`Calculated Closing:  = ${calc}`);
    console.log(`User Input Closing:    ${row.closing_balance}`);
    console.log(`Difference (Var):      ${(Number(row.closing_balance) - Number(calc)).toFixed(2)}`);
  }
}
run();
