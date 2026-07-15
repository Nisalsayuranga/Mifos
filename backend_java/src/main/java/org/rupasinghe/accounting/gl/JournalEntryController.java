package org.rupasinghe.accounting.gl;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/gl")
public class JournalEntryController {

    @GetMapping("/journal")
    public List<Map<String, Object>> getJournalEntries() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return List.of();

        Firestore db = FirestoreClient.getFirestore();
        Query q = db.collection("journalEntries").orderBy("timestamp", Query.Direction.DESCENDING).limit(100);
        if (!"ADMIN".equals(userContext.get("role"))) {
            q = db.collection("journalEntries")
                  .whereEqualTo("branchId", userContext.get("branchId"))
                  .orderBy("timestamp", Query.Direction.DESCENDING).limit(50);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : q.get().get().getDocuments()) {
            Map<String, Object> data = new HashMap<>(doc.getData());
            data.put("id", doc.getId());
            result.add(data);
        }
        return result;
    }

    @GetMapping("/chart-of-accounts")
    public List<Map<String, Object>> getChartOfAccounts() throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : db.collection("chartOfAccounts").get().get().getDocuments()) {
            result.add(new HashMap<>(doc.getData()));
        }
        return result;
    }

    @GetMapping("/balance-sheet")
    public Map<String, Object> getBalanceSheet() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        Firestore db = FirestoreClient.getFirestore();

        // Aggregate debits and credits per account
        Map<String, Double> debits = new HashMap<>();
        Map<String, Double> credits = new HashMap<>();

        Query q = db.collection("journalEntries");
        if (!"ADMIN".equals(userContext.get("role"))) {
            q = q.whereEqualTo("branchId", userContext.get("branchId"));
        }

        for (QueryDocumentSnapshot doc : q.get().get().getDocuments()) {
            Object entriesObj = doc.get("entries");
            if (!(entriesObj instanceof List)) continue;
            List<Map<String, Object>> entries = (List<Map<String, Object>>) entriesObj;
            for (Map<String, Object> entry : entries) {
                String account = (String) entry.get("account");
                Number amountNum = (Number) entry.get("amount");
                double amt = (amountNum != null) ? amountNum.doubleValue() : 0.0;
                String type = (String) entry.get("type");
                if ("DEBIT".equals(type)) debits.merge(account, amt, Double::sum);
                else credits.merge(account, amt, Double::sum);
            }
        }

        return Map.of(
            "debits", debits,
            "credits", credits,
            "scope", "ADMIN".equals(userContext.get("role")) ? "ALL_BRANCHES" : userContext.get("branchId")
        );
    }
}
