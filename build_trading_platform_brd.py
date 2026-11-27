from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_BREAK
from datetime import date

OUT = "/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/MAKH_Trading_Platform_BRD_PRD.docx"

NAVY = "17365D"
BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
LIGHT_BLUE = "E8EEF5"
LIGHT_GRAY = "F2F4F7"
MID_GRAY = "657383"
WHITE = "FFFFFF"
RED = "9B1C1C"
GOLD = "7A5A00"
GREEN = "2E6B4F"
BLACK = "1F1F1F"

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = Inches(1)
sec.bottom_margin = Inches(0.85)
sec.left_margin = Inches(1)
sec.right_margin = Inches(1)
sec.header_distance = Inches(0.492)
sec.footer_distance = Inches(0.492)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Calibri"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
normal.font.size = Pt(11)
normal.font.color.rgb = RGBColor.from_string(BLACK)
normal.paragraph_format.space_before = Pt(0)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.10

for style_name, size, color, before, after in [
    ("Title", 25, NAVY, 0, 7),
    ("Subtitle", 13, MID_GRAY, 0, 16),
    ("Heading 1", 16, BLUE, 16, 8),
    ("Heading 2", 13, BLUE, 12, 6),
    ("Heading 3", 12, DARK_BLUE, 8, 4),
]:
    st = styles[style_name]
    st.font.name = "Calibri"
    st._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    st.font.size = Pt(size)
    st.font.bold = style_name != "Subtitle"
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

for list_name in ["List Bullet", "List Number"]:
    st = styles[list_name]
    st.font.name = "Calibri"
    st.font.size = Pt(11)
    st.paragraph_format.left_indent = Inches(0.5)
    st.paragraph_format.first_line_indent = Inches(-0.25)
    st.paragraph_format.space_after = Pt(8)
    st.paragraph_format.line_spacing = 1.167

if "Callout" not in [s.name for s in styles]:
    callout_style = styles.add_style("Callout", WD_STYLE_TYPE.PARAGRAPH)
else:
    callout_style = styles["Callout"]
callout_style.font.name = "Calibri"
callout_style.font.size = Pt(11)
callout_style.font.bold = True
callout_style.font.color.rgb = RGBColor.from_string(NAVY)
callout_style.paragraph_format.space_before = Pt(6)
callout_style.paragraph_format.space_after = Pt(8)
callout_style.paragraph_format.left_indent = Inches(0.15)
callout_style.paragraph_format.right_indent = Inches(0.15)

def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)

def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tcMar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)

def set_table_geometry(table, widths):
    total = sum(widths)
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tblPr = table._tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.append(tblW)
    tblW.set(qn("w:w"), str(total))
    tblW.set(qn("w:type"), "dxa")
    tblInd = tblPr.find(qn("w:tblInd"))
    if tblInd is None:
        tblInd = OxmlElement("w:tblInd")
        tblPr.append(tblInd)
    tblInd.set(qn("w:w"), "120")
    tblInd.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            width = widths[idx]
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn("w:tcW"))
            if tcW is None:
                tcW = OxmlElement("w:tcW")
                tcPr.append(tcW)
            tcW.set(qn("w:w"), str(width))
            tcW.set(qn("w:type"), "dxa")
            cell.width = Inches(width / 1440)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def add_table(headers, rows, widths, font_size=9.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, text in enumerate(headers):
        hdr.cells[i].text = text
        shade_cell(hdr.cells[i], NAVY)
        p = hdr.cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor.from_string(WHITE)
            run.font.size = Pt(font_size)
    for ridx, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value)
            if ridx % 2 == 1:
                shade_cell(cells[i], LIGHT_GRAY)
            for p in cells[i].paragraphs:
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.05
                for run in p.runs:
                    run.font.size = Pt(font_size)
    set_table_geometry(table, widths)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table

def add_bullets(items, level=0):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Inches(0.5 + level * 0.25)
        p.paragraph_format.first_line_indent = Inches(-0.25)
        if isinstance(item, tuple):
            label, text = item
            r = p.add_run(label)
            r.bold = True
            p.add_run(text)
        else:
            p.add_run(item)

def add_numbered(items):
    for item in items:
        doc.add_paragraph(item, style="List Number")

def add_callout(label, text, color=LIGHT_BLUE):
    p = doc.add_paragraph(style="Callout")
    p.paragraph_format.keep_together = True
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), color)
    pPr.append(shd)
    r = p.add_run(label + "  ")
    r.bold = True
    p.add_run(text)
    return p

def add_page_break():
    doc.add_page_break()

def add_field(paragraph, instruction):
    run = paragraph.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.set(qn("xml:space"), "preserve")
    instrText.text = instruction
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run._r.extend([fldChar1, instrText, fldChar2])

