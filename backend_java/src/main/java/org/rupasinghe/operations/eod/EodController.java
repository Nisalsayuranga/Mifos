package org.rupasinghe.operations.eod;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * End-of-Day (EOD) Closing — Mifos X style daily branch lockdown.
 * Once closed, transactions for that date/branch are frozen (immutable).
 */
@RestController
@RequestMapping("/eod")
public class EodController {

    @PostMapping("/close")
    public ResponseEntity<Map<String, Object>> closeDay(@RequestBody(required = false) Map<String, Object> body) throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        String branchId = userContext.get("branchId");
        String today = LocalDate.now().toString(); // e.g. "2024-04-06"
        String docId = branchId + "_" + today;

        Firestore db = FirestoreClient.getFirestore();

        // Check if already closed
        var existing = db.collection("eodSnapshots").document(docId).get().get();
        if (existing.exists() && Boolean.TRUE.equals(existing.getBoolean("frozen"))) {
            return ResponseEntity.status(409).body(Map.of("message", "Day already closed for branch " + branchId));
        }

        // Count today's transactions
        var txQuery = db.collection("transactions").whereEqualTo("branchId", branchId).get().get();
        long txCount = txQuery.size();
        double totalDisbursed = 0, totalRepaid = 0;

        for (QueryDocumentSnapshot tx : txQuery.getDocuments()) {
            Double amountObj = tx.getDouble("amount");
            double amount = (amountObj != null) ? amountObj : 0.0;
            String type = tx.getString("type");
            if ("PAWN".equals(type)) totalDisbursed += amount;
            else if ("REPAYMENT".equals(type) || "REDEMPTION".equals(type)) totalRepaid += amount;
        }

        double outstanding = totalDisbursed - totalRepaid;
        double par = (totalDisbursed > 0) ? (outstanding / totalDisbursed) * 100 : 0;
        if (par < 0) par = 0;

        // Read vault balance
        var vaultResult = db.collection("vaultLedger").document("vault_" + branchId).get().get();
        Double vaultBalanceVal = vaultResult.exists() ? vaultResult.getDouble("balance") : 0.0;
        double vaultBalance = (vaultBalanceVal != null) ? vaultBalanceVal : 0.0;

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("branchId", branchId);
        snapshot.put("date", today);
        snapshot.put("closedAt", System.currentTimeMillis());
        snapshot.put("closedByUserId", userContext.get("id"));
        snapshot.put("transactionCount", txCount);
        snapshot.put("totalDisbursed", totalDisbursed);
        snapshot.put("totalRepaid", totalRepaid);
        snapshot.put("vaultBalance", vaultBalance);
        snapshot.put("frozen", true);

        db.collection("eodSnapshots").document(docId).set(snapshot).get();
        System.out.println("🔒 EOD CLOSED: " + branchId + " for " + today);
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDayStatus() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        String today = LocalDate.now().toString();

        if ("ADMIN".equals(userContext.get("role"))) {
            // Return status for all branches
            Map<String, Object> allStatus = new HashMap<>();
            String[] branches = {"BRL","KOT","DMT","WAT","KIR","KDW","DHW","PND","KTW","HMG"};
            for (String b : branches) {
                var doc = db.collection("eodSnapshots").document(b + "_" + today).get().get();
                allStatus.put(b, doc.exists() ? "CLOSED" : "OPEN");
            }
            return ResponseEntity.ok(allStatus);
        }

        String branchId = userContext.get("branchId");
        var doc = db.collection("eodSnapshots").document(branchId + "_" + today).get().get();
        return ResponseEntity.ok(Map.of(
            "branchId", branchId,
            "date", today,
            "status", doc.exists() ? "CLOSED" : "OPEN",
            "snapshot", doc.exists() ? doc.getData() : Map.of()
        ));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        Query q = "ADMIN".equals(userContext.get("role"))
            ? db.collection("eodSnapshots").orderBy("closedAt", Query.Direction.DESCENDING).limit(60)
            : db.collection("eodSnapshots").whereEqualTo("branchId", userContext.get("branchId"))
                .orderBy("closedAt", Query.Direction.DESCENDING).limit(30);

        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : q.get().get().getDocuments()) {
            Map<String, Object> data = new HashMap<>(doc.getData());
            data.put("id", doc.getId());
            result.add(data);
        }
        return ResponseEntity.ok(result);
    }
}
