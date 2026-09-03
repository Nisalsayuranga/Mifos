import sys
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Draw header (on pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 800, "MIFOS PAWNING & MICROFINANCE SYSTEM ARCHITECTURE & SPECIFICATION")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.75)
            self.line(54, 792, 558, 792)

        # Draw footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 30, "Confidential - Rupasinghe Trust Investments Ltd. (Mifos Core Architecture)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 30, page_text)
        self.restoreState()

def build_architecture_pdf():
    pdf_filename = r"d:\Mifos\Mifos_Full_System_Architecture.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e3a8a")   # Navy Blue
    secondary_color = colors.HexColor("#0284c7") # Ocean Blue
    text_color = colors.HexColor("#0f172a")      # Slate 900
    sub_color = colors.HexColor("#475569")       # Slate 600
    bg_light = colors.HexColor("#f8fafc")        # Slate 50

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=text_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=primary_color
    )

    story = []

    # Title Banner Box
    banner_data = [[
        Paragraph("MIFOS CORE SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION", ParagraphStyle('BannerHeader', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.white)),
    ], [
        Paragraph("Comprehensive Engineering Documentation of Frontend, Backend Serverless APIs, Supabase DB Schema, Multi-Tenant Branch Matrix & Rupasinghe Math Engine", ParagraphStyle('BannerSub', fontName='Helvetica', fontSize=10, leading=13, textColor=colors.HexColor("#93c5fd"))),
    ]]
    banner_table = Table(banner_data, colWidths=[504])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 16),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 4),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 15))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>System Name:</b> Mifos Pawning & Microfinance Core", table_cell_style), Paragraph("<b>Target Organization:</b> Rupasinghe Trust Investments Ltd.", table_cell_style)],
        [Paragraph("<b>Framework:</b> Next.js 15 (App Router), React 19", table_cell_style), Paragraph("<b>Database / Auth:</b> Supabase PostgreSQL + Auth RLS", table_cell_style)],
        [Paragraph("<b>Deployment:</b> Vercel Serverless Infrastructure", table_cell_style), Paragraph("<b>Branch Footprint:</b> 14 Operating Branches Matrix", table_cell_style)],
        [Paragraph("<b>Specification Version:</b> v3.4.0 (Production)", table_cell_style), Paragraph("<b>Document Date:</b> September 2026", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Section 1: Executive Summary & Architectural Overview
    story.append(Paragraph("1. Executive Summary & Architectural Overview", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "The <b>Mifos Core Architecture</b> is an enterprise-grade, cloud-native pawn broking and microfinance management platform custom-engineered for Rupasinghe Trust Investments Ltd. The platform orchestrates multi-branch pawn origination, automated tiered interest accrual, double-entry General Ledger (GL) accounting, vault collateral stock tracking, and real-time security auditing across a 14-branch network.",
        body_style
    ))
    story.append(Paragraph(
        "Built on modern serverless architecture, the system leverages <b>Next.js App Router</b> for rapid, reactive user interfaces, <b>Next.js Serverless API Routes</b> for business logic execution, and <b>Supabase PostgreSQL</b> for ACID-compliant persistence backed by granular <b>Row Level Security (RLS)</b>.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Section 2: Technology Stack & Core Layers
    story.append(Paragraph("2. Technology Stack & Architectural Layers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    tech_headers = [Paragraph("Layer", table_header_style), Paragraph("Technologies Utilized", table_header_style), Paragraph("Architectural Responsibility", table_header_style)]
    tech_rows = [
        [Paragraph("<b>Frontend UI Layer</b>", table_cell_bold), Paragraph("Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Lucide Icons, Sonner", table_cell_style), Paragraph("Reactive user interface, client-side state management, interactive modal editors, auto-print PDF engines.", table_cell_style)],
        [Paragraph("<b>Backend API Layer</b>", table_cell_bold), Paragraph("Next.js Serverless Edge/Node API Routes (TypeScript), Node Crypto", table_cell_style), Paragraph("Business logic execution, request authentication (`auth-server.ts`), server-side mathematical interest engine, multi-tenant branch routing.", table_cell_style)],
        [Paragraph("<b>Database Layer</b>", table_cell_bold), Paragraph("Supabase PostgreSQL DB, Supabase JS Client v2, Realtime WebSockets", table_cell_style), Paragraph("ACID transaction persistence, relational schema management, automatic stock item triggers, historical audit records.", table_cell_style)],
        [Paragraph("<b>Security & RLS</b>", table_cell_bold), Paragraph("Supabase Auth, JWT Bearer Tokens, Custom SQL RLS Functions (`get_auth_user_branch_id`)", table_cell_style), Paragraph("Role-Based Access Control (RBAC), multi-tenant branch data isolation for Tellers vs global visibility for Admins.", table_cell_style)],
        [Paragraph("<b>Deployment & Infra</b>", table_cell_bold), Paragraph("Vercel Serverless Network, GitHub CI/CD Auto Deployment", table_cell_style), Paragraph("Zero-downtime automated deployment, SSL encryption, serverless auto-scaling.", table_cell_style)]
    ]
    tech_table = Table([tech_headers] + tech_rows, colWidths=[100, 180, 224])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 15))

    # Section 3: Frontend Architecture & Page Component Topology
    story.append(Paragraph("3. Frontend Architecture & Routing Topology", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "The frontend application resides within `frontend/src/app` following the Next.js App Router paradigm. All major pages are client-side hydrated (`'use client'`) to provide instantaneous UI response times during busy branch teller operations.",
        body_style
    ))

    page_headers = [Paragraph("Route Path", table_header_style), Paragraph("Component Name", table_header_style), Paragraph("Core Features & Functional Highlights", table_header_style)]
    page_rows = [
        [Paragraph("`/`", table_cell_bold), Paragraph("Home Dashboard", table_cell_style), Paragraph("Branch metrics overview, total customer count, active pawn portfolio sum, branch OPEN/CLOSED status toggle.", table_cell_style)],
        [Paragraph("`/loans`", table_cell_bold), Paragraph("PawnsPage", table_cell_style), Paragraph("Pawn ticket origination, multi-item collateral editor, gold valuation calculator (24K, 22K, 20K, 18K), redemption modal, auto-print PDF agreement generator.", table_cell_style)],
        [Paragraph("`/clients`", table_cell_bold), Paragraph("ClientsPage", table_cell_style), Paragraph("Customer directory, NIC number autocomplete lookup, front & back NIC image scan serializer, digital signature capture.", table_cell_style)],
        [Paragraph("`/operations/eod`", table_cell_bold), Paragraph("EodOperationsPage", table_cell_style), Paragraph("End-of-day stock reconciliation, vault collateral item management, withdrawal tracking, multi-item code compression (e.g. EAR3, NL2).", table_cell_style)],
        [Paragraph("`/accounting/ledger`", table_cell_bold), Paragraph("LedgerPage", table_cell_style), Paragraph("Multi-branch daily ledger journal, paper log entry audit, 14-branch completion matrix, variance detection.", table_cell_style)],
        [Paragraph("`/accounting/reports`", table_cell_bold), Paragraph("FinancialReportsPage", table_cell_style), Paragraph("Automated Trial Balance (පිරික්සුම් ශේෂය), Profit & Loss Statement (ආදායම් වියදම් වාර්තාව), net profit calculation, one-click print engine.", table_cell_style)],
        [Paragraph("`/operations/audit-logs`", table_cell_bold), Paragraph("AuditLogsPage", table_cell_style), Paragraph("Real-time security activity trail, user login history, ticket origination logs, redemption audit details.", table_cell_style)],
        [Paragraph("`/transactions`", table_cell_bold), Paragraph("TransactionsPage", table_cell_style), Paragraph("Inter-branch cash & vault transfer history, teller local vs global transfer tracking.", table_cell_style)],
        [Paragraph("`/login`", table_cell_bold), Paragraph("LoginPage", table_cell_style), Paragraph("Secure branch credentials authentication, JWT token storage, local session initialization.", table_cell_style)]
    ]
    page_table = Table([page_headers] + page_rows, colWidths=[110, 120, 274])
    page_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(page_table)
    story.append(Spacer(1, 15))

    # Page Break for Backend Architecture
    story.append(PageBreak())

    # Section 4: Backend Architecture & Serverless API Routes
    story.append(Paragraph("4. Backend Architecture & Serverless API Infrastructure", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "The backend API architecture operates serverlessly inside Next.js API Routes (`frontend/src/app/api`). Request validation and authentication are securely routed through `auth-server.ts` using Supabase Service Role keys to bypass client RLS limitations safely while strictly validating user authorization.",
        body_style
    ))

    story.append(Paragraph("Key Serverless API Endpoints Specification:", h2_style))

    api_headers = [Paragraph("API Endpoint", table_header_style), Paragraph("HTTP Methods", table_header_style), Paragraph("Backend Business Logic & Security Enforcements", table_header_style)]
    api_rows = [
        [Paragraph("`/api/pawns`", table_cell_bold), Paragraph("GET, POST", table_cell_style), Paragraph("<b>GET:</b> Fetches pawns filtered by branch for Tellers or global for Admins.<br/><b>POST:</b> Creates new pawn ticket, inserts child `pawn_items`, auto-syncs into `stock_items` for vault, records audit log.", table_cell_style)],
        [Paragraph("`/api/pawns/[id]/redeem`", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("Executes Rupasinghe Math Engine for accrued interest, updates pawn status to REDEEMED, posts balanced double-entry GL journal entry, logs audit event.", table_cell_style)],
        [Paragraph("`/api/pawns/[id]/approve`", table_cell_bold), Paragraph("POST", table_cell_style), Paragraph("Branch manager approval endpoint for high-value pawn disbursements.", table_cell_style)],
        [Paragraph("`/api/clients`", table_cell_bold), Paragraph("GET, POST", table_cell_style), Paragraph("Enforces strict teller branch assignment during customer registration and directory lookups.", table_cell_style)],
        [Paragraph("`/api/ledger/daily`", table_cell_bold), Paragraph("GET, POST", table_cell_style), Paragraph("Handles daily cash & capital ledger entries, detects variance mismatches, updates branch audit status.", table_cell_style)],
        [Paragraph("`/api/reports/financials`", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("Aggregates General Ledger entries for Trial Balance and Profit & Loss computation.", table_cell_style)],
        [Paragraph("`/api/audit-logs`", table_cell_bold), Paragraph("GET", table_cell_style), Paragraph("Fetches real-time user activity logs filtered by branch and action type.", table_cell_style)],
        [Paragraph("`/api/transfers`", table_cell_bold), Paragraph("GET, POST", table_cell_style), Paragraph("Processes inter-vault cash transfers between operating branches.", table_cell_style)]
    ]
    api_table = Table([api_headers] + api_rows, colWidths=[130, 74, 300])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(api_table)
    story.append(Spacer(1, 15))

    # Section 5: Database Schema & Multi-Tenant Branch Matrix
    story.append(Paragraph("5. Database Schema & Multi-Tenant Branch Isolation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "The database schema is deployed on Supabase PostgreSQL. Multi-tenancy is enforced both at the application layer and through SQL Row Level Security (RLS) policies. The system manages a 14-Branch Matrix across Sri Lanka:",
        body_style
    ))

    # Branch Grid Table
    branch_data = [
        [Paragraph("<b>Branch Code</b>", table_cell_bold), Paragraph("<b>Branch Name</b>", table_cell_bold), Paragraph("<b>Branch Code</b>", table_cell_bold), Paragraph("<b>Branch Name</b>", table_cell_bold)],
        [Paragraph("`HQ` / `DHW`", table_cell_style), Paragraph("Head Office / Dehiwala", table_cell_style), Paragraph("`BRL`", table_cell_style), Paragraph("Borella Branch", table_cell_style)],
        [Paragraph("`KOT`", table_cell_style), Paragraph("Kotikawatta Branch", table_cell_style), Paragraph("`DMT`", table_cell_style), Paragraph("Dematagoda Branch", table_cell_style)],
        [Paragraph("`W2`", table_cell_style), Paragraph("Wattala Branch No. 2", table_cell_style), Paragraph("`W3`", table_cell_style), Paragraph("Wattala Branch No. 3", table_cell_style)],
        [Paragraph("`W4`", table_cell_style), Paragraph("Wattala Branch No. 4", table_cell_style), Paragraph("`KIR`", table_cell_style), Paragraph("Kiribathgoda Branch", table_cell_style)],
        [Paragraph("`KDW`", table_cell_style), Paragraph("Kadawatha Branch", table_cell_style), Paragraph("`PND`", table_cell_style), Paragraph("Panadura Branch", table_cell_style)],
        [Paragraph("`KTW`", table_cell_style), Paragraph("Kottawa Branch", table_cell_style), Paragraph("`HMG`", table_cell_style), Paragraph("Homagama Branch", table_cell_style)],
        [Paragraph("`KHT`", table_cell_style), Paragraph("Kahathuduwa Branch", table_cell_style), Paragraph("`ALL`", table_cell_style), Paragraph("Admin Consolidated View", table_cell_style)]
    ]
    branch_table = Table(branch_data, colWidths=[90, 162, 90, 162])
    branch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(branch_table)
    story.append(Spacer(1, 15))

    # Core Database Tables Summary Table
    story.append(Paragraph("Core Database Schema Tables:", h2_style))
    db_headers = [Paragraph("Table Name", table_header_style), Paragraph("Primary Key", table_header_style), Paragraph("Key Foreign Keys & Fields", table_header_style), Paragraph("Description", table_header_style)]
    db_rows = [
        [Paragraph("`pawns`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`client_id`, `branch_id`, `disbursed_amount`, `appraised_value`, `status`", table_cell_style), Paragraph("Pawn loan contracts & disbursement state.", table_cell_style)],
        [Paragraph("`pawn_items`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`pawn_id`, `item_type`, `weight_grams`, `weight_mg`, `appraised_value`", table_cell_style), Paragraph("Itemized multi-collateral breakdown.", table_cell_style)],
        [Paragraph("`clients`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`nationalId`, `firstName`, `branchId`, `nic_image`, `signature_image`", table_cell_style), Paragraph("Registered customer directory & KYC scans.", table_cell_style)],
        [Paragraph("`stock_items`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`bill_no`, `weight`, `price`, `item_type`, `branch_id`, `status`", table_cell_style), Paragraph("Vault stock collateral inventory management.", table_cell_style)],
        [Paragraph("`daily_ledgers`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`branch_id`, `ledger_date`, `opening_balance`, `closing_balance`, `variance`", table_cell_style), Paragraph("Daily cash & capital log audits.", table_cell_style)],
        [Paragraph("`journal_entry`", table_cell_bold), Paragraph("`id` (Text)", table_cell_style), Paragraph("`date`, `total_debit`, `total_credit`, `reference`, `created_by`", table_cell_style), Paragraph("General Ledger master journal entries.", table_cell_style)],
        [Paragraph("`journal_entry_line`", table_cell_bold), Paragraph("`id` (BigInt)", table_cell_style), Paragraph("`journal_entry_id`, `account_name`, `debit`, `credit`", table_cell_style), Paragraph("Double-entry debit & credit line items.", table_cell_style)],
        [Paragraph("`audit_logs`", table_cell_bold), Paragraph("`id` (UUID)", table_cell_style), Paragraph("`user_id`, `user_email`, `branch_id`, `action`, `resource`, `details`", table_cell_style), Paragraph("Security activity audit trail.", table_cell_style)]
    ]
    db_table = Table([db_headers] + db_rows, colWidths=[100, 70, 180, 154])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(db_table)
    story.append(Spacer(1, 15))

    # Page Break for Business Engines
    story.append(PageBreak())

    # Section 6: Rupasinghe Math Engine & Financial Accounting Logic
    story.append(Paragraph("6. Business Logic Engines & Mathematical Algorithms", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    story.append(Paragraph("A. Rupasinghe Tiered Interest Accrual Math Engine", h2_style))
    story.append(Paragraph(
        "The pawn redemption interest calculation follows the proprietary <b>Rupasinghe Interest Structure</b>, evaluated dynamically based on principal loan tiers, days elapsed, and grace discounts:",
        body_style
    ))

    rule_headers = [Paragraph("Loan Principal Tier", table_header_style), Paragraph("Monthly Rate ($r_{int}$)", table_header_style), Paragraph("Early Discount ($r_{disc}$)", table_header_style), Paragraph("Days Elapsed Period", table_header_style), Paragraph("Accrual Formula", table_header_style)]
    rule_rows = [
        [Paragraph("<b>Tier A (&lt; Rs. 50,000)</b>", table_cell_bold), Paragraph("2.50% / month", table_cell_style), Paragraph("1.00% discount", table_cell_style), Paragraph("Day 1 – 10 (Early)", table_cell_style), Paragraph("`Settlement = (P + I_1) - Discount`", table_cell_style)],
        [Paragraph("<b>Tier B (&ge; Rs. 50,000)</b>", table_cell_bold), Paragraph("2.75% / month", table_cell_style), Paragraph("0.50% discount", table_cell_style), Paragraph("Day 11 – 30 (Grace)", table_cell_style), Paragraph("`Settlement = P + I_1`", table_cell_style)],
        [Paragraph("<b>Month 2 (Early)</b>", table_cell_style), Paragraph("Tier Rate", table_cell_style), Paragraph("N/A", table_cell_style), Paragraph("Day 31 – 38", table_cell_style), Paragraph("`Settlement = P + (T x r_int x 0.25) + I_final`", table_cell_style)],
        [Paragraph("<b>Month 2 (Mid)</b>", table_cell_style), Paragraph("Tier Rate", table_cell_style), Paragraph("N/A", table_cell_style), Paragraph("Day 39 – 45", table_cell_style), Paragraph("`Settlement = P + (T x r_int x 0.50) + I_final`", table_cell_style)],
        [Paragraph("<b>Month 2 (Full)</b>", table_cell_style), Paragraph("Tier Rate", table_cell_style), Paragraph("N/A", table_cell_style), Paragraph("Day 46 – 60", table_cell_style), Paragraph("`Settlement = P + (T x r_int x 1.00) + I_final`", table_cell_style)],
        [Paragraph("<b>Month 3+ (Overdue)</b>", table_cell_style), Paragraph("Tier Rate", table_cell_style), Paragraph("N/A", table_cell_style), Paragraph("Day 61+ ($m$ months)", table_cell_style), Paragraph("`Settlement = P + (T x r_int x (m - 1)) + I_final`", table_cell_style)]
    ]
    rule_table = Table([rule_headers] + rule_rows, colWidths=[110, 80, 80, 84, 150])
    rule_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(rule_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("B. Double-Entry General Ledger (GL) Posting Engine", h2_style))
    story.append(Paragraph(
        "Upon every redemption execution (`POST /api/pawns/[id]/redeem`), the system automatically constructs and posts balanced double-entry accounting transactions:",
        body_style
    ))
    story.append(Paragraph("<b>1. Debit Line:</b> `Vault Cash (Asset)` = Total Settlement Amount Paid", bullet_style))
    story.append(Paragraph("<b>2. Credit Line:</b> `Pawn Loan Portfolio (Asset)` = Principal Disbursed Amount", bullet_style))
    story.append(Paragraph("<b>3. Credit Line:</b> `Interest & Fee Income (Revenue)` = Accrued Interest & Charges", bullet_style))
    story.append(Spacer(1, 10))

    # Section 7: Security & Verification
    story.append(Paragraph("7. Security Architecture & Quality Verification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph("• <b>JWT & Cookie Authentication:</b> Server-side authorization headers and HTTP-only cookies prevent session hijacking.", bullet_style))
    story.append(Paragraph("• <b>Strict Branch Data Isolation:</b> Tellers are restricted at the database policy level (`RLS`) to their assigned branch.", bullet_style))
    story.append(Paragraph("• <b>Audit Trail Logging:</b> Critical financial events log user identity, branch, IP, and timestamp into `audit_logs`.", bullet_style))
    story.append(Paragraph("• <b>Zero Build Errors:</b> TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors across all routes.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {pdf_filename}")

if __name__ == '__main__':
    build_architecture_pdf()