# Running header/footer
header = sec.header
hp = header.paragraphs[0]
hp.text = "MAKH TRADING | PLATFORM REQUIREMENTS"
hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
for r in hp.runs:
    r.font.size = Pt(8.5); r.font.bold = True; r.font.color.rgb = RGBColor.from_string(MID_GRAY)
footer = sec.footer
fp = footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = fp.add_run("CONFIDENTIAL • Draft v1.0    |    Page ")
r.font.size = Pt(8); r.font.color.rgb = RGBColor.from_string(MID_GRAY)
add_field(fp, "PAGE")

# Cover
doc.add_paragraph().paragraph_format.space_after = Pt(38)
k = doc.add_paragraph()
k.alignment = WD_ALIGN_PARAGRAPH.CENTER
kr = k.add_run("BUSINESS & PRODUCT REQUIREMENTS")
kr.bold = True; kr.font.size = Pt(10); kr.font.color.rgb = RGBColor.from_string(BLUE)
p = doc.add_paragraph(style="Title")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("MAKH Trading Platform")
p = doc.add_paragraph(style="Subtitle")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Low-Float Momentum Stock Discovery, Risk-Controlled Execution and Portfolio Monitoring")

doc.add_paragraph().paragraph_format.space_after = Pt(22)
meta = add_table(
    ["Document", "Value"],
    [
        ("Document type", "Combined Business Requirements Document (BRD) and Product Requirements Document (PRD)"),
        ("Version / status", "v1.0 / Working draft for stakeholder review"),
        ("Prepared for", "MAKH Trading"),
        ("Prepared by", "Trading Strategy and Senior Business Analysis"),
        ("Date", "11 August 2026"),
        ("Primary market assumption", "U.S.-listed equities; broker eligibility and local legal/tax obligations to be confirmed"),
    ],
    [1900, 7460], 10
)
add_callout("Purpose", "Define a safe, auditable platform that discovers selected momentum stocks, validates catalysts, supports user-authorized trading, and enforces risk limits before and after order submission.")
add_callout("Important", "This document defines a software product and risk framework. It is not a promise of investment performance or personalized financial advice.", "FFF2CC")

add_page_break()
doc.add_heading("Document control and contents", level=1)
add_table(["Version", "Date", "Owner", "Change"], [("1.0", "11 Aug 2026", "MAKH Trading", "Initial BRD/PRD baseline")], [1100, 1700, 2200, 4360], 9.5)
doc.add_heading("Contents", level=2)
contents = [
    "1. Executive summary", "2. Business objectives and success measures", "3. Scope and operating assumptions",
    "4. Stakeholders and user roles", "5. Trading strategy specification", "6. Functional requirements",
    "7. End-to-end workflows", "8. Risk-management engine", "9. Data, news and API integrations",
    "10. Solution architecture", "11. Non-functional and security requirements", "12. Compliance and governance",
    "13. User experience", "14. Analytics, audit and reporting", "15. Testing and model validation",
    "16. Delivery roadmap", "17. Acceptance criteria", "18. Risks, decisions and open questions", "Appendices"
]
add_bullets(contents)

doc.add_heading("1. Executive summary", level=1)
doc.add_paragraph("MAKH Trading will be a configurable decision-support and trading platform for identifying U.S.-listed, low-priced momentum stocks. It will combine real-time market data, relative-volume screening, public-float data, verified company news, regulatory filings and carefully weighted social signals. The platform will present ranked opportunities and, only after the risk engine approves the trade, transmit orders through a supported regulated broker.")
doc.add_paragraph("The initial strategy concept focuses on securities priced between $3 and $7, relative volume of at least 3x, public float at or below 500,000 shares, and large percentage gains. Because such stocks can be illiquid, manipulated, halted, or difficult to exit, the platform shall treat a 100%-600% gain as a high-risk alert—not a standalone buy instruction.")
add_callout("Product principle", "The screener may recommend attention; only explicit entry logic plus pre-trade risk approval may authorize an order.")
doc.add_heading("Recommended business decision", level=2)
add_bullets([
    "Approve a phased build beginning with data collection, replay, backtesting and paper trading.",
    "Keep all thresholds configurable rather than hard-coded.",
    "Launch live trading only after defined performance, operational and compliance gates are passed.",
    "Restrict the first release to self-directed trading for the account owner; do not manage third-party funds without specialist legal advice and required authorization."
])

