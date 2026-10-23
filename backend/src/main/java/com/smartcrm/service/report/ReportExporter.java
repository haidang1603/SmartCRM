package com.smartcrm.service.report;

import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.enums.DealStage;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
public class ReportExporter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter LOCAL_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getNumberInstance(Locale.GERMANY); // 1.000.000

    public static class RevenueSummaryRow {
        private String stage;
        private long dealCount;
        private BigDecimal totalValue;
        private double ratioPercentage;

        public RevenueSummaryRow(String stage, long dealCount, BigDecimal totalValue, double ratioPercentage) {
            this.stage = stage;
            this.dealCount = dealCount;
            this.totalValue = totalValue;
            this.ratioPercentage = ratioPercentage;
        }

        public String getStage() { return stage; }
        public long getDealCount() { return dealCount; }
        public BigDecimal getTotalValue() { return totalValue; }
        public double getRatioPercentage() { return ratioPercentage; }
    }

    // ==========================================
    // 1. CUSTOMERS EXPORT
    // ==========================================

    public void exportCustomersCsv(List<Customer> customers, OutputStream os) throws IOException {
        // UTF-8 BOM for Microsoft Excel compatibility
        os.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        try (OutputStreamWriter writer = new OutputStreamWriter(os, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                     .setHeader("Mã KH", "Họ và tên", "Email", "Số điện thoại", "Công ty", "Trạng thái", "Phụ trách", "Ngày tạo")
                     .build())) {

            for (Customer c : customers) {
                printer.printRecord(
                        c.getId(),
                        c.getFullName(),
                        c.getEmail(),
                        c.getPhoneNumber() != null ? c.getPhoneNumber() : "",
                        c.getCompanyName() != null ? c.getCompanyName() : "",
                        mapCustomerStatus(c.getStatus()),
                        c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "Chưa phân bổ",
                        c.getCreatedAt() != null ? c.getCreatedAt().toString() : ""
                );
            }
            printer.flush();
        }
    }

    public void exportCustomersExcel(List<Customer> customers, OutputStream os) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            SXSSFSheet sheet = workbook.createSheet("Danh sách khách hàng");
            sheet.trackAllColumnsForAutoSizing();

            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Mã KH", "Họ và tên", "Email", "Số điện thoại", "Công ty", "Trạng thái", "Phụ trách", "Ngày tạo"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Customer c : customers) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(c.getId());
                row.createCell(1).setCellValue(c.getFullName());
                row.createCell(2).setCellValue(c.getEmail());
                row.createCell(3).setCellValue(c.getPhoneNumber() != null ? c.getPhoneNumber() : "");
                row.createCell(4).setCellValue(c.getCompanyName() != null ? c.getCompanyName() : "");
                row.createCell(5).setCellValue(mapCustomerStatus(c.getStatus()));
                row.createCell(6).setCellValue(c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "Chưa phân bổ");
                row.createCell(7).setCellValue(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
            os.flush();
        }
    }

    // ==========================================
    // 2. DEALS EXPORT
    // ==========================================

    public void exportDealsCsv(List<Deal> deals, OutputStream os) throws IOException {
        os.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        try (OutputStreamWriter writer = new OutputStreamWriter(os, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                     .setHeader("Mã Deal", "Tiêu đề cơ hội", "Khách hàng", "Giá trị (VNĐ)", "Giai đoạn", "Xác suất (%)", "Phụ trách", "Dự kiến đóng", "Chốt thực tế", "Ngày tạo")
                     .build())) {

            for (Deal d : deals) {
                printer.printRecord(
                        d.getId(),
                        d.getTitle(),
                        d.getCustomer() != null ? d.getCustomer().getFullName() : "",
                        d.getDealValue() != null ? d.getDealValue().toPlainString() : "0",
                        mapDealStage(d.getStage()),
                        d.getProbability(),
                        d.getAssignedTo() != null ? d.getAssignedTo().getFullName() : "Chưa phân bổ",
                        d.getExpectedCloseDate() != null ? d.getExpectedCloseDate().format(LOCAL_DATE_FORMATTER) : "",
                        d.getActualCloseDate() != null ? d.getActualCloseDate().format(LOCAL_DATE_FORMATTER) : "",
                        d.getCreatedAt() != null ? d.getCreatedAt().toString() : ""
                );
            }
            printer.flush();
        }
    }

    public void exportDealsExcel(List<Deal> deals, OutputStream os) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            SXSSFSheet sheet = workbook.createSheet("Đường ống bán hàng (Deals)");
            sheet.trackAllColumnsForAutoSizing();

            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Mã Deal", "Tiêu đề cơ hội", "Khách hàng", "Giá trị (VNĐ)", "Giai đoạn", "Xác suất (%)", "Phụ trách", "Dự kiến đóng", "Chốt thực tế", "Ngày tạo"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Deal d : deals) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(d.getId());
                row.createCell(1).setCellValue(d.getTitle());
                row.createCell(2).setCellValue(d.getCustomer() != null ? d.getCustomer().getFullName() : "");
                row.createCell(3).setCellValue(d.getDealValue() != null ? d.getDealValue().doubleValue() : 0);
                row.createCell(4).setCellValue(mapDealStage(d.getStage()));
                row.createCell(5).setCellValue(d.getProbability());
                row.createCell(6).setCellValue(d.getAssignedTo() != null ? d.getAssignedTo().getFullName() : "Chưa phân bổ");
                row.createCell(7).setCellValue(d.getExpectedCloseDate() != null ? d.getExpectedCloseDate().format(LOCAL_DATE_FORMATTER) : "");
                row.createCell(8).setCellValue(d.getActualCloseDate() != null ? d.getActualCloseDate().format(LOCAL_DATE_FORMATTER) : "");
                row.createCell(9).setCellValue(d.getCreatedAt() != null ? d.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
            os.flush();
        }
    }

    // ==========================================
    // 3. REVENUE SUMMARY EXPORT
    // ==========================================

    public void exportRevenueSummaryCsv(List<RevenueSummaryRow> rows, OutputStream os) throws IOException {
        os.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        try (OutputStreamWriter writer = new OutputStreamWriter(os, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                     .setHeader("Giai đoạn Pipeline", "Số lượng Deals", "Tổng giá trị (VNĐ)", "Tỷ trọng (%)")
                     .build())) {

            for (RevenueSummaryRow r : rows) {
                printer.printRecord(
                        r.getStage(),
                        r.getDealCount(),
                        r.getTotalValue() != null ? r.getTotalValue().toPlainString() : "0",
                        String.format(Locale.US, "%.1f%%", r.getRatioPercentage())
                );
            }
            printer.flush();
        }
    }

    public void exportRevenueSummaryExcel(List<RevenueSummaryRow> rows, OutputStream os) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            SXSSFSheet sheet = workbook.createSheet("Tổng hợp doanh thu & Pipeline");
            sheet.trackAllColumnsForAutoSizing();

            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Giai đoạn Pipeline", "Số lượng Deals", "Tổng giá trị (VNĐ)", "Tỷ trọng (%)"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (RevenueSummaryRow r : rows) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getStage());
                row.createCell(1).setCellValue(r.getDealCount());
                row.createCell(2).setCellValue(r.getTotalValue() != null ? r.getTotalValue().doubleValue() : 0);
                row.createCell(3).setCellValue(r.getRatioPercentage() / 100.0);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
            os.flush();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private String mapCustomerStatus(CustomerStatus status) {
        if (status == null) return "Không xác định";
        return switch (status) {
            case LEAD -> "Tiềm năng (Lead)";
            case PROSPECT -> "Triển vọng (Prospect)";
            case ACTIVE_CLIENT -> "Khách hàng (Active)";
            case INACTIVE -> "Ngừng chăm sóc";
        };
    }

    private String mapDealStage(DealStage stage) {
        if (stage == null) return "Không xác định";
        return switch (stage) {
            case NEW -> "Mới tạo (New)";
            case CONSULTING -> "Tư vấn & Báo giá";
            case NEGOTIATION -> "Đàm phán hợp đồng";
            case WON -> "Thành công (Won)";
            case LOST -> "Thất bại (Lost)";
        };
    }
}
