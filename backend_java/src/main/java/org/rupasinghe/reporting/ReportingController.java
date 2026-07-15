package org.rupasinghe.reporting;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.rupasinghe.config.MockAuthFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import java.io.ByteArrayOutputStream;
import java.util.*;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@RestController
@RequestMapping("/reports")
public class ReportingController {

    /** Portfolio summary — all branches (ADMIN) or own branch */
    @GetMapping("/portfolio")
    public ResponseEntity<Map<String, Object>> getPortfolio() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).get().get();

        double totalDisbursed = 0, totalRepaid = 0, totalAuction = 0;
        Map<String, Double> byBranch = new HashMap<>();

        for (QueryDocumentSnapshot doc : query.getDocuments()) {
            Double amtObj = doc.getDouble("amount");
            double amt = (amtObj != null) ? amtObj : 0.0;
            String type = doc.getString("type");
            String branch = doc.getString("branchId");

            if ("PAWN".equals(type)) { totalDisbursed += amt; if (branch != null) byBranch.merge(branch, amt, Double::sum); }
            else if ("REPAYMENT".equals(type) || "REDEMPTION".equals(type)) totalRepaid += amt;
            else if ("AUCTION".equals(type)) totalAuction += amt;
        }

        double outstanding = totalDisbursed - totalRepaid;
        double par = totalDisbursed > 0 ? (outstanding / totalDisbursed) * 100 : 0;

        return ResponseEntity.ok(Map.of(
            "totalDisbursed", totalDisbursed,
            "totalRepaid", totalRepaid,
            "totalAuction", totalAuction,
            "outstandingPortfolio", outstanding,
            "portfolioAtRisk_pct", Math.round(par * 100.0) / 100.0,
            "byBranch", byBranch,
            "scope", "ADMIN".equals(userContext.get("role")) ? "ALL_BRANCHES" : userContext.get("branchId")
        ));
    }

    /** Aging analysis — 30/60/90+ day buckets */
    @GetMapping("/aging")
    public ResponseEntity<Map<String, Object>> getAgingAnalysis() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").whereEqualTo("type", "PAWN").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).whereEqualTo("type", "PAWN").get().get();

        long now = System.currentTimeMillis();
        long day = 86400000L;
        Map<String, Double> buckets = new LinkedHashMap<>();
        buckets.put("current_0_30", 0.0);
        buckets.put("overdue_31_60", 0.0);
        buckets.put("overdue_61_90", 0.0);
        buckets.put("overdue_91_plus", 0.0);

        for (QueryDocumentSnapshot doc : query.getDocuments()) {
            Double amtObj = doc.getDouble("amount");
            double amt = (amtObj != null) ? amtObj : 0.0;
            Long tsObj = doc.getLong("timestamp");
            long ts = (tsObj != null) ? tsObj : now;
            long daysOld = (now - ts) / day;
 
            if (daysOld <= 30)      buckets.merge("current_0_30", amt, Double::sum);
            else if (daysOld <= 60) buckets.merge("overdue_31_60", amt, Double::sum);
            else if (daysOld <= 90) buckets.merge("overdue_61_90", amt, Double::sum);
            else                    buckets.merge("overdue_91_plus", amt, Double::sum);
        }

        return ResponseEntity.ok(Map.of("agingBuckets", buckets, "generatedAt", System.currentTimeMillis()));
    }

    /** Daily transaction summary */
    @GetMapping("/daily-summary")
    public ResponseEntity<Map<String, Object>> getDailySummary() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(401).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).get().get();

        // Group by date (using timestamp → date string)
        Map<String, Map<String, Object>> days = new TreeMap<>(Collections.reverseOrder());
        for (QueryDocumentSnapshot doc : query.getDocuments()) {
            Long ts = doc.getLong("timestamp");
            if (ts == null) continue;
            String dateKey = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date(ts));
            days.computeIfAbsent(dateKey, k -> new HashMap<>(Map.of(
                "date", k, "count", 0L, "totalAmount", 0.0
            )));
            Map<String, Object> dayMap = days.get(dateKey);
            if (dayMap != null) {
                Long count = (Long) dayMap.get("count");
                dayMap.put("count", (count != null ? count : 0L) + 1);
                Double totalAmt = (Double) dayMap.get("totalAmount");
                Double amtObj = doc.getDouble("amount");
                double amt = (amtObj != null) ? amtObj : 0.0;
                dayMap.put("totalAmount", (totalAmt != null ? totalAmt : 0.0) + amt);
            }
        }

    @GetMapping(value = "/export/master", produces = "text/csv")
    public ResponseEntity<byte[]> exportMasterCSV() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).get().get();

        StringBuilder csv = new StringBuilder("TransactionID,Type,Amount,BranchID,Timestamp\n");
        for (QueryDocumentSnapshot doc : query.getDocuments()) {
            csv.append(doc.getId()).append(",")
               .append(doc.getString("type")).append(",")
               .append(doc.getDouble("amount")).append(",")
               .append(doc.getString("branchId")).append(",")
               .append(doc.getLong("timestamp")).append("\n");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=master_export.csv");
        return ResponseEntity.ok().headers(headers).body(csv.toString().getBytes());
    }

    @GetMapping(value = "/export/xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportXLSX() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).get().get();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transactions");
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("ID");
            headerRow.createCell(1).setCellValue("Type");
            headerRow.createCell(2).setCellValue("Amount");
            headerRow.createCell(3).setCellValue("Branch");

            int rowIdx = 1;
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(doc.getId());
                row.createCell(1).setCellValue(doc.getString("type") != null ? doc.getString("type") : "");
                Double amt = doc.getDouble("amount");
                row.createCell(2).setCellValue(amt != null ? amt : 0.0);
                row.createCell(3).setCellValue(doc.getString("branchId") != null ? doc.getString("branchId") : "");
            }

            workbook.write(out);
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=portfolio_export.xlsx");
            return ResponseEntity.ok().headers(headers).body(out.toByteArray());
        }
    }

    @GetMapping(value = "/export/pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> exportPDF() throws Exception {
        Map<String, String> userContext = MockAuthFilter.securityContext.get();
        if (userContext == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Firestore db = FirestoreClient.getFirestore();
        var query = "ADMIN".equals(userContext.get("role"))
            ? db.collection("transactions").get().get()
            : db.collection("transactions").whereEqualTo("branchId", userContext.get("branchId")).get().get();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            document.add(new Paragraph("Rupasinghe Pawning - Portfolio Risk Report"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.addCell(new PdfPCell(new Phrase("Transaction ID")));
            table.addCell(new PdfPCell(new Phrase("Type")));
            table.addCell(new PdfPCell(new Phrase("Amount")));
            table.addCell(new PdfPCell(new Phrase("Branch")));

            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                table.addCell(doc.getId());
                String type = doc.getString("type");
                table.addCell(type != null ? type : "");
                Double amt = doc.getDouble("amount");
                table.addCell(amt != null ? amt.toString() : "0.0");
                String branchId = doc.getString("branchId");
                table.addCell(branchId != null ? branchId : "");
            }

            document.add(table);
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=portfolio_report.pdf");
            return ResponseEntity.ok().headers(headers).body(out.toByteArray());
        }
    }
}