doc.add_heading("2. Business objectives and success measures", level=1)
doc.add_heading("2.1 Objectives", level=2)
add_bullets([
    "Reduce the time required to detect relevant low-float momentum candidates.",
    "Consolidate price, liquidity, catalyst and risk evidence into one decision workspace.",
    "Prevent trades that exceed account, position, liquidity or daily-loss limits.",
    "Provide reliable order status, position monitoring and emergency controls.",
    "Create a complete audit trail for every signal, decision, order and system intervention."
])
doc.add_heading("2.2 Proposed success measures", level=2)
add_table(["Area", "Measure", "Initial target / gate"], [
    ("Data", "Freshness of actionable quotes", "Vendor entitlement-dependent; stale data blocks execution"),
    ("Reliability", "Critical service availability during configured market hours", ">=99.9% after production stabilization"),
    ("Risk", "Orders bypassing mandatory risk checks", "Zero"),
    ("Execution", "Order acknowledgement and state reconciliation", "100% traceable; timeout triggers safe state"),
    ("Controls", "Kill-switch activation", "Available to authorized user at all times"),
    ("Validation", "Paper-trading period", "Minimum 8-12 weeks and sufficient trade sample"),
    ("Performance", "Strategy profitability", "Positive expectancy after estimated fees and slippage; no guaranteed target"),
], [1700, 3800, 3860], 8.8)

doc.add_heading("3. Scope and operating assumptions", level=1)
doc.add_heading("3.1 In scope for MVP", level=2)
add_bullets([
    "Watchlists, scanner presets and real-time candidate ranking.",
    "Price, volume, relative volume, public float, spread, liquidity and intraday gain filters.",
    "Verified news and SEC filing ingestion; social-sentiment monitoring with source labels.",
    "Paper trading, manual order ticket and optional rules-based order proposal.",
    "Pre-trade, intraday and post-trade risk controls.",
    "Broker order routing, order/position synchronization and bracket exits where supported.",
    "Dashboards, notifications, journaling, analytics and immutable audit records."
])
doc.add_heading("3.2 Out of scope for MVP", level=2)
add_bullets([
    "Options, futures, cryptocurrency, forex, short selling and leveraged products.",
    "Custody of customer funds or securities.",
    "Trading on behalf of third parties, copy trading or public investment recommendations.",
    "High-frequency or latency-arbitrage strategies.",
    "Unsupervised machine-learning models that can change live trading rules."
])
doc.add_heading("3.3 Key assumptions", level=2)
add_bullets([
    "The first deployment is for one authorized account owner and one or more segregated paper accounts.",
    "The selected broker legally supports the user’s country of residence and target exchanges.",
    "Exchange and vendor licenses permit the intended display, storage and use of real-time data.",
    "Public float means freely tradable shares, not total shares outstanding; vendor definitions must be documented.",
    "All times are stored in UTC and displayed in the user’s selected timezone."
])

add_page_break()
doc.add_heading("4. Stakeholders and user roles", level=1)
add_table(["Role", "Primary responsibility", "Permissions"], [
    ("Trader / account owner", "Configure approved strategy, review candidates, submit or approve orders", "Trading, limits within policy, kill switch"),
    ("Risk administrator", "Set non-bypassable limits and investigate breaches", "Risk configuration, lockout, reports"),
    ("Operations administrator", "Manage integrations, calendars and incidents", "System configuration; no discretionary trading"),
    ("Compliance / legal reviewer", "Review jurisdiction, communications, records and vendor terms", "Read-only evidence and exports"),
    ("Developer / support", "Operate software and resolve defects", "Least privilege; production actions logged"),
    ("Auditor", "Verify decisions, changes, orders and reconciliations", "Read-only, time-limited access"),
], [1750, 4350, 3260], 8.8)
doc.add_heading("4.1 Segregation of duties", level=2)
doc.add_paragraph("Production credentials, risk-policy approval and software deployment rights should be separated where staffing permits. Any emergency override must require strong authentication, a reason code and an audit event.")

