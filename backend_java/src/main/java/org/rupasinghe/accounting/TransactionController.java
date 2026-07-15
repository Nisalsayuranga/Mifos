package org.rupasinghe.accounting;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.DocumentReference;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.accounting.gl.AccountingMappingService;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private AccountingMappingService accountingService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTransactions() {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        try {
            Firestore db = FirestoreClient.getFirestore();
            Query query = db.collection("transactions");
            
            // Fineract RBAC scope
            if (!"ADMIN".equals(userContext.get("role"))) {
                query = query.whereEqualTo("branchId", userContext.get("branchId"));
            }
            
            List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
            List<Map<String, Object>> txs = new ArrayList<>();
            for (QueryDocumentSnapshot doc : docs) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("id", doc.getId());
                txs.add(data);
            }
            return ResponseEntity.ok(txs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTransaction(@RequestBody Map<String, Object> body) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        try {
            String effectiveBranch = "ADMIN".equals(userContext.get("role")) && body.containsKey("branchId") 
                ? (String) body.get("branchId") 
                : userContext.get("branchId");
                
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> docData = new HashMap<>(body);
            docData.put("branchId", effectiveBranch);
            docData.put("userId", userContext.get("id"));
            docData.put("timestamp", System.currentTimeMillis());
            
            DocumentReference newDoc = db.collection("transactions").document();
            newDoc.set(docData).get(); // await
            
            // NEW: Mifos-style Automated Accounting hook
            String type   = (String) docData.get("type");
            double amount = ((Number) docData.get("amount")).doubleValue();
            String clientId = (String) docData.get("clientId");
            accountingService.processTransaction(newDoc.getId(), type, amount, effectiveBranch, clientId);

            docData.put("id", newDoc.getId());
            return ResponseEntity.ok(docData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
