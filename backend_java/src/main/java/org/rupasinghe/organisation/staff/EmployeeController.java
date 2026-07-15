package org.rupasinghe.organisation.staff;

import com.google.cloud.firestore.Firestore;
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
@RequestMapping("/users")
public class EmployeeController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getEmployees() {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null || !"ADMIN".equals(userContext.get("role"))) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            List<QueryDocumentSnapshot> docs = db.collection("users").get().get().getDocuments();
            List<Map<String, Object>> users = new ArrayList<>();
            for (QueryDocumentSnapshot doc : docs) {
                Map<String, Object> data = new HashMap<>(doc.getData());
                data.put("id", doc.getId()); // inject firestore document ID natively into JSON
                users.add(data);
            }
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createEmployee(@RequestBody Map<String, Object> body) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null || !"ADMIN".equals(userContext.get("role"))) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> docData = new HashMap<>(body);
            docData.put("timestamp", System.currentTimeMillis());
            
            DocumentReference newDoc = db.collection("users").document();
            newDoc.set(docData).get(); // awaits resolution
            
            docData.put("id", newDoc.getId());
            return ResponseEntity.ok(docData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable String id) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null || !"ADMIN".equals(userContext.get("role"))) {
            return ResponseEntity.status(403).build();
        }
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection("users").document(id).delete().get();
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        // Users can update their own profile; ADMIN can update anyone
        if (!"ADMIN".equals(userContext.get("role")) && !id.equals(userContext.get("id"))) {
            return ResponseEntity.status(403).build();
        }

        try {
            Firestore db = FirestoreClient.getFirestore();
            // Only allow safe fields to be updated
            Map<String, Object> updates = new HashMap<>();
            if (body.containsKey("firstName")) updates.put("firstName", body.get("firstName"));
            if (body.containsKey("lastName"))  updates.put("lastName",  body.get("lastName"));
            if (body.containsKey("phone"))     updates.put("phone",     body.get("phone"));
            if (body.containsKey("email"))     updates.put("email",     body.get("email"));

            db.collection("users").document(id).update(updates).get();
            Map<String, Object> result = new HashMap<>(updates);
            result.put("id", id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();
        if (!"ADMIN".equals(userContext.get("role")) && !id.equals(userContext.get("id"))) {
            return ResponseEntity.status(403).build();
        }

        try {
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection("users").document(id).get().get();
            if (!doc.exists()) return ResponseEntity.status(404).build();

            String storedPwd = doc.getString("password");
            String currentPwd = body.get("currentPassword");
            if (!currentPwd.equals(storedPwd)) {
                return ResponseEntity.status(400).body(Map.of("message", "Current password is incorrect"));
            }

            db.collection("users").document(id).update("password", body.get("newPassword")).get();
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