doc.add_heading("5. Trading strategy specification", level=1)
doc.add_heading("5.1 Candidate universe", level=2)
add_table(["Rule", "Baseline", "Treatment"], [
    ("Venue", "Nasdaq / NYSE-listed common shares", "Exclude OTC in MVP; configurable approved venues"),
    ("Price", "$3.00-$7.00", "Apply to executable reference price; reject stale or crossed quotes"),
    ("Public float", "<=500,000 shares", "Confirm vendor field, timestamp and corporate-action adjustment"),
    ("Relative volume", ">=3.0x", "Compare cumulative volume with historical volume at the same time of day"),
    ("Intraday gain", "100%-600% watch condition", "Risk flag / ranking input only; never sufficient to buy"),
    ("Catalyst", "Verified current event", "Prefer issuer, exchange, SEC filing or established newswire"),
    ("Liquidity", "Minimum dollar volume and depth", "Threshold set through testing; hard execution gate"),
    ("Spread", "Maximum allowed percentage", "Configurable; default to be calibrated, not assumed"),
], [1750, 2300, 5310], 8.5)
doc.add_heading("5.2 Relative-volume definition", level=2)
doc.add_paragraph("Relative volume (RVOL) shall be calculated using time-of-day normalization to avoid comparing early-session volume with a full-day average:")
add_callout("Formula", "RVOL(t) = cumulative volume today through time t / average cumulative volume through time t across the selected lookback window.")
add_bullets([
    "The default lookback window and treatment of shortened sessions must be configurable.",
    "Corporate actions, symbol changes and anomalous historical days must be handled or flagged.",
    "If required history is incomplete, the system shall mark RVOL as unavailable rather than infer a tradable value."
])
doc.add_heading("5.3 Candidate scoring", level=2)
doc.add_paragraph("A transparent score should rank candidates without hiding mandatory exclusions. Example components include RVOL, verified catalyst quality, spread, dollar volume, order-book depth, price structure, float confidence and halt/dilution risk. Score weights must be versioned and backtested.")
doc.add_heading("5.4 Entry and exit policy", level=2)
add_bullets([
    ("Entry evidence: ", "A candidate passes universe filters, has a verified catalyst, acceptable spread/liquidity, a defined entry trigger and a valid stop level."),
    ("No chase rule: ", "Reject or require fresh confirmation when price exceeds the configured distance from the trigger, VWAP or recent consolidation."),
    ("Exit evidence: ", "Stop-loss, profit target, trailing logic, time-based exit, catalyst invalidation, end-of-session rule or emergency liquidation."),
    ("Position state: ", "Every open position must have an accountable exit plan, even if the broker cannot hold the desired native bracket order.")
])

doc.add_heading("6. Functional requirements", level=1)
requirements = [
    ("FR-001", "Market scanner", "Filter and rank symbols using price, RVOL, float, gain, venue, spread, liquidity and catalyst fields.", "Must"),
    ("FR-002", "Watchlists", "Save named watchlists and strategy presets with version history.", "Must"),
    ("FR-003", "Evidence panel", "Show timestamps, source, bid/ask, last trade, volume, float, news and filings.", "Must"),
    ("FR-004", "News validation", "Label source type, publication time, duplicates, promotional indicators and confidence.", "Must"),
    ("FR-005", "Social signals", "Aggregate permitted public signals; never treat sentiment alone as authorization.", "Should"),
    ("FR-006", "Order ticket", "Support marketable limit/limit orders initially; show estimated position risk and buying power.", "Must"),
    ("FR-007", "Risk approval", "Block any order that violates hard policy before broker submission.", "Must"),
    ("FR-008", "Order lifecycle", "Track pending, accepted, partial, filled, cancelled, rejected and replaced states.", "Must"),
    ("FR-009", "Position monitor", "Calculate realized/unrealized P&L, stop state, exposure and exit status.", "Must"),
    ("FR-010", "Kill switch", "Cancel eligible open orders and prevent new entries; liquidation behavior separately controlled.", "Must"),
    ("FR-011", "Paper mode", "Use separate credentials, accounts and clear visual identification.", "Must"),
    ("FR-012", "Reconciliation", "Compare internal orders, fills, cash and positions with broker records.", "Must"),
    ("FR-013", "Alerts", "Notify on candidates, fills, rejections, risk events, stale data, halts and disconnects.", "Should"),
    ("FR-014", "Journal", "Capture thesis, screenshots/metrics, decisions, fills, outcomes and lessons.", "Should"),
    ("FR-015", "Audit export", "Export versioned evidence for a chosen date, trade or incident.", "Must"),
]
add_table(["ID", "Capability", "Requirement", "Priority"], requirements, [950, 1900, 5600, 910], 8.0)

doc.add_heading("7. End-to-end workflows", level=1)
doc.add_heading("7.1 Candidate-to-trade workflow", level=2)
add_numbered([
    "Ingest market, reference, news and filing data and verify data freshness.",
    "Apply mandatory universe exclusions and configurable scan thresholds.",
    "Calculate RVOL and liquidity metrics; assign a transparent candidate score.",
    "Present the symbol with catalyst provenance, price context and risk warnings.",
    "Trader selects a candidate or an approved rule creates an order proposal.",
    "Risk engine calculates size and tests account, symbol, liquidity, loss and operational limits.",
    "Approved order is submitted to the broker with an idempotency/client-order identifier.",
    "System consumes broker events, reconciles fills and activates the exit plan.",
    "Position is monitored until closed; trade and evidence are written to the journal and audit store."
])
doc.add_heading("7.2 Failure workflow", level=2)
add_bullets([
    "Stale or missing market data: stop new entries and clearly display degraded status.",
    "Broker timeout: query the broker before retrying; never blindly duplicate an order.",
    "Partial fill: recalculate exposure and exit quantities from confirmed fills.",
    "Trading halt: freeze automated assumptions, display halt state and prepare reopening controls.",
    "Position mismatch: block new trading in the affected account until reconciliation or authorized resolution.",
    "Risk-service failure: fail closed for new entries."
])

