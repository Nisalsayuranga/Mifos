package org.rupasinghe.config;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Configuration
public class FirestoreSeedConfig {

    // Branch codes, names, emails, roles, unique passwords
    private static final Object[][] BRANCHES = {
        {"HQ",  "Head Office",  "admin@rupasinghe.com",          "ADMIN",  "HeadOffice@2024"},
        {"BRL", "Borella",      "branch.brl@rupasinghe.com",     "TELLER", "Borella123"},
        {"KOT", "Kotikawatta",  "branch.kot@rupasinghe.com",     "TELLER", "Kotikawatta123"},
        {"DMT", "Dematagoda",   "branch.dmt@rupasinghe.com",     "TELLER", "Dematagoda123"},
        {"WAT", "Wattala",      "branch.wat@rupasinghe.com",     "TELLER", "Wattala123"},
        {"KIR", "Kiribathgoda", "branch.kir@rupasinghe.com",     "TELLER", "Kiribathgoda123"},
        {"KDW", "Kadawatha",    "branch.kdw@rupasinghe.com",     "TELLER", "Kadawatha123"},
        {"DHW", "Dehiwala",     "branch.dhw@rupasinghe.com",     "TELLER", "Dehiwala123"},
        {"PND", "Panadura",     "branch.pnd@rupasinghe.com",     "TELLER", "Panadura123"},
        {"KTW", "Kottawa",      "branch.ktw@rupasinghe.com",     "TELLER", "Kottawa123"},
        {"HMG", "Homagama",     "branch.hmg@rupasinghe.com",     "TELLER", "Homagama123"},
    };

    @Autowired
    private org.rupasinghe.accounting.gl.AccountingMappingService accountingService;

    @PostConstruct
    public void seedUsers() {
        // Run in a background thread so it doesn't block startup
        new Thread(() -> {
            try {
                Thread.sleep(2000); // wait for FirebaseApp to be ready
                Firestore db = FirestoreClient.getFirestore();

                // Seed COA first
                accountingService.seedChartOfAccounts();

                for (Object[] branch : BRANCHES) {
                    String branchId   = (String) branch[0];
                    String branchName = (String) branch[1];
                    String email      = (String) branch[2];
                    String role       = (String) branch[3];
                    String password   = (String) branch[4];  // unique per branch

                    Map<String, Object> user = new HashMap<>();
                    user.put("email", email);
                    user.put("password", password);
                    user.put("role", role);
                    user.put("branchId", branchId);
                    user.put("branchName", branchName);
                    user.put("firstName", "ADMIN".equals(role) ? "Super Admin" : branchName + " Teller");
                    user.put("lastName", branchId);
                    user.put("createdAt", System.currentTimeMillis());

                    // Always overwrite to ensure correct password is set
                    db.collection("users").document(branchId + "-seed").set(user).get();
                    System.out.println("🌱 Seeded: " + email + "  →  " + password);
                }

                System.out.println("\n✅ ALL 11 BRANCH ACCOUNTS READY IN FIRESTORE!\n");
            } catch (Exception e) {
                System.err.println("Seed error: " + e.getMessage());
            }
        }).start();
    }
}
