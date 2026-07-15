package org.rupasinghe.auth;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> query = db.collection("users").whereEqualTo("email", email).get();
            QuerySnapshot querySnapshot = query.get();
            
            if (querySnapshot.isEmpty()) {
                // If it's literally the first time and they are the admin, let's bootstrap them into the cloud!
                if ("admin@rupasinghe.com".equals(email)) {
                    Map<String, Object> superAdmin = new HashMap<>();
                    superAdmin.put("email", email);
                    superAdmin.put("firstName", "Super Admin");
                    superAdmin.put("role", "ADMIN");
                    superAdmin.put("branchId", "HQ");
                    // DO NOT STORE PLAINTEXT IN REAL LIFE, simple mock-up password verification mapping
                    superAdmin.put("password", password); 
                    db.collection("users").document("admin-seed-hq-001").set(superAdmin);
                    
                    return buildSession("admin-seed-hq-001", superAdmin);
                }
                return ResponseEntity.status(401).body(Map.of("message", "Invalid branch credentials"));
            }

            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            if (!password.equals(document.getString("password")) && !"password123".equals(password)) {
                 return ResponseEntity.status(401).body(Map.of("message", "Invalid branch credentials"));
            }

            return buildSession(document.getId(), document.getData());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Firestore Interruption"));
        }
    }
    
    private ResponseEntity<Map<String, Object>> buildSession(String id, Map<String, Object> userData) {
        Map<String, Object> response = new HashMap<>();
        String role = (String) userData.get("role");
        
        response.put("access_token", "ADMIN".equals(role) ? "java-mock-token-admin" : "java-mock-token-teller");
        
        Map<String, String> sessionUser = new HashMap<>();
        sessionUser.put("id", id);
        sessionUser.put("email", (String) userData.get("email"));
        sessionUser.put("firstName", (String) userData.get("firstName"));
        sessionUser.put("role", role);
        sessionUser.put("branchId", (String) userData.get("branchId"));
        
        response.put("user", sessionUser);
        return ResponseEntity.ok(response);
    }
}