add_page_break()
doc.add_heading("8. Risk-management engine", level=1)
doc.add_heading("8.1 Risk hierarchy", level=2)
doc.add_paragraph("Hard controls cannot be overridden by a strategy. Soft controls may require confirmation. Informational controls warn without authorizing a trade. The policy version used for each decision must be stored.")
add_table(["Control", "Illustrative baseline", "Required behavior"], [
    ("Risk per trade", "0.25%-0.50% of account equity", "Calculate from stop distance; configurable and capped"),
    ("Daily loss", "1%-2% of start-of-day equity", "Block new entries once reached"),
    ("Consecutive losses", "3", "Pause strategy and require review"),
    ("Open positions", "1-3", "Reject entries above cap"),
    ("Symbol concentration", "Policy-defined", "Include pending orders and filled exposure"),
    ("No averaging down", "Enabled", "Prevent an increased losing position unless policy explicitly permits"),
    ("Spread/slippage", "Calibrated through data", "Reject or cancel when tolerance is exceeded"),
    ("Stale quote", "Vendor/feed-specific", "Fail closed"),
    ("End-of-day", "No overnight holdings for day strategy", "Warn and execute approved closeout workflow"),
], [2250, 2600, 4510], 8.5)
doc.add_heading("8.2 Position sizing", level=2)
add_callout("Core formula", "Shares = floor(maximum dollar risk / absolute(entry price - stop price)).")
doc.add_paragraph("The result must then be reduced by buying power, maximum position value, concentration, available liquidity, lot-size and broker constraints. Fees and estimated slippage should be included in the risk estimate.")
doc.add_heading("8.3 Protective orders and residual risk", level=2)
add_bullets([
    "Use broker-native linked/bracket orders when supported and tested.",
    "A stop order does not guarantee its trigger price; gaps, halts and thin liquidity can produce larger losses.",
    "If protection is held locally, connectivity loss creates additional risk and must trigger alerts and recovery procedures.",
    "The kill switch must distinguish: block new entries, cancel open orders, and liquidate positions. Liquidation is destructive and requires explicit policy."
])
doc.add_heading("8.4 Example risk decision", level=2)
add_table(["Input", "Example"], [
    ("Account equity", "$20,000"), ("Risk fraction", "0.50%"), ("Maximum dollar risk", "$100"),
    ("Planned entry / stop", "$5.00 / $4.75"), ("Raw position size", "400 shares"),
    ("Final position", "Lower of 400 shares and all liquidity/exposure caps")
], [3000, 6360], 9.2)

doc.add_heading("9. Data, news and API integrations", level=1)
add_table(["Integration", "Purpose", "Selection criteria"], [
    ("Market-data / screener API", "Quotes, trades, bars, movers, halts and historical data", "Coverage, latency, timestamps, corrections, websocket reliability, licensing and cost"),
    ("Reference-data API", "Float, shares, exchange, symbol and corporate actions", "Field definitions, update cadence, split accuracy and provenance"),
    ("News / filings", "Catalysts and disclosures", "Issuer/SEC sources, timestamps, entity matching, duplicates and archive rights"),
    ("Social sources", "Attention and sentiment indicators", "Legal access, platform terms, spam/bot detection and source traceability"),
    ("Broker trading API", "Accounts, orders, fills and positions", "Country eligibility, supported securities, order types, rate limits, paper mode, status events and support"),
    ("Notification service", "Operational and trading alerts", "Delivery guarantees, escalation and data privacy"),
], [2100, 3000, 4260], 8.4)
doc.add_heading("9.1 Integration principles", level=2)
add_bullets([
    "The screener and broker are separate capabilities; a market-data vendor should not be assumed to execute trades.",
    "Normalize vendor symbols, timestamps and corporate actions in a canonical security master.",
    "Persist raw event identifiers and source timestamps so calculations can be reproduced.",
    "Use retries with backoff, rate-limit controls, circuit breakers and idempotent order submission.",
    "Keep paper and live credentials, endpoints and databases clearly separated."
])

