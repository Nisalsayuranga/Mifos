import sys
import os
from reportlab.lib.pagesizes import A4
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
        self.setFillColor(colors.HexColor("#334155"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 800, "SOFTWARE REQUIREMENTS SPECIFICATION (SRS) - MIFOS CORE SYSTEM")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.75)
            self.line(54, 792, 558, 792)

        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 30, "Confidential & Proprietary - Rupasinghe Trust Investments Ltd.")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 30, page_text)
        self.restoreState()

def build_srs_pdf():
    pdf_filename = r"d:\Mifos\Mifos_Software_Requirements_Specification_SRS.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom color palette
    primary_color = colors.HexColor("#0f172a")   # Slate 900
    secondary_color = colors.HexColor("#2563eb") # Royal Blue
    accent_color = colors.HexColor("#0d9488")    # Teal 600
    text_color = colors.HexColor("#1e293b")      # Slate 800
    bg_light = colors.HexColor("#f8fafc")        # Slate 50

    h1_style = ParagraphStyle(
        'SRS_H1',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SRS_H2',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'SRS_Body',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'SRS_Bullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'SRS_TH',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'SRS_TC',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=text_color
    )

    table_cell_bold = ParagraphStyle(
        'SRS_TCB',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=primary_color
    )

    story = []

    # Document Header Banner
    banner_data = [[
        Paragraph("SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", ParagraphStyle('BannerHeader', fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=colors.white)),
    ], [
        Paragraph("Mifos Pawning & Microfinance Core System — IEEE 830 Standard Architecture Specification", ParagraphStyle('BannerSub', fontName='Helvetica', fontSize=10, leading=13, textColor=colors.HexColor("#93c5fd"))),
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

    # Control Information Table
    control_data = [
        [Paragraph("<b>Document Title:</b> Software Requirements Specification (SRS)", table_cell_style), Paragraph("<b>Target Entity:</b> Rupasinghe Trust Investments Ltd.", table_cell_style)],
        [Paragraph("<b>Project Name:</b> Mifos Core Microfinance Platform", table_cell_style), Paragraph("<b>Document Standard:</b> IEEE 830 / ISO 29148", table_cell_style)],
        [Paragraph("<b>System Version:</b> v3.4.0 (Production Build)", table_cell_style), Paragraph("<b>Security Classification:</b> Confidential", table_cell_style)],
        [Paragraph("<b>Author / Role:</b> Core Systems Architect", table_cell_style), Paragraph("<b>Effective Date:</b> September 2026", table_cell_style)]
    ]
    control_table = Table(control_data, colWidths=[252, 252])
    control_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(control_table)
    story.append(Spacer(1, 15))

    # Section 1: Introduction
    story.append(Paragraph("1. Introduction", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "<b>1.1 Purpose:</b> This Software Requirements Specification (SRS) document defines the comprehensive functional and non-functional requirements for the <b>Mifos Pawning & Microfinance Core System</b>. It serves as the authoritative blueprint for developers, QA engineers, systems auditors, and branch managers at Rupasinghe Trust Investments Ltd.",
        body_style
    ))
    story.append(Paragraph(
        "<b>1.2 Scope:</b> The Mifos Core System manages the complete lifecycle of pawn collateral loans, customer registration & digital KYC serialization, multi-item collateral valuation, automated interest accrual math, double-entry General Ledger (GL) posting, daily vault stock inventory reconciliation, inter-branch cash transfers, and security audit logging across 14 operating branches.",
        body_style
    ))
    story.append(Paragraph(
        "<b>1.3 Definitions & Acronyms:</b>", body_style
    ))
    story.append(Paragraph("• <b>SRS:</b> Software Requirements Specification", bullet_style))
    story.append(Paragraph("• <b>GL:</b> General Ledger (Double-Entry Financial Accounting)", bullet_style))
    story.append(Paragraph("• <b>EOD:</b> End-of-Day reconciliation & vault balancing process", bullet_style))
    story.append(Paragraph("• <b>KYC:</b> Know Your Customer (NIC front/back image & digital signature capture)", bullet_style))
    story.append(Paragraph("• <b>RLS:</b> Row Level Security (PostgreSQL security policy enforcement at database level)", bullet_style))
    story.append(Spacer(1, 10))

    # Section 2: Overall Description
    story.append(Paragraph("2. Overall Description", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph(
        "<b>2.1 Product Perspective:</b> The system is a modern, web-based, cloud-native enterprise application deployed on <b>Vercel Serverless Infrastructure</b> with a <b>Supabase PostgreSQL</b> database backbone. It replaces legacy paper-based pawn logs with real-time digital transaction synchronization.",
        body_style
    ))
    story.append(Paragraph("<b>2.2 User Classes & Access Roles:</b>", h2_style))

    roles_headers = [Paragraph("User Class / Role", table_header_style), Paragraph("Permitted System Responsibilities & Access Scope", table_header_style)]
    roles_rows = [
        [Paragraph("<b>Branch Teller (`TELLER`)</b>", table_cell_bold), Paragraph("Restricted strictly to assigned branch (`branch_id`). Can register customers, originate pawn tickets, perform loan redemptions, execute daily EOD log entries, and print customer bills.", table_cell_style)],
        [Paragraph("<b>Branch Manager</b>", table_cell_bold), Paragraph("Inherits Teller rights + high-value pawn approval authorization, daily vault reconciliation overrides, and branch-level performance reporting.", table_cell_style)],
        [Paragraph("<b>System Administrator (`ADMIN`)</b>", table_cell_bold), Paragraph("Unrestricted global access across all 14 branches (`ALL`). Can create staff accounts, manage branch status, review cross-branch Trial Balance / P&L statements, and audit security logs.", table_cell_style)]
    ]
    roles_table = Table([roles_headers] + roles_rows, colWidths=[140, 364])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 15))

    # Page Break for Functional Requirements
    story.append(PageBreak())

    # Section 3: System Features & Functional Requirements
    story.append(Paragraph("3. System Features & Functional Requirements (FRs)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    fr_headers = [Paragraph("FR ID", table_header_style), Paragraph("Feature Name", table_header_style), Paragraph("Detailed Functional Requirement Specification", table_header_style)]
    fr_rows = [
        [Paragraph("<b>FR-1</b>", table_cell_bold), Paragraph("Pawn Ticket Origination", table_cell_style), Paragraph("System must capture customer ID/NIC, bill prefix (`1R, 3M, 6M, 12R`), bill number, collateral description, gold purity (18K-24K), weight (grams & mg), appraised valuation, and loan disbursement amount.", table_cell_style)],
        [Paragraph("<b>FR-2</b>", table_cell_bold), Paragraph("Multi-Item Collateral Support", table_cell_style), Paragraph("System must support adding multiple collateral items under a single pawn bill (e.g. 1 Chain + 2 Rings) with individual weight/appraisal items, aggregating total weight and value automatically.", table_cell_style)],
        [Paragraph("<b>FR-3</b>", table_cell_bold), Paragraph("Rupasinghe Math Engine (Redemption)", table_cell_style), Paragraph("System must automatically calculate redemption settlement based on principal tiers: <b>Tier A (&lt; Rs. 50k @ 2.50%/mo)</b> and <b>Tier B (&ge; Rs. 50k @ 2.75%/mo)</b>, applying early grace discounts (1-10 days) or monthly tier increments.", table_cell_style)],
        [Paragraph("<b>FR-4</b>", table_cell_bold), Paragraph("Double-Entry GL Accounting", table_cell_style), Paragraph("Upon pawn redemption, system must post balanced double-entry GL journal entries: Debit `Vault Cash (Asset)`, Credit `Pawn Loan Portfolio (Asset)`, Credit `Interest & Fee Income (Revenue)`.", table_cell_style)],
        [Paragraph("<b>FR-5</b>", table_cell_bold), Paragraph("Digital KYC & Customer Serialization", table_cell_style), Paragraph("System must serialize front and back NIC document scans and digital mouse/touch signature captures into Base64 payload strings attached to client records.", table_cell_style)],
        [Paragraph("<b>FR-6</b>", table_cell_bold), Paragraph("End-of-Day (EOD) Stock Reconciliation", table_cell_style), Paragraph("System must maintain vault stock items (`stock_items`), auto-sync new pawns, compress item code strings (e.g. `EAR3, NL2`), track item withdrawals, and calculate daily cash variances.", table_cell_style)],
        [Paragraph("<b>FR-7</b>", table_cell_bold), Paragraph("Security Audit Logging", table_cell_style), Paragraph("System must record all critical financial actions (Pawn Origination, Redemption, Approval, Ledger Edits) into `audit_logs` capturing user ID, email, role, branch, resource, and timestamp.", table_cell_style)],
        [Paragraph("<b>FR-8</b>", table_cell_bold), Paragraph("Financial Statements & Reports", table_cell_style), Paragraph("System must compute real-time General Ledger **Trial Balance** (පිරික්සුම් ශේෂය) and **Profit & Loss Statement** (ආදායම් වියදම් වාර්තාව) with print & export capabilities.", table_cell_style)]
    ]
    fr_table = Table([fr_headers] + fr_rows, colWidths=[50, 130, 324])
    fr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(fr_table)
    story.append(Spacer(1, 15))

    # Section 4: External Interface Requirements
    story.append(Paragraph("4. External Interface Requirements", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    story.append(Paragraph("• <b>User Interface (UI):</b> Built with Next.js App Router, TailwindCSS, and Radix UI primitives. Includes dark/glassmorphic modals, interactive autocomplete dropdowns, and responsive tables.", body_style))
    story.append(Paragraph("• <b>Print & Document Output:</b> Self-contained HTML print windows with automatic `@media print` CSS rules supporting A4, A5, and thermal receipt printers.", body_style))
    story.append(Paragraph("• <b>Database API Interface:</b> Supabase JS Client v2 communicating over HTTPS/WSS with PostgreSQL backend.", body_style))
    story.append(Spacer(1, 10))

    # Section 5: Non-Functional Requirements (NFRs)
    story.append(Paragraph("5. Non-Functional Requirements (NFRs)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    nfr_headers = [Paragraph("NFR Category", table_header_style), Paragraph("Target Requirement Metric & Implementation Mechanism", table_header_style)]
    nfr_rows = [
        [Paragraph("<b>Performance</b>", table_cell_bold), Paragraph("Serverless API response time &lt; 500ms for pawn transactions. Client-side page navigation &lt; 200ms using React 19 hydration.", table_cell_style)],
        [Paragraph("<b>Security & Isolation</b>", table_cell_bold), Paragraph("JWT token authentication, HTTPS/TLS 1.3 encryption, SQL Row Level Security (`RLS`) restricting tellers to assigned branch data.", table_cell_style)],
        [Paragraph("<b>Reliability & ACID</b>", table_cell_bold), Paragraph("99.9% cloud uptime SLA via Vercel & Supabase. PostgreSQL foreign key constraints ensure zero orphan transactions.", table_cell_style)],
        [Paragraph("<b>Maintainability</b>", table_cell_bold), Paragraph("100% strict TypeScript type checking (`npx tsc --noEmit` zero errors), modular App Router layout, clean Git workflow.", table_cell_style)]
    ]
    nfr_table = Table([nfr_headers] + nfr_rows, colWidths=[120, 384])
    nfr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
    ]))
    story.append(nfr_table)
    story.append(Spacer(1, 15))

    # Sign-off Block
    story.append(KeepTogether([
        Paragraph("6. Specification Approval & Sign-Off", h1_style),
        HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=12),
        Table([
            [Paragraph("<b>Prepared By:</b> Core Systems Architect", table_cell_style), Paragraph("<b>Approved By:</b> Managing Director / Operations Head", table_cell_style)],
            [Paragraph("Signature: ______________________", table_cell_style), Paragraph("Signature: ______________________", table_cell_style)],
            [Paragraph("Date: September 3, 2026", table_cell_style), Paragraph("Date: September 3, 2026", table_cell_style)]
        ], colWidths=[252, 252], style=[
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc"))
        ])
    ]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SRS PDF generated successfully at: {pdf_filename}")

if __name__ == '__main__':
    build_srs_pdf()
