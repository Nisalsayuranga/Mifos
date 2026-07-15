package org.rupasinghe.accounting.vault;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/vault")
public class VaultController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllVaults() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        List<Map<String, Object>> result = new ArrayList<>();

        if ("ADMIN".equals(userContext.get("role"))) {
            // HQ sees all branch vaults
            for (QueryDocumentSnapshot doc : db.collection("vaultLedger").get().get().getDocuments()) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("id", doc.getId());
                result.add(data);
            }
        } else {
            // Branch teller sees only their own vault
            var doc = db.collection("vaultLedger").document("vault_" + userContext.get("branchId")).get().get();
            if (doc.exists()) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("id", doc.getId());
                result.add(data);
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{branchId}")
    public ResponseEntity<Map<String, Object>> getVault(@PathVariable String branchId) throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();
        if (!"ADMIN".equals(userContext.get("role")) && !branchId.equals(userContext.get("branchId"))) {
            return ResponseEntity.status(403).build();
        }

        Firestore db = FirestoreClient.getFirestore();
        var doc = db.collection("vaultLedger").document("vault_" + branchId).get().get();
        if (!doc.exists()) {
            // Bootstrap vault at Rs. 500,000 default
            Map<String, Object> vault = Map.of("branchId", branchId, "balance", 500000.0, "lastUpdated", System.currentTimeMillis());
            db.collection("vaultLedger").document("vault_" + branchId).set(vault).get();
            return ResponseEntity.ok(vault);
        }
        return ResponseEntity.ok(doc.getData());
    }

    @PostMapping("/deposit")
    public ResponseEntity<Map<String, Object>> deposit(@RequestBody Map<String, Object> body) throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null || !"ADMIN".equals(userContext.get("role"))) return ResponseEntity.status(403).build();

        String branchId = (String) body.get("branchId");
        Number amountNum = (Number) body.get("amount");
        double amount = (amountNum != null) ? amountNum.doubleValue() : 0.0;
        if (branchId == null || amount <= 0) return ResponseEntity.badRequest().build();

        Firestore db = FirestoreClient.getFirestore();
        String docId = "vault_" + branchId;
        var existingResult = db.collection("vaultLedger").document(docId).get().get();
        double currentBalance = (existingResult.exists() && existingResult.contains("balance")) ? existingResult.getDouble("balance") : 0.0;

        Map<String, Object> vault = new HashMap<>();
        vault.put("branchId", branchId);
        vault.put("balance", currentBalance + amount);
        vault.put("lastUpdated", System.currentTimeMillis());
        db.collection("vaultLedger").document(docId).set(vault).get();

        return ResponseEntity.ok(vault);
    }
}