doc.add_heading("10. Solution architecture", level=1)
doc.add_paragraph("Recommended logical components:")
add_table(["Layer", "Components"], [
    ("Experience", "Web dashboard, mobile-responsive views, order ticket, alerts and admin console"),
    ("Decision", "Scanner, indicator service, catalyst validator, scoring service and strategy rules"),
    ("Control", "Risk engine, policy store, entitlement service, kill switch and approval workflow"),
    ("Execution", "Broker adapter, order-management system, fill processor and reconciliation service"),
    ("Data", "Streaming ingestion, time-series store, relational ledger, cache, evidence/audit archive"),
    ("Operations", "Monitoring, secrets management, incident alerts, deployment controls and backups"),
], [1900, 7460], 9.2)
doc.add_heading("10.1 State and ownership", level=2)
doc.add_paragraph("The broker is the authoritative source for accepted orders, fills and live positions; the platform maintains a reconciled internal view. The risk engine is authoritative for platform permission to submit new orders. Market-data timestamps determine whether decisions are valid.")

doc.add_heading("11. Non-functional and security requirements", level=1)
add_table(["ID", "Requirement"], [
    ("NFR-001", "Fail closed for new entries when critical market data, risk or broker state is unavailable."),
    ("NFR-002", "Encrypt data in transit and at rest; store broker secrets in an approved secrets manager."),
    ("NFR-003", "Require multi-factor authentication for live trading and administrative actions."),
    ("NFR-004", "Apply least privilege, session timeout and step-up authentication for sensitive changes."),
    ("NFR-005", "Make order, policy, credential and override events tamper-evident and time synchronized."),
    ("NFR-006", "Define recovery-point and recovery-time objectives and test restoration."),
    ("NFR-007", "Support observability for feed delay, dropped events, rejection rate, reconciliation drift and risk breaches."),
    ("NFR-008", "Use deterministic calculations and versioned configuration for reproducibility."),
    ("NFR-009", "Meet vendor rate limits and degrade gracefully without fabricating values."),
    ("NFR-010", "Test browser accessibility, keyboard navigation, color contrast and readable risk warnings."),
], [1250, 8110], 9.0)

add_page_break()
doc.add_heading("12. Compliance and governance", level=1)
doc.add_paragraph("Before live launch, qualified legal and tax professionals should confirm the operating model, user jurisdiction, broker eligibility, exchange-data licensing, record retention, privacy obligations and whether any advisory, broker-dealer or money-management rules apply. Requirements differ materially if the platform serves other users or controls third-party accounts.")
add_bullets([
    "Display risks without implying guaranteed returns or certainty.",
    "Retain the source and timestamp of news/social claims used in decisions.",
    "Prohibit manipulative conduct, coordinated promotion and attempts to influence market price.",
    "Document retention periods, access controls, deletion policy and incident response.",
    "Review vendor terms for storing, redistributing or displaying market and social data.",
    "Maintain approval records for strategy and risk-policy changes."
])
add_callout("Regulatory risk context", "U.S. regulators warn that low-priced and microcap securities may be volatile, illiquid and vulnerable to manipulation. Social-media tips and large price spikes require enhanced skepticism and source verification.", "FCE8E6")

doc.add_heading("13. User experience", level=1)
doc.add_heading("13.1 Core screens", level=2)
add_bullets([
    ("Market pulse: ", "Feed health, market status, account mode, daily P&L and risk capacity."),
    ("Scanner: ", "Ranked symbols with price, gain, RVOL, float, spread, dollar volume, catalyst and risk badges."),
    ("Symbol workspace: ", "Chart, quotes, liquidity, halts, filings/news, social signals and trade thesis."),
    ("Order ticket: ", "Entry, stop, targets, calculated size, worst-case estimate and risk-check results."),
    ("Positions: ", "Exposure, P&L, protective-order state, time in trade and exit controls."),
    ("Risk console: ", "Limits, remaining capacity, breaches, pauses and kill-switch state."),
    ("Journal and analytics: ", "Decision evidence, execution quality, outcomes and rule adherence.")
])
doc.add_heading("13.2 Safety-oriented interaction rules", level=2)
add_bullets([
    "Live mode must be unmistakably different from paper mode.",
    "Show bid, ask, spread and quote age—not only last price.",
    "Require confirmation when estimated slippage, spread, price extension or catalyst confidence is adverse.",
    "Never use celebratory design to encourage additional trading after gains or losses.",
    "Explain each rejection in plain language and identify the controlling policy."
])

