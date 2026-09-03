import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "RUPASINGHE MANAGEMENT HUB - PAWNING SYSTEM SYSTEMATIC SPECIFICATION")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 32, footer_text)
        self.drawString(54, 32, "CONFIDENTIAL - MIFOS X & WEB-APP-DEV PAWNING SYSTEM SPECIFICATION")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 44, 8.5 * 72 - 54, 44)
        
        self.restoreState()

def build_pdf(filename="Java_Mifos_System_Architecture_and_Specification.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Color Palette
    primary_color = colors.HexColor("#1E3A8A")   # Deep Blue
    secondary_color = colors.HexColor("#0D9488") # Teal
    dark_slate = colors.HexColor("#0F172A")      # Dark Slate
    accent_purple = colors.HexColor("#6D28D9")   # Purple

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=secondary_color,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_purple,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_slate,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        bulletIndent=4,
        spaceAfter=3
    )

    story = []

    # Title Banner
    story.append(Paragraph("RUPASINGHE MANAGEMENT HUB (MIFOS PAWNING PLATFORM)", subtitle_style))
    story.append(Paragraph("Enterprise Pawning System Functional Specification & Architecture", title_style))
    story.append(Paragraph("Complete structural specification integrating core pawning workflows, database schema, UI screen audits (Admin & Teller roles), and enterprise features extracted from <b>web-app-dev</b> (Mifos X Platform).", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=6, spaceAfter=10))

    # Section 1: System Overview & Architecture Structure
    story.append(Paragraph("1. System Architecture Framework Structure", h1_style))
    story.append(Paragraph(
        "The Pawning Management System is structured as a multi-tier enterprise platform connecting branch offices, "
        "vaults, cashiers, and administration. The system architecture enforces clean separation of concerns, "
        "role-based security, multi-office branch scoping, and double-entry accounting integrity.",
        body_style
    ))

    arch_structure_data = [
        [Paragraph("<b>Architectural Layer</b>", body_style), Paragraph("<b>Target Technology Choice</b>", body_style), Paragraph("<b>Structural Role & Description</b>", body_style)],
        [Paragraph("Presentation / UI Layer", body_style), Paragraph("Next.js App Router / Angular 20 SPA", body_style), Paragraph("Responsive web interface, webcam KYC capture, dashboard analytics.", body_style)],
        [Paragraph("API Gateway & Security", body_style), Paragraph("Spring Web REST + JWT Security", body_style), Paragraph("Stateless token authentication, Role-Based Access Control (ADMIN, TELLER).", body_style)],
        [Paragraph("Service & Domain Layer", body_style), Paragraph("Java Spring Boot Service Domain", body_style), Paragraph("Business logic, interest calculation engines, workflow approvals, GL triggers.", body_style)],
        [Paragraph("Persistence Layer", body_style), Paragraph("Spring Data JPA (Hibernate ORM)", body_style), Paragraph("Object-relational mapping, transactional boundary management, queries.", body_style)],
        [Paragraph("Database Engine", body_style), Paragraph("PostgreSQL / Apache Fineract Schema", body_style), Paragraph("Relational data store with FK constraints, RLS security, and audit logs.", body_style)]
    ]
    t_arch = Table(arch_structure_data, colWidths=[110, 150, 244])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('TEXTCOLOR', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # Section 2: Features Extracted from web-app-dev (Mifos X Platform)
    story.append(Paragraph("2. Enterprise Features Extracted from web-app-dev (Mifos X)", h1_style))
    story.append(Paragraph(
        "Scanning the <b>web-app-dev</b> (Mifos X Web Application) repository reveals key enterprise financial "
        "and banking modules that enhance and expand the core Java Pawning System. Below are the structural features integrated into our platform design:",
        body_style
    ))

    mifos_features_data = [
        [Paragraph("<b>Mifos Web-App Module</b>", body_style), Paragraph("<b>Extracted Enterprise Capability</b>", body_style), Paragraph("<b>Pawning System Integration Structure</b>", body_style)],
        [
            Paragraph("<b>Collaterals Management</b><br/>(<code>collaterals</code>)", body_style),
            Paragraph("Gold purity tracking (18K, 20K, 22K, 24K), market rate valuation per gram, collateral asset lifecycle, vault allocation.", body_style),
            Paragraph("Automated appraisal calculator for pawn tickets based on live market rate per gram and net gold weight.", body_style)
        ],
        [
            Paragraph("<b>Loan Products & Rules</b><br/>(<code>products / loans</code>)", body_style),
            Paragraph("Configurable interest rates, flat vs declining interest, grace periods, penalty interest on arrears, storage fees.", body_style),
            Paragraph("Multi-product pawn configuration (Short-term 1R, 3M, 6M vs Long-term 12R tickets) with automated interest penalty calculation.", body_style)
        ],
        [
            Paragraph("<b>Organization & Cashiers</b><br/>(<code>organization / users</code>)", body_style),
            Paragraph("Multi-office hierarchy (Head Office, Regional, Branch), Cashier Float Management, Cash In / Cash Out drawer balancing.", body_style),
            Paragraph("Daily cashier drawer opening/closing floats, reconciling physical vault cash against system ledger entries.", body_style)
        ],
        [
            Paragraph("<b>Maker-Checker Workflows</b><br/>(<code>tasks / approvals</code>)", body_style),
            Paragraph("Two-tier authorization model: Teller originates -> Manager approves/disburses loan.", body_style),
            Paragraph("Disbursal Approvals Inbox requiring Admin authorization for high-value pawn disbursements or vault capital transfers.", body_style)
        ],
        [
            Paragraph("<b>Accounting & COA</b><br/>(<code>accounting</code>)", body_style),
            Paragraph("Hierarchical Chart of Accounts (Assets, Liabilities, Equity, Income, Expenses), accrual accounting, financial activity mapping.", body_style),
            Paragraph("Automatic GL double-entry posting on pawn origination, loan disbursal, interest collection, and redemption.", body_style)
        ],
        [
            Paragraph("<b>Account & Vault Transfers</b><br/>(<code>account-transfers</code>)", body_style),
            Paragraph("Inter-branch working capital transfers, vault logistics tracking, approval status.", body_style),
            Paragraph("Branch capital transfer requests with source/destination vault tracking and denomination breakdowns.", body_style)
        ],
        [
            Paragraph("<b>Portfolio Intelligence</b><br/>(<code>reports / analytics</code>)", body_style),
            Paragraph("Portfolio at Risk (PAR 30, 60, 90+ days), aging buckets, audit logs, financial statement exports.", body_style),
            Paragraph("Real-time PAR reporting, overdue loan tracking, gold stock inventory balance, trial balance, and profit & loss statements.", body_style)
        ]
    ]

    t_mifos = Table(mifos_features_data, colWidths=[110, 194, 200])
    t_mifos.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('TEXTCOLOR', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_mifos)
    story.append(Spacer(1, 8))

    # Section 3: UI Screen Audit & Data Mapping Table
    story.append(PageBreak())
    story.append(Paragraph("3. UI Screen Audit, User Roles & Database Persistence Structure", h1_style))
    story.append(Paragraph(
        "Based on an audit of the 22 UI screens in <code>D:\\Mifos\\UIS</code>, the table below maps every interface, "
        "user role permissions (Admin vs Teller), input controls, and target database persistence tables & columns:",
        body_style
    ))

    ui_mapping_data = [
        [Paragraph("<b>UI Screen & Route</b>", body_style), Paragraph("<b>User Roles</b>", body_style), Paragraph("<b>Form Inputs, Modals & UI Controls</b>", body_style), Paragraph("<b>Target DB Table & Columns</b>", body_style)],
        
        # 1. Main Dashboard
        [
            Paragraph("<b>Head Office / Branch Dashboard</b><br/><code>/</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• Branch Open/Close Toggle<br/>• History & New Pawn Buttons<br/>• KPI Cards & Analytics Charts", body_style),
            Paragraph("<code>branch_status</code>: status (OPEN/CLOSED)<br/><code>pawns</code>: disbursed_amount, status<br/><code>clients</code>: count", body_style)
        ],

        # 2. Executive Dashboard
        [
            Paragraph("<b>Executive Dashboard</b><br/><code>/dashboard/executive</code>", body_style),
            Paragraph("<font color='#B91C1C'><b>ADMIN ONLY</b></font>", body_style),
            Paragraph("• Refresh Grid & Export Master Report<br/>• Branch Performance Grid (11 Units)<br/>• Real-Time Activity Stream", body_style),
            Paragraph("<code>branches</code>: id, name<br/><code>branch_status</code>: status<br/><code>pawns</code>: portfolio summary<br/><code>daily_ledgers</code>: opening/closing cash", body_style)
        ],

        # 3. Customer Management
        [
            Paragraph("<b>Our Customers & KYC Register</b><br/><code>/clients</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• <b>Modal:</b> Register New Customer<br/>• Inputs: NIC Number, Name with Initials, Phone, Address<br/>• Webcam Scans: NIC Front, Back, Signature", body_style),
            Paragraph("<code>clients</code>:<br/>- id (UUID PK)<br/>- national_id (NIC)<br/>- first_name, last_name<br/>- phone, address, branch_id<br/>- nic_image, signature_image<br/>- status ('ACTIVE')", body_style)
        ],

        # 4. Active Pawns
        [
            Paragraph("<b>Active Pawns & Originate Pawn</b><br/><code>/loans</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• <b>Modal:</b> Originate New Pawn<br/>• Inputs: Customer ID/NIC, Bill Prefix (1R, 3M, 3R, 6R, 12R, 6M, A), Bill Number, Category (PP, PR, NL, EAR, CH, BRC, BKT), Weight Grams/mg, Tenor Period, Appraised Value, Disbursed Amount", body_style),
            Paragraph("<code>pawns</code>:<br/>- id (UUID PK), bill_no<br/>- client_id (FK), description<br/>- appraised_value, disbursed_amount<br/>- weight_grams, weight_mg<br/>- interest_rate, period_months<br/>- branch_id, status ('PENDING_APPROVAL')", body_style)
        ],

        # 5. Client Accounts
        [
            Paragraph("<b>Client Accounts</b><br/><code>/savings</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• <b>Modal:</b> Originate Account<br/>• Inputs: Account Holder Name, Product Type (Savings/Checking), Initial Cash Deposit", body_style),
            Paragraph("<code>account</code>:<br/>- id (PK), name, type<br/>- balance, interest_rate<br/>- status ('Active'), opened_date", body_style)
        ],

        # 6. Daily Transaction Ledger
        [
            Paragraph("<b>Daily Transaction Ledger</b><br/><code>/accounting/ledger?tab=entry</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• Branch & Date Selectors, Staff Selector<br/>• Daily Transactions Grid: Loan No, Cash Loan, Insurance, Wt.G, Wt.MG, Code, Redeem No, Interest, Cash RDM, Type, F/S<br/>• Daily Financial Summary (1A-11)<br/>• Final Balances & Mismatch Warnings<br/>• Itemized Expenses (+ Add Expense Line)", body_style),
            Paragraph("<code>daily_ledgers</code>:<br/>- id, branch_id, date<br/>- opening_capital, opening_cash<br/>- total_cash_in, total_cash_out<br/>- closing_cash, closing_capital<br/><code>daily_ledger_transactions</code>:<br/>- loan_no, cash_loan, insurance, wt_g, wt_mg, code, redeem_no, interest, cash_rdm, type, fs_type, quantity", body_style)
        ],

        # 7. Money Transfers
        [
            Paragraph("<b>Transaction History & Transfers</b><br/><code>/transactions</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• Global View / Local Branch Toggles<br/>• <b>Modal:</b> Branch Capital Transfer<br/>• Inputs: Target Destination Branch, Transfer Capital Amount, Audit Reference Log", body_style),
            Paragraph("<code>transaction</code>:<br/>- id (UUID PK), client_id, type<br/>- branch_id, target_branch_id<br/>- amount, description, timestamp", body_style)
        ],

        # 8. Vault Logistics
        [
            Paragraph("<b>Vault Logistics</b><br/><code>/transactions/transfers</code>", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• <b>Modal:</b> Initiate Vault Transfer<br/>• Inputs: Origin Entity, Destination Entity, Capital Amount, Denomination (LKR), Logistics Instructions", body_style),
            Paragraph("<code>vault_transfer</code>:<br/>- id (PK), date, time<br/>- from_vault, to_vault, amount<br/>- status ('Pending'), initiated_by, notes", body_style)
        ],

        # 9. Disbursal Approvals
        [
            Paragraph("<b>Disbursal Approvals</b><br/><code>/operations/approvals</code>", body_style),
            Paragraph("<font color='#B91C1C'><b>ADMIN ONLY</b></font>", body_style),
            Paragraph("• Refresh Inbox button<br/>• Approve / Disburse Pawn Loans<br/>• Automatic GL Journal Posting Trigger", body_style),
            Paragraph("<code>pawns</code>: status ('APPROVED'), approved_by, approved_at<br/><code>journal_entry</code>: id, date, total_debit, total_credit<br/><code>journal_entry_line</code>: account_name, debit, credit", body_style)
        ],

        # 10. End of Day
        [
            Paragraph("<b>End of Day & Reconciliation</b><br/><code>/operations/eod</code> (Tab 1)", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• Physical Vault Count Denominations (Rs. 5000, 1000, 500, 100, 50, 20)<br/>• Step 2: System Reconciliation<br/>• Step 3: Final System Freeze (Irreversible Closure)", body_style),
            Paragraph("<code>daily_ledgers</code>: closing_cash, status ('CLOSED')<br/><code>branch_status</code>: status ('CLOSED')", body_style)
        ],

        # 11. Pawn Stock Management
        [
            Paragraph("<b>Pawn Stock Inventory</b><br/><code>/operations/eod</code> (Tab 2)", body_style),
            Paragraph("ADMIN<br/>TELLER", body_style),
            Paragraph("• Filters: Active Stock, Withdrawn, Old Data, Branch, Reason, Date<br/>• <b>Modal:</b> Add Physical Vault Stock<br/>• Inputs: Target Branch, Bill Prefix & No, Pawning Date, Appraised Value, Gross Weight (g), Item Category, Quantity, Purity (18 K)", body_style),
            Paragraph("<code>stock_items</code>:<br/>- id (UUID PK), bill_no, price, weight, date<br/>- item_type, status ('Active'), branch_id, withdrawal_date<br/><code>stock_customers</code>: name, phone, address, branch_id", body_style)
        ],

        # 12. Security Audit Logs
        [
            Paragraph("<b>Security Audit Logs</b><br/><code>/operations/audit-logs</code>", body_style),
            Paragraph("<font color='#B91C1C'><b>ADMIN ONLY</b></font>", body_style),
            Paragraph("• Activity Filtering by Branch & Action<br/>• Audit Log Table: Timestamp, User/Email, Branch, Action, Resource Target, JSON Details", body_style),
            Paragraph("<code>audit_logs</code>: timestamp, user_email, branch_id, action, resource_target, details_json", body_style)
        ],

        # 13. Reports
        [
            Paragraph("<b>Management Reporting</b><br/><code>/reports</code>", body_style),
            Paragraph("<font color='#B91C1C'><b>ADMIN ONLY</b></font>", body_style),
            Paragraph("• Recalculate Risk & Master Export<br/>• Portfolio at Risk (PAR %)<br/>• Aging Analysis Buckets (Current, 31-60, 61-90, 90+ days)<br/>• Export Engine (.XLSX / .PDF)", body_style),
            Paragraph("<code>pawns</code> & <code>daily_ledgers</code>: aggregated financial report queries", body_style)
        ],

        # 14. Staff Directory
        [
            Paragraph("<b>Staff Directory</b><br/><code>/employees</code>", body_style),
            Paragraph("<font color='#B91C1C'><b>ADMIN ONLY</b></font>", body_style),
            Paragraph("• <b>Modal:</b> Add User Account<br/>• Inputs: Email, Branch, Role (TELLER, ADMIN), Password<br/>• User Accounts Table", body_style),
            Paragraph("<code>profiles</code>:<br/>- id (UUID PK), email, role ('TELLER'/'ADMIN')<br/>- branch_id, branch_name, first_name, last_name", body_style)
        ]
    ]

    t_ui = Table(ui_mapping_data, colWidths=[110, 65, 175, 154])
    t_ui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('TEXTCOLOR', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ui)

    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # Section 4: Database Schema Structure
    story.append(Paragraph("4. System Database Relational Schema Structure", h1_style))
    story.append(Paragraph("The relational database schema below defines all core entity tables, foreign key constraints, and field types required for the Pawning System:", body_style))

    db_structure_table = [
        [Paragraph("<b>Table Name</b>", body_style), Paragraph("<b>Primary Key & Unique Keys</b>", body_style), Paragraph("<b>Key Columns & Foreign Key Relations</b>", body_style)],
        [Paragraph("<code>branches</code>", body_style), Paragraph("id (VARCHAR PK)", body_style), Paragraph("name, is_active, created_at", body_style)],
        [Paragraph("<code>profiles</code>", body_style), Paragraph("id (UUID PK)", body_style), Paragraph("email, first_name, last_name, role (ADMIN/TELLER), branch_id &rarr; branches(id)", body_style)],
        [Paragraph("<code>clients</code>", body_style), Paragraph("id (UUID PK), national_id (UNIQUE per branch)", body_style), Paragraph("first_name, last_name, phone, address, branch_id &rarr; branches(id), nic_image, signature_image, status", body_style)],
        [Paragraph("<code>pawns</code>", body_style), Paragraph("id (UUID PK), bill_no (UNIQUE)", body_style), Paragraph("client_id &rarr; clients(id), description, appraised_value, disbursed_amount, weight_grams, weight_mg, interest_rate, period_months, branch_id &rarr; branches(id), status, approved_by, redeemed_at, redeem_amount, redeem_interest", body_style)],
        [Paragraph("<code>stock_items</code>", body_style), Paragraph("id (UUID PK)", body_style), Paragraph("bill_no, price, weight, date, item_type (PP, PR, NL, EAR, etc.), status, branch_id &rarr; branches(id), withdrawal_date, withdrawal_reason, withdrawal_notes", body_style)],
        [Paragraph("<code>daily_ledgers</code>", body_style), Paragraph("id (UUID PK)", body_style), Paragraph("branch_id &rarr; branches(id), date, opening_capital, opening_cash, transfer_in_type, transfer_out_type, total_cash_in, total_cash_out, closing_cash, closing_capital, is_flag_ignored", body_style)],
        [Paragraph("<code>daily_ledger_transactions</code>", body_style), Paragraph("id (BIGINT PK)", body_style), Paragraph("daily_ledger_id &rarr; daily_ledgers(id), loan_no, cash_loan, insurance, wt_g, wt_mg, code, redeem_no, interest, cash_rdm, type, fs_type, quantity", body_style)],
        [Paragraph("<code>journal_entry</code>", body_style), Paragraph("id (VARCHAR PK)", body_style), Paragraph("date, description, reference, total_debit, total_credit, created_by, created_at", body_style)],
        [Paragraph("<code>journal_entry_line</code>", body_style), Paragraph("id (BIGINT PK)", body_style), Paragraph("journal_entry_id &rarr; journal_entry(id), account_name, debit, credit", body_style)],
        [Paragraph("<code>vault_transfer</code>", body_style), Paragraph("id (VARCHAR PK)", body_style), Paragraph("date, time, from_vault, to_vault, amount, currency, status, initiated_by, notes, approved_by", body_style)]
    ]

    t_db_struct = Table(db_structure_table, colWidths=[120, 140, 244])
    t_db_struct.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('TEXTCOLOR', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_db_struct)

    story.append(Spacer(1, 10))

    # Section 5: System Package Structure & Project Taxonomy
    story.append(Paragraph("5. System Project Package Taxonomy Structure", h1_style))
    story.append(Paragraph(
        "The project structural layout below defines the modular organization for the Java Pawning System application:",
        body_style
    ))

    package_tax = [
        [Paragraph("<b>Package / Folder Directory</b>", body_style), Paragraph("<b>Architectural Responsibility</b>", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.config</code>", body_style), Paragraph("Security configuration, JWT filter chain, Swagger OpenAPI setup, CORS.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.domain.entity</code>", body_style), Paragraph("JPA entities: Client, Pawn, StockItem, Account, DailyLedger, JournalEntry.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.domain.enums</code>", body_style), Paragraph("Enumerations: PawnStatus, AccountType, UserRole, TransferStatus, ItemCategory.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.repository</code>", body_style), Paragraph("Spring Data JPA repositories for database access and custom SQL queries.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.service</code>", body_style), Paragraph("Business logic services: PawnService, ClientService, AccountingService, VaultService.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.controller</code>", body_style), Paragraph("REST API controllers exposing endpoints for UI frontend consumption.", body_style)],
        [Paragraph("<code>com.rupasinghe.mifos.dto</code>", body_style), Paragraph("Data Transfer Objects for request validation and API responses.", body_style)]
    ]

    t_pkg = Table(package_tax, colWidths=[180, 324])
    t_pkg.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EFF6FF")),
        ('TEXTCOLOR', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_pkg)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully regenerated without code snippets: {filename}")

if __name__ == '__main__':
    build_pdf()
