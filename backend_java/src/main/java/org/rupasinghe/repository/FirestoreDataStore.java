package org.rupasinghe.repository;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Temporary In-Memory Singleton representing Google Cloud Firestore Collections.
 */
@Repository
public class FirestoreDataStore {
    
    public final List<Map<String, Object>> transactionsCollection = new ArrayList<>();
    public final List<Map<String, Object>> clientsCollection = new ArrayList<>();
    public final List<Map<String, Object>> usersCollection = new ArrayList<>();

    public FirestoreDataStore() {
        // Seed default branches
        usersCollection.add(Map.of("id", "HQ-001", "email", "admin@rupasinghe.com", "role", "ADMIN", "branchId", "HQ", "firstName", "Super Admin", "lastName", "HQ"));
        usersCollection.add(Map.of("id", "BRL-002", "email", "branch.brl@rupasinghe.com", "role", "TELLER", "branchId", "BRL", "firstName", "Alice", "lastName", "Borella"));
    }

    public Map<String, Object> saveDocument(List<Map<String, Object>> collection, Map<String, Object> newDoc) {
        String id = UUID.randomUUID().toString();
        // Since Map.of is immutable, we use a custom map or we expect newDoc to be mutable
        Map<String, Object> doc = new java.util.HashMap<>(newDoc);
        doc.put("id", id);
        doc.put("createdAt", System.currentTimeMillis());
        doc.put("timestamp", System.currentTimeMillis());
        collection.add(0, doc); // prepend
        return doc;
    }

    public List<Map<String, Object>> getTransactionsByBranch(String branchId, String role) {
        if ("ADMIN".equals(role)) return transactionsCollection;
        return transactionsCollection.stream().filter(tx -> branchId.equals(tx.get("branchId"))).toList();
    }
    
    public List<Map<String, Object>> getClientsByBranch(String branchId, String role) {
        if ("ADMIN".equals(role)) return clientsCollection;
        return clientsCollection.stream().filter(c -> branchId.equals(c.get("branchId"))).toList();
    }
}