doc.add_heading("14. Analytics, audit and reporting", level=1)
add_table(["Report", "Purpose"], [
    ("Daily trading summary", "Candidates, orders, fills, P&L, fees, slippage, limits and exceptions"),
    ("Strategy performance", "Expectancy, win rate, average win/loss, profit factor, drawdown and exposure"),
    ("Execution quality", "Decision-to-order latency, fill rate, partial fills, adverse selection and slippage"),
    ("Rule adherence", "Trades proposed, accepted, blocked, overridden and exited according to plan"),
    ("Data quality", "Feed gaps, stale events, float changes, corporate-action adjustments and source failures"),
    ("Incident evidence", "Timeline of system, user, broker and vendor events with configuration versions"),
], [2600, 6760], 9.1)
doc.add_heading("14.1 Minimum trade record", level=2)
add_bullets([
    "Symbol/security identifier, venue, account mode and timestamps.",
    "Signal values, news/filing source, catalyst label and scanner configuration version.",
    "Entry thesis, planned stop/targets, position-size calculation and all risk-check results.",
    "Order requests, broker responses, modifications, fills, fees and reconciliations.",
    "Exit reason, realized result, maximum favorable/adverse excursion and post-trade notes."
])

doc.add_heading("15. Testing and model validation", level=1)
add_bullets([
    "Unit-test calculations, symbol normalization, clocks, rounding and risk boundaries.",
    "Replay historical market events through the scanner and preserve point-in-time data to prevent look-ahead bias.",
    "Backtest with realistic spreads, slippage, partial fills, fees, halts and rejected orders.",
    "Run integration tests against broker paper endpoints and simulate delayed/duplicated/out-of-order events.",
    "Perform security, permissions, secrets, dependency and recovery testing.",
    "Paper-trade through varied market conditions for at least 8-12 weeks and a statistically meaningful sample.",
    "Use a limited-capital live pilot only after formal go/no-go approval; scale gradually based on evidence."
])
doc.add_heading("15.1 Go-live gates", level=2)
add_bullets([
    "Zero unresolved critical defects and zero known paths around hard risk controls.",
    "Successful broker reconciliation and disaster-recovery exercises.",
    "Documented positive expectancy after realistic costs; acceptable drawdown and tail-loss analysis.",
    "Approved legal/compliance, vendor licensing and security reviews.",
    "Approved procedures for halt, disconnect, mismatch and kill-switch incidents."
])

doc.add_heading("16. Delivery roadmap", level=1)
add_table(["Phase", "Indicative scope", "Exit outcome"], [
    ("0. Discovery", "Confirm jurisdiction, broker, data vendors, definitions, budget and strategy hypotheses", "Approved decisions and vendor shortlist"),
    ("1. Data foundation", "Security master, market/news ingestion, history, quality monitoring and replay", "Reliable research dataset"),
    ("2. Scanner MVP", "Filters, ranking, watchlists, evidence panel and alerts", "Candidate discovery without execution"),
    ("3. Research & paper", "Backtester, journal, paper broker, analytics and risk engine", "Validated paper-trading release"),
    ("4. Controlled live", "Live broker adapter, reconciliation, operations and limited-capital launch", "Production pilot with strict limits"),
    ("5. Optimization", "Performance tuning, additional presets and carefully governed automation", "Evidence-led scale-up"),
], [1600, 4800, 2960], 8.6)
doc.add_paragraph("Schedule and cost estimates should be produced after vendor selection, account model, target platforms and automation level are confirmed.")

add_page_break()
doc.add_heading("17. Acceptance criteria", level=1)
acceptance = [
    ("AC-01", "Given a valid feed, the scanner returns only candidates meeting every mandatory universe filter."),
    ("AC-02", "A 100%-600% gain cannot independently create or submit an order."),
    ("AC-03", "RVOL displays its formula inputs, lookback and last calculation timestamp."),
    ("AC-04", "Every candidate shows bid, ask, spread, quote age and catalyst provenance or a clear unavailable state."),
    ("AC-05", "An order exceeding any hard limit is blocked before transmission and logs the rule/version."),
    ("AC-06", "Duplicate submission is prevented during timeouts, retries and reconnects."),
    ("AC-07", "Partial fills update position size and protection using confirmed broker quantities."),
    ("AC-08", "Critical stale-data, risk-service and reconciliation conditions stop new entries."),
    ("AC-09", "Paper and live modes use segregated credentials and unmistakable visual labels."),
    ("AC-10", "An authorized user can activate the configured kill switch and verify its resulting state."),
    ("AC-11", "A completed trade can be reconstructed from signal through final fill using audit evidence."),
    ("AC-12", "No live deployment occurs until all formal go-live gates are approved."),
]
add_table(["ID", "Acceptance criterion"], acceptance, [1200, 8160], 9.0)

