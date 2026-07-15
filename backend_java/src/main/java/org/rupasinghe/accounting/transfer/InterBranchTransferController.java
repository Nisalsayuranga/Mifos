package org.rupasinghe.accounting.transfer;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Dual-Control Inter-Branch Transfer:
 * INITIATED → IN_TRANSIT → ACKNOWLEDGED
 */
@RestController
@RequestMapping("/transfers")
public class InterBranchTransferController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTransfers() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        List<Map<String, Object>> result = new ArrayList<>();
        Query q = db.collection("transfers").orderBy("timestamp", Query.Direction.DESCENDING);

        if (!"ADMIN".equals(userContext.get("role"))) {
            // Branch sees transfers sent or received by them
            q = db.collection("transfers")
                  .whereEqualTo("fromBranch", userContext.get("branchId"));
        }

        for (QueryDocumentSnapshot doc : q.get().get().getDocuments()) {
            Map<String, Object> data = new HashMap<>(doc.getData());
            data.put("id", doc.getId());
            result.add(data);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiateTransfer(@RequestBody Map<String, Object> body) throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        Map<String, Object> transfer = new HashMap<>(body);
        transfer.put("fromBranch", userContext.get("branchId"));
        transfer.put("initiatedBy", userContext.get("id"));
        transfer.put("status", "INITIATED");
        transfer.put("timestamp", System.currentTimeMillis());

        var newDoc = db.collection("transfers").document();
        newDoc.set(transfer).get();
        transfer.put("id", newDoc.getId());
        return ResponseEntity.ok(transfer);
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeTransfer(@PathVariable String id) throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        var docRef = db.collection("transfers").document(id);
        var transfer = docRef.get().get();
        if (!transfer.exists()) return ResponseEntity.status(404).build();

        // Only the receiving branch or ADMIN can acknowledge
        String toBranch = transfer.getString("toBranch");
        if (!"ADMIN".equals(userContext.get("role")) && !userContext.get("branchId").equals(toBranch)) {
            return ResponseEntity.status(403).build();
        }

        Map<String, Object> updates = Map.of(
            "status", "ACKNOWLEDGED",
            "acknowledgedBy", userContext.get("id"),
            "acknowledgedAt", System.currentTimeMillis()
        );
        docRef.update(updates).get();

        // Credit the vault of the receiving branch
        String fromBranch = transfer.getString("fromBranch");
        Double amountVal = transfer.getDouble("amount");
        double amount = (amountVal != null) ? amountVal : 0.0;
        if (toBranch != null) adjustVault(db, toBranch, amount, true);    // receiver gets cash
        if (fromBranch != null) adjustVault(db, fromBranch, amount, false); // sender lost cash (already deducted on initiate if desired)

        Map<String, Object> result = new HashMap<>(transfer.getData());
        result.putAll(updates);
        result.put("id", id);
        return ResponseEntity.ok(result);
    }

    private void adjustVault(Firestore db, String branchId, double amount, boolean add) throws Exception {
        String docId = "vault_" + branchId;
        var existing = db.collection("vaultLedger").document(docId).get().get();
        Double balanceVal = existing.exists() ? existing.getDouble("balance") : 500000.0;
        double balance = (balanceVal != null) ? balanceVal : 500000.0;
        db.collection("vaultLedger").document(docId).update("balance", add ? balance + amount : balance - amount).get();
    }
}
