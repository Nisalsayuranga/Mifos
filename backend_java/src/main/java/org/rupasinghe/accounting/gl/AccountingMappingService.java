package org.rupasinghe.accounting.gl;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AccountingMappingService — Mifos X style Double-Entry Bookkeeping.
 * Every pawning event maps to a pair of GL journal entries (DEBIT + CREDIT).
 *
 * Chart of Accounts:
 *  1001 - Cash / Vault                  (ASSET,   DEBIT normal)
 *  1100 - Pawn Loans Receivable         (ASSET,   DEBIT normal)
 *  2100 - Unearned Interest             (LIABILITY, CREDIT normal)
 *  4001 - Interest Income               (INCOME,  CREDIT normal)
 *  4002 - Auction Proceeds              (INCOME,  CREDIT normal)
 *  5001 - Loan Loss / Write-off Expense (EXPENSE, DEBIT normal)
 */
@Service
public class AccountingMappingService {

    public void processTransaction(String transactionId, String type, double amount,
                                   String branchId, String clientId) {
        List<Map<String, Object>> entries = buildJournalEntries(type, amount);
        if (entries.isEmpty()) return;

        Map<String, Object> journalEntry = new HashMap<>();
        journalEntry.put("referenceId", transactionId);
        journalEntry.put("branchId", branchId);
        journalEntry.put("clientId", clientId);
        journalEntry.put("type", type);
        journalEntry.put("amount", amount);
        journalEntry.put("entries", entries);
        journalEntry.put("date", new Date().toString());
        journalEntry.put("timestamp", System.currentTimeMillis());

        // Async write so it never blocks the main transaction response
        new Thread(() -> {
            try {
                Firestore db = FirestoreClient.getFirestore();
                db.collection("journalEntries").document().set(journalEntry).get();
                // Also update vault balance
                updateVaultBalance(db, branchId, type, amount);
                System.out.println("📒 GL Entry created for TX: " + transactionId + " [" + type + "]");
            } catch (Exception e) {
                System.err.println("GL write error: " + e.getMessage());
            }
        }).start();
    }

    private List<Map<String, Object>> buildJournalEntries(String type, double amount) {
        List<Map<String, Object>> entries = new ArrayList<>();
        switch (type) {
            case "PAWN" -> {
                // Disburse cash: DR Pawn Loans Receivable, CR Cash
                entries.add(entry("1100", "Pawn Loans Receivable", "DEBIT",  amount));
                entries.add(entry("1001", "Cash / Vault",          "CREDIT", amount));
            }
            case "REPAYMENT" -> {
                // Customer pays interest: DR Cash, CR Interest Income
                entries.add(entry("1001", "Cash / Vault",   "DEBIT",  amount));
                entries.add(entry("4001", "Interest Income","CREDIT", amount));
            }
            case "REDEMPTION" -> {
                // Customer redeems item: DR Cash (principal back), CR Pawn Loans Receivable
                entries.add(entry("1001", "Cash / Vault",          "DEBIT",  amount));
                entries.add(entry("1100", "Pawn Loans Receivable", "CREDIT", amount));
            }
            case "AUCTION" -> {
                // Branch auctions item: DR Cash, CR Auction Proceeds
                entries.add(entry("1001", "Cash / Vault",    "DEBIT",  amount));
                entries.add(entry("4002", "Auction Proceeds","CREDIT", amount));
            }
            case "TRANSFER" -> {
                // Cash out from this branch: CR Cash / Vault
                entries.add(entry("1001", "Cash / Vault", "CREDIT", amount));
            }
        }
        return entries;
    }

    private Map<String, Object> entry(String account, String name, String type, double amount) {
        return Map.of("account", account, "accountName", name, "type", type, "amount", amount);
    }

    private void updateVaultBalance(Firestore db, String branchId, String txType, double amount) throws Exception {
        String vaultDocId = "vault_" + branchId;
        DocumentSnapshot vaultDoc = db.collection("vaultLedger").document(vaultDocId).get().get();
        Double balance = (vaultDoc.exists() && vaultDoc.contains("balance")) ? vaultDoc.getDouble("balance") : 500000.0;
        double currentBalance = (balance != null) ? balance : 500000.0;

        // PAWN = cash goes OUT (disbursement), everything else = cash comes IN
        double newBalance = "PAWN".equals(txType) || "TRANSFER".equals(txType)
            ? currentBalance - amount : currentBalance + amount;

        Map<String, Object> vault = new HashMap<>();
        vault.put("branchId", branchId);
        vault.put("balance", newBalance);
        vault.put("lastUpdated", System.currentTimeMillis());

        db.collection("vaultLedger").document(vaultDocId).set(vault).get();
    }

    /** Seed the Chart of Accounts into Firestore (called once on startup) */
    public void seedChartOfAccounts() {
        new Thread(() -> {
            try {
                Firestore db = FirestoreClient.getFirestore();
                Thread.sleep(3000);
                Object[][] accounts = {
                    {"1001","Cash / Vault",                "ASSET",     "DEBIT"},
                    {"1100","Pawn Loans Receivable",       "ASSET",     "DEBIT"},
                    {"2100","Unearned Interest",           "LIABILITY", "CREDIT"},
                    {"4001","Interest Income",             "INCOME",    "CREDIT"},
                    {"4002","Auction Proceeds",            "INCOME",    "CREDIT"},
                    {"5001","Loan Loss / Write-off Expense","EXPENSE",  "DEBIT"},
                };
                for (Object[] acc : accounts) {
                    String code = (String) acc[0];
                    var existing = db.collection("chartOfAccounts").document(code).get().get();
                    if (!existing.exists()) {
                        db.collection("chartOfAccounts").document(code).set(Map.of(
                            "code", acc[0], "name", acc[1],
                            "category", acc[2], "normalBalance", acc[3]
                        )).get();
                        System.out.println("📊 COA seeded: " + acc[0] + " - " + acc[1]);
                    }
                }
            } catch (Exception e) {
                System.err.println("COA seed error: " + e.getMessage());
            }
        }).start();
    }
}