doc.add_heading("18. Risks, decisions and open questions", level=1)
doc.add_heading("18.1 Principal risks", level=2)
add_table(["Risk", "Impact", "Primary response"], [
    ("Illiquidity / slippage", "Loss exceeds planned stop", "Liquidity/spread gates, smaller sizing, limit controls and realistic testing"),
    ("Trading halts / gaps", "Protection cannot execute", "Halt detection, reopening policy, conservative exposure and explicit warning"),
    ("False or promoted news", "Manipulated entry", "Source hierarchy, cross-checks, promotion flags and no social-only trading"),
    ("Incorrect float data", "False low-float qualification", "Multiple-source reconciliation, timestamp/confidence and corporate-action handling"),
    ("Broker/API failure", "Duplicate/missing orders", "Idempotency, query-before-retry, reconciliation and fail-closed design"),
    ("Overfitting", "Backtest does not generalize", "Walk-forward/out-of-sample testing and unchanged paper trial"),
    ("Regulatory/vendor breach", "Suspension, liability or data loss", "Specialist review, licenses, records and restricted operating model"),
], [2300, 2850, 4210], 8.4)
doc.add_heading("18.2 Decisions required", level=2)
add_bullets([
    "Target user model: owner-only, internal team, or commercial multi-user product.",
    "Country of residence, legal entity and markets/accounts to be supported.",
    "Broker and whether it supports the required securities, order types and paper/live APIs.",
    "Market-data, float, news and social-data providers and permitted usage.",
    "Manual approval, semi-automated order proposal or fully rules-based execution after validation.",
    "Default limits, trading hours, premarket/after-hours treatment and overnight-position policy.",
    "Web-only versus mobile applications, notification channels, budget and target launch date."
])

doc.add_heading("Appendix A - Requirement traceability", level=1)
add_table(["Business objective", "Key requirements", "Evidence"], [
    ("Faster discovery", "FR-001 to FR-005", "Scanner results, timestamps and source provenance"),
    ("Controlled execution", "FR-006 to FR-012", "Risk decisions, broker events and reconciliation"),
    ("Operational resilience", "NFR-001, NFR-006, NFR-007, NFR-009", "Failure tests, monitors and recovery records"),
    ("Auditability", "FR-014, FR-015, NFR-005, NFR-008", "Reconstructed trade and immutable evidence"),
], [2600, 3100, 3660], 8.8)

doc.add_heading("Appendix B - Glossary", level=1)
add_table(["Term", "Definition"], [
    ("Public float", "Shares generally available for public trading; vendor methodology must be confirmed."),
    ("Relative volume (RVOL)", "Current cumulative volume divided by comparable historical cumulative volume."),
    ("Catalyst", "A current event or disclosure that may explain unusual market attention."),
    ("Marketable limit order", "A limit order priced to seek immediate execution without accepting an unlimited price."),
    ("Slippage", "Difference between an expected price and actual execution price."),
    ("Idempotency", "Design that prevents the same intended order from being created more than once."),
    ("Fail closed", "Deny new trading action when a required safety dependency cannot be verified."),
    ("Expectancy", "Average expected result per trade based on observed wins, losses and their probabilities."),
], [2300, 7060], 8.9)

doc.add_heading("Appendix C - Authoritative risk references", level=1)
doc.add_paragraph("The following sources support the risk assumptions in this document. Product implementation must use current counsel, broker rules and vendor documentation at the time of launch.")
refs = [
    ("U.S. Securities and Exchange Commission", "Microcap Stock: A Guide for Investors", "https://www.sec.gov/about/reports-publications/investorpubsmicrocapstock"),
    ("FINRA", "Low-Priced Stocks Can Spell Big Problems", "https://www.finra.org/investors/insights/low-priced-stocks-big-problems"),
    ("FINRA", "Avoiding Pump-and-Dump Scams", "https://www.finra.org/investors/insights/pump-and-dump-scams"),
]
for org, title, url in refs:
    p = doc.add_paragraph(style="List Bullet")
    r = p.add_run(org + ": ")
    r.bold = True
    p.add_run(title + " - " + url)

doc.add_heading("Appendix D - Final disclaimer", level=1)
doc.add_paragraph("Trading low-priced and low-float securities can result in rapid and substantial loss, including losses beyond a planned stop because of gaps, halts, thin liquidity or execution failure. Historical tests and paper trading do not guarantee future results. The platform must not describe returns as guaranteed and should be used only with risk capital the account owner can afford to lose.")

# Prevent isolated headings and set metadata.
doc.core_properties.title = "MAKH Trading Platform - Business and Product Requirements"
doc.core_properties.subject = "Low-float momentum scanner, trading execution and risk management platform"
doc.core_properties.author = "MAKH Trading"
doc.core_properties.keywords = "trading platform, BRD, PRD, risk engine, scanner, broker API"
doc.core_properties.comments = "Draft v1.0"

doc.save(OUT)
print(OUT)
