package org.rupasinghe.portfolio.client;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.DocumentReference;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/clients")
public class ClientController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getClients() {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        try {
            Firestore db = FirestoreClient.getFirestore();
            Query query = db.collection("clients");
            
            // Apply Branch enforcement logic identical to Fineract Head Office scoping
            if (!"ADMIN".equals(userContext.get("role"))) {
                query = query.whereEqualTo("branchId", userContext.get("branchId"));
            }
            
            List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
            List<Map<String, Object>> clients = new ArrayList<>();
            for (QueryDocumentSnapshot doc : docs) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("id", doc.getId());
                clients.add(data);
            }
            return ResponseEntity.ok(clients);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registerClient(@RequestBody Map<String, Object> body) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        try {
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> docData = new HashMap<>(body);
            docData.put("branchId", userContext.get("branchId"));
            docData.put("status", "ACTIVE");
            docData.put("timestamp", System.currentTimeMillis());
            
            DocumentReference newDoc = db.collection("clients").document();
            newDoc.set(docData).get(); // awaits resolution
            
            docData.put("id", newDoc.getId());
            return ResponseEntity.ok(docData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
