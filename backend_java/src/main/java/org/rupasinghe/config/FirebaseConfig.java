package org.rupasinghe.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.File;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            File file = new File("src/main/resources/firebase-adminsdk.json");
            if (!file.exists()) {
                System.err.println("\n\n=======================================================");
                System.err.println("CRITICAL ERROR: FIREBASE ADMIN SDK KEY MISSING");
                System.err.println("Please drop 'firebase-adminsdk.json' into src/main/resources!");
                System.err.println("=======================================================\n\n");
                return;
            }

            FileInputStream serviceAccount = new FileInputStream(file);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId("finance-d31ff")    // Explicit project ID
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("\n🔥 SUCCESS: Firebase Admin SDK Connected to project: finance-d31ff");
            }
        } catch (Exception e) {
            System.err.println("\n=== Firebase Init Error: " + e.getMessage() + " ===\n");
            e.printStackTrace();
        }
    }
}
