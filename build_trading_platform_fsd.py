from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE

OUT = "/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/MAKH_Trading_Platform_FSD.docx"
NAVY, BLUE, DARK, LIGHT, GRAY, MID, WHITE, RED, GOLD, GREEN = "17365D", "2E74B5", "1F4D78", "E8EEF5", "F2F4F7", "657383", "FFFFFF", "9B1C1C", "FFF2CC", "E2F0D9"

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.5), Inches(11)
sec.top_margin = sec.left_margin = sec.right_margin = Inches(1)
sec.bottom_margin = Inches(.85)
sec.header_distance = sec.footer_distance = Inches(.492)

def set_font(run, size=None, color=None, bold=None, italic=None):
    run.font.name = "Calibri"
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), "Calibri")
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), "Calibri")
    if size: run.font.size = Pt(size)
    if color: run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None: run.bold = bold
    if italic is not None: run.italic = italic

normal = doc.styles["Normal"]
normal.font.name, normal.font.size = "Calibri", Pt(11)
normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
normal.paragraph_format.space_after, normal.paragraph_format.line_spacing = Pt(6), 1.10
for n, s, c, b, a in [("Title",25,NAVY,0,7),("Subtitle",13,MID,0,16),("Heading 1",16,BLUE,16,8),("Heading 2",13,BLUE,12,6),("Heading 3",12,DARK,8,4)]:
    st=doc.styles[n]; st.font.name="Calibri"; st.font.size=Pt(s); st.font.color.rgb=RGBColor.from_string(c); st.font.bold=n!="Subtitle"
    st.paragraph_format.space_before=Pt(b); st.paragraph_format.space_after=Pt(a); st.paragraph_format.keep_with_next=True
for n in ["List Bullet","List Number"]:
    st=doc.styles[n]; st.font.name="Calibri"; st.font.size=Pt(11); st.paragraph_format.left_indent=Inches(.5); st.paragraph_format.first_line_indent=Inches(-.25); st.paragraph_format.space_after=Pt(6); st.paragraph_format.line_spacing=1.167
if "Callout" not in [x.name for x in doc.styles]: doc.styles.add_style("Callout", WD_STYLE_TYPE.PARAGRAPH)
cs=doc.styles["Callout"]; cs.font.name="Calibri"; cs.font.size=Pt(10.5); cs.font.bold=True; cs.font.color.rgb=RGBColor.from_string(NAVY); cs.paragraph_format.space_before=Pt(5); cs.paragraph_format.space_after=Pt(8); cs.paragraph_format.left_indent=cs.paragraph_format.right_indent=Inches(.14)

def shade(cell, fill):
    pr=cell._tc.get_or_add_tcPr(); el=pr.find(qn("w:shd"))
    if el is None: el=OxmlElement("w:shd"); pr.append(el)
    el.set(qn("w:fill"),fill)
def margins(cell):
    pr=cell._tc.get_or_add_tcPr(); mar=pr.first_child_found_in("w:tcMar")
    if mar is None: mar=OxmlElement("w:tcMar"); pr.append(mar)
    for n,v in (("top",80),("start",120),("bottom",80),("end",120)):
        e=mar.find(qn("w:"+n))
        if e is None: e=OxmlElement("w:"+n); mar.append(e)
        e.set(qn("w:w"),str(v)); e.set(qn("w:type"),"dxa")
def geometry(table,widths):
    table.autofit=False; table.alignment=WD_TABLE_ALIGNMENT.LEFT
    pr=table._tbl.tblPr
    tw=pr.find(qn("w:tblW"))
    if tw is None: tw=OxmlElement("w:tblW"); pr.append(tw)
    tw.set(qn("w:w"),str(sum(widths))); tw.set(qn("w:type"),"dxa")
    ind=pr.find(qn("w:tblInd"))
    if ind is None: ind=OxmlElement("w:tblInd"); pr.append(ind)
    ind.set(qn("w:w"),"120"); ind.set(qn("w:type"),"dxa")
    grid=table._tbl.tblGrid
    for c in list(grid): grid.remove(c)
    for w in widths:
        c=OxmlElement("w:gridCol"); c.set(qn("w:w"),str(w)); grid.append(c)
    for row in table.rows:
        for i,cell in enumerate(row.cells):
            pr=cell._tc.get_or_add_tcPr(); cw=pr.find(qn("w:tcW"))
            if cw is None: cw=OxmlElement("w:tcW"); pr.append(cw)
            cw.set(qn("w:w"),str(widths[i])); cw.set(qn("w:type"),"dxa"); margins(cell); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
def repeat(row):
    e=OxmlElement("w:tblHeader"); e.set(qn("w:val"),"true"); row._tr.get_or_add_trPr().append(e)
def table(headers,rows,widths,size=8.6):
    t=doc.add_table(rows=1,cols=len(headers)); t.style="Table Grid"; repeat(t.rows[0])
    for i,h in enumerate(headers):
        t.rows[0].cells[i].text=h; shade(t.rows[0].cells[i],NAVY)
        for r in t.rows[0].cells[i].paragraphs[0].runs: set_font(r,size,WHITE,True)
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,v in enumerate(row):
            cells[i].text=str(v)
            if ri%2: shade(cells[i],GRAY)
            for p in cells[i].paragraphs:
                p.paragraph_format.space_after=Pt(2); p.paragraph_format.line_spacing=1.04
                for r in p.runs: set_font(r,size)
    geometry(t,widths); doc.add_paragraph().paragraph_format.space_after=Pt(0); return t
def bullets(items):
    for x in items:
        p=doc.add_paragraph(style="List Bullet")
        if isinstance(x,tuple): r=p.add_run(x[0]); r.bold=True; p.add_run(x[1])
        else: p.add_run(x)
def numbers(items):
    numbering = doc.part.numbering_part.element
    base_num_id = int(doc.styles["List Number"]._element.pPr.numPr.numId.val)
    base_abs_id = None
    existing_ids = []
    for node in numbering.findall(qn("w:num")):
        existing_ids.append(int(node.get(qn("w:numId"))))
        if int(node.get(qn("w:numId"))) == base_num_id:
            base_abs_id = int(node.find(qn("w:abstractNumId")).get(qn("w:val")))
    new_id = max(existing_ids) + 1
    num = OxmlElement("w:num"); num.set(qn("w:numId"), str(new_id))
    abs_id = OxmlElement("w:abstractNumId"); abs_id.set(qn("w:val"), str(base_abs_id)); num.append(abs_id)
    override = OxmlElement("w:lvlOverride"); override.set(qn("w:ilvl"), "0")
    start = OxmlElement("w:startOverride"); start.set(qn("w:val"), "1"); override.append(start); num.append(override)
    numbering.append(num)
    for x in items:
        p=doc.add_paragraph(x,style="List Number")
        numPr=p._p.get_or_add_pPr().get_or_add_numPr(); numPr.get_or_add_numId().val=new_id; numPr.get_or_add_ilvl().val=0
def callout(label,text,fill=LIGHT):
    p=doc.add_paragraph(style="Callout"); pr=p._p.get_or_add_pPr(); sh=OxmlElement("w:shd"); sh.set(qn("w:fill"),fill); pr.append(sh)
    r=p.add_run(label+"  "); r.bold=True; p.add_run(text)
def page(): doc.add_page_break()
def field(p,instruction):
    r=p.add_run(); b=OxmlElement("w:fldChar"); b.set(qn("w:fldCharType"),"begin"); i=OxmlElement("w:instrText"); i.set(qn("xml:space"),"preserve"); i.text=instruction; e=OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"),"end"); r._r.extend([b,i,e])

# Page furniture
h=sec.header.paragraphs[0]; h.text="MAKH TRADING | FUNCTIONAL SPECIFICATION"; [set_font(r,8.5,MID,True) for r in h.runs]
f=sec.footer.paragraphs[0]; f.alignment=WD_ALIGN_PARAGRAPH.RIGHT; set_font(f.add_run("CONFIDENTIAL • FSD v1.0    |    Page "),8,MID); field(f,"PAGE")

# Cover: memo masthead interpretation
doc.add_paragraph().paragraph_format.space_after=Pt(28)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; set_font(p.add_run("FUNCTIONAL SPECIFICATION DOCUMENT"),10,BLUE,True)
p=doc.add_paragraph(style="Title"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run("MAKH Trading Platform")
p=doc.add_paragraph(style="Subtitle"); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run("Angular Landing Page and Trading Portal • C# Clean Architecture • PostgreSQL")
table(["Document","Value"],[
    ("Document ID","MAKH-FSD-001"),("Version / status","v1.0 / Baseline for engineering review"),("Prepared for","MAKH Trading"),
    ("Source baseline","MAKH Trading Platform BRD/PRD v1.0"),("Prepared by","Senior Software Engineering and Solution Architecture"),
    ("Date","11 August 2026"),("Technology baseline","Angular 22; .NET 10 LTS / ASP.NET Core; EF Core; PostgreSQL 18")],[1950,7410],9.7)
callout("Objective","Specify buildable behavior, interfaces, data, validation, security, failure modes and acceptance tests for the public landing site and authenticated trading portal.")
callout("Safety boundary","The platform is decision-support and self-directed execution software. No module may bypass the centralized pre-trade risk engine.",GOLD)

page(); doc.add_heading("Document control and contents",1)
table(["Version","Date","Owner","Change"],[('1.0','11 Aug 2026','MAKH Trading','Initial functional and technical baseline')],[1100,1700,2200,4360],9.2)
doc.add_heading("Contents",2)
bullets(["1. Purpose, scope and assumptions","2. Solution overview and architecture","3. Technology and engineering standards","4. User roles and authorization","5. Public landing-page specification","6. Authentication and onboarding","7. Trading portal specification","8. Scanner and market-data behavior","9. News, filings and social signals","10. Order management and broker integration","11. Risk engine","12. Notifications, journal and reporting","13. Backend Clean Architecture","14. API specification","15. Real-time messaging","16. PostgreSQL data design","17. Security and privacy","18. Observability and resilience","19. Deployment and DevOps","20. Testing and acceptance","21. Delivery increments","Appendices"])

doc.add_heading("1. Purpose, scope and assumptions",1)
doc.add_paragraph("This FSD converts the approved business requirements into an implementation contract for product, design, frontend, backend, data, quality assurance, security and operations teams. It defines what the platform shall do and how major components cooperate; detailed UI artwork, vendor-specific schemas and infrastructure sizing remain design-stage deliverables.")
doc.add_heading("1.1 In scope",2)
bullets(["Responsive public marketing landing page built with Angular.","Authenticated Angular portal for watchlists, scanner, evidence, orders, positions, risk, journal, reporting and administration.","ASP.NET Core REST APIs and SignalR real-time channels organized with Clean Architecture.","PostgreSQL transactional, configuration, journal and audit data stores.","Adapters for market data, reference data, verified news/filings, permitted social signals, broker trading and notifications.","Paper and controlled live modes with strict separation and auditability."])
doc.add_heading("1.2 Out of scope for first production release",2)
bullets(["OTC securities, options, futures, cryptocurrency, forex, short selling or margin strategy logic.","Custody, managed accounts, copy trading or multi-tenant public advisory services.","Native iOS/Android applications.","Unsupervised rule changes or machine-learning models that directly submit orders."])
doc.add_heading("1.3 Assumptions",2)
bullets(["Initial deployment serves one legal account owner plus approved internal roles.","U.S.-listed common shares are the initial instrument universe.","Broker and data vendors will be selected during discovery; integrations therefore use provider-neutral ports.","All monetary calculations use decimal arithmetic; all timestamps are stored in UTC.","Configuration changes are versioned and effective-dated."])

doc.add_heading("2. Solution overview and architecture",1)
callout("Architecture decision","Use a modular monolith for the first release, separated by Clean Architecture boundaries and asynchronous jobs. This minimizes distributed-system risk while preserving clear extraction points for high-volume services.")
doc.add_heading("2.1 Logical flow",2)
numbers(["Angular landing application serves public content and directs authorized users to sign-in.","Angular portal obtains identity tokens and calls versioned ASP.NET Core APIs.","Application use cases invoke domain services and policy objects without depending on vendors or PostgreSQL.","Infrastructure adapters access PostgreSQL, broker, market/news providers, cache and notifications.","SignalR pushes quotes, scanner deltas, order events, position updates and risk-state changes.","Background workers ingest data, reconcile broker state, evaluate alerts and archive audit evidence."])
doc.add_heading("2.2 Deployable components",2)
table(["Component","Responsibility","Scale characteristic"],[
    ("web-public","Angular SSR/prerender landing site","Read-heavy, CDN-cacheable"),("web-portal","Angular authenticated SPA","Interactive, websocket-capable"),
    ("api","ASP.NET Core REST and SignalR host","Horizontally scalable, stateless sessions"),("worker","Ingestion, scanner, reconciliation, alerts","Queue/event driven"),
    ("postgres","System of record","HA, backups, point-in-time recovery"),("redis/cache","Ephemeral cache and distributed coordination","Optional for MVP; never authoritative"),
    ("object archive","Raw evidence, exports and large artifacts","Encrypted, retention controlled")],[1900,4700,2760],8.5)

doc.add_heading("3. Technology and engineering standards",1)
table(["Area","Selected baseline","Mandatory standard"],[
    ("Frontend","Angular 22 + TypeScript 6.0-compatible toolchain","Standalone components, signals for local state, strict mode, lazy routes, no experimental production APIs"),
    ("UI","Angular CDK plus approved component system","WCAG 2.2 AA target; design tokens; responsive from 360px"),
    ("Backend",".NET 10 LTS / ASP.NET Core 10","Nullable enabled, async I/O, OpenAPI, centralized problem details"),
    ("Architecture","Clean Architecture modular monolith","Domain and Application have no Infrastructure/Web dependencies"),
    ("Persistence","EF Core 10 + Npgsql","Migrations reviewed; no lazy loading; explicit transactions"),
    ("Database","PostgreSQL 18, current minor","UTC timestamptz, numeric for money, row-version strategy"),
    ("Messaging","In-process events plus durable outbox","At-least-once delivery; consumers idempotent"),
    ("Real time","ASP.NET Core SignalR","Authenticated hubs, group authorization, reconnect support"),
    ("Testing","xUnit + integration containers; Angular unit/e2e","Risk, order and reconciliation paths require automated coverage")
],[1600,3000,4760],8.1)
doc.add_heading("3.1 Repository layout",2)
bullets([("Frontend: ","apps/public-web, apps/trading-portal, libs/ui, libs/auth, libs/api-client, libs/market, libs/trading and libs/shared."),("Backend: ","src/MAKH.Domain, MAKH.Application, MAKH.Infrastructure, MAKH.Api and MAKH.Worker; mirrored test projects."),("Database: ","EF migrations in Infrastructure; SQL review scripts and operational runbooks versioned with the solution."),("Contracts: ","OpenAPI document is the REST source of truth; generated TypeScript clients are committed or built deterministically.")])

page(); doc.add_heading("4. User roles and authorization",1)
table(["Role","Capabilities","Restricted actions"],[
    ("Trader","Scanner, evidence, watchlists, paper/live order proposal, positions, journal","Cannot change non-bypassable risk ceiling"),
    ("Risk administrator","Risk policies, trading pause, lockout, breach investigation","Cannot alter historical audit events"),
    ("Operations administrator","Providers, calendars, system status, reconciliation","No discretionary order entry unless separately assigned"),
    ("Compliance/auditor","Read-only evidence, reports and exports","No trade or configuration writes"),
    ("Developer support","Time-limited diagnostic access","No production secrets or trading by default")
],[1800,4650,2910],8.5)
doc.add_heading("4.1 Authorization model",2)
bullets(["Use policy-based authorization, not UI-only hiding.","Every endpoint declares an authorization policy and account scope.","Live trading, kill switch, credential updates and risk changes require MFA freshness/step-up authentication.","Server validates permissions for SignalR subscriptions as well as REST calls.","Break-glass access requires reason, expiry and immutable audit record."])

doc.add_heading("5. Public landing-page specification",1)
doc.add_heading("5.1 Objectives",2)
bullets(["Explain the product clearly without promising returns.","Build trust through transparent risk language, security posture and product workflow.","Convert approved prospects to waitlist, demo request or sign-in.","Provide accessible legal, privacy and risk disclosures."])
doc.add_heading("5.2 Routes and sections",2)
table(["Route / section","Required content","Primary action"],[
    ("/","Hero, value proposition, platform preview, workflow, risk-first principles, FAQ","Request access / Sign in"),
    ("/platform","Scanner, evidence, risk engine, execution and reporting capabilities","View demo / Request access"),
    ("/security","Authentication, encryption, vendor boundaries, incident reporting","Contact security"),
    ("/about","Company purpose and responsible-use position","Contact"),
    ("/legal/risk","Low-priced-stock, execution, data and no-guarantee disclosures","Acknowledge / return"),
    ("/legal/privacy","Data categories, purposes, retention and rights","Privacy contact"),
    ("/status","Service health link or embedded summary","Open status page"),
    ("/auth/sign-in","Redirect to identity flow","Sign in")
],[1800,5200,2360],8.3)
doc.add_heading("5.3 Functional rules",2)
bullets(["Use Angular server-side rendering or prerendering for indexable routes; portal routes remain protected and non-indexed.","Consent form validates required fields, applies bot protection and records policy versions.","Analytics must not capture broker credentials, account values, order content or sensitive portal data.","Performance budget: responsive hero content appears without blocking on third-party scripts.","All investment-performance wording must pass legal/compliance approval."])

doc.add_heading("6. Authentication and onboarding",1)
numbers(["User selects Sign in and is redirected to an OpenID Connect authorization-code-with-PKCE flow.","API validates issuer, audience, signature, expiry and required claims.","First login requires current terms, privacy and risk acknowledgement.","User sets timezone, notification preferences and default paper account.","Broker connection uses vendor-approved OAuth where available; raw passwords are never collected.","Paper trading remains the default until activation gates and role approval are complete."])
doc.add_heading("6.1 Session behavior",2)
bullets(["Short-lived access tokens; refresh handled through the approved identity design.","No tokens in localStorage when a more secure same-site cookie/BFF pattern is selected.","Idle timeout and absolute session lifetime are configurable.","Logout revokes local session and disconnects SignalR; provider revocation is handled where supported.","Authentication failures return generic messages while detailed causes remain in secure logs."])

doc.add_heading("7. Trading portal specification",1)
table(["Route","Screen","Core functions"],[
    ("/app","Market pulse","Mode banner, market session, feed/broker health, daily P&L, remaining risk capacity"),
    ("/app/scanner","Scanner","Preset filters, live ranking, column controls, risk badges, watchlist actions"),
    ("/app/symbol/:symbol","Symbol workspace","Chart, quote/depth, metrics, catalyst evidence, thesis and order proposal"),
    ("/app/orders","Orders","State, partial fills, replace/cancel, broker messages and filters"),
    ("/app/positions","Positions","Exposure, P&L, protection state, targets, close action"),
    ("/app/risk","Risk console","Limits, capacity, breaches, pause and authorized kill switch"),
    ("/app/journal","Journal","Trade evidence, notes, tags, outcome and review"),
    ("/app/reports","Reports","Performance, execution, adherence and exports"),
    ("/app/admin","Administration","Users, providers, calendars, policy versions and diagnostics")
],[1900,1900,5560],8.2)
doc.add_heading("7.1 Shared portal behavior",2)
bullets(["Persistent header shows PAPER or LIVE mode; LIVE uses an unmistakable warning treatment.","Global connectivity indicator reflects API, real-time feed and broker status independently.","All monetary values show currency and all quotes show source timestamp/age.","Sensitive actions use confirmation dialogs that state exact account, symbol, quantity and effect.","Tables support keyboard operation, server-side pagination, sorting and saved views.","Route guards improve UX but server authorization remains authoritative."])

doc.add_heading("8. Scanner and market-data behavior",1)
doc.add_heading("8.1 Default scanner preset",2)
table(["Field","Default","Validation / failure"],[
    ("Venue","Approved Nasdaq/NYSE venues","Exclude unrecognized or OTC venue"),("Price","$3.00-$7.00","Use fresh executable reference quote"),
    ("RVOL",">=3.0","Time-of-day normalized; unavailable if history insufficient"),("Public float","<=500,000","Show provider, observed time and confidence"),
    ("Intraday gain","100%-600% watch flag","Ranking/risk flag only; never order authorization"),("Spread","Policy maximum","Reject action when stale/crossed/over limit"),
    ("Liquidity","Configured dollar volume/depth","Hard order gate; value set through validation"),("Catalyst","Verified current source","Social-only signal is insufficient")
],[2200,2200,4960],8.3)
doc.add_heading("8.2 Calculation and refresh",2)
bullets(["RVOL(t) = cumulative session volume through t / average cumulative volume through t over the configured lookback.","The server calculates authoritative screening fields; the browser may format but must not redefine values.","Scanner responses carry calculation version, source timestamps and completeness flags.","Websocket updates are deltas keyed by security ID; client requests a full snapshot after sequence gaps.","Corporate actions and symbol changes invalidate affected cached calculations until rebuilt."])

doc.add_heading("9. News, filings and social signals",1)
table(["Source class","Trust treatment","Portal presentation"],[
    ("Issuer / exchange / SEC filing","Highest available provenance; still not guaranteed accurate","Verified source badge, filing type and direct source link"),
    ("Established newswire","Deduplicate and entity-match","Publisher, timestamp, headline and relevance"),
    ("Company press release","Check issuer origin and promotional wording","Company-source label"),
    ("Social media","Spam/bot/promotion heuristics; secondary only","Attention/sentiment badge with prominent limitation"),
    ("Unknown/unsupported","Do not use as catalyst confirmation","Hidden from confirmed-catalyst state")
],[2200,4200,2960],8.4)
bullets(["Store normalized metadata and permitted excerpts only; respect license and platform terms.","Never allow a social score alone to satisfy an entry prerequisite.","Evidence links and timestamps used by a trade are snapshotted into the audit record."])

doc.add_heading("10. Order management and broker integration",1)
doc.add_heading("10.1 Order lifecycle",2)
numbers(["Client submits an order proposal with account, symbol, side, type, quantity/amount, limit, stop plan and unique client request ID.","API validates syntax, account mode, market state and optimistic concurrency token.","Risk engine performs authoritative checks and creates a signed/versioned decision record.","Approved order enters PendingSubmit and is sent through the broker port with an idempotent client-order ID.","Broker acknowledgement maps provider status to canonical state.","Fills update positions inside a transaction and publish outbox events.","Reconciliation detects missing, duplicated or divergent states and blocks affected trading when required."])
doc.add_heading("10.2 Canonical states",2)
table(["State","Meaning","Allowed next action"],[
    ("Draft","Client-side proposal not accepted by API","Edit or discard"),("RiskRejected","Failed hard policy","Review only; create new proposal"),
    ("PendingSubmit","Persisted and queued/sending","Query; no blind retry"),("Accepted/Working","Broker accepted","Replace/cancel if supported"),
    ("PartiallyFilled","Some quantity filled","Protect filled quantity; replace/cancel remainder"),("Filled","Full confirmed fill","Position management"),
    ("Cancelled","Broker confirmed no remaining working quantity","Terminal"),("Rejected","Broker rejected","Terminal with reason"),
    ("Unknown","Authoritative state cannot be confirmed","Block duplicate and reconcile")
],[1900,4200,3260],8.2)
doc.add_heading("10.3 Execution constraints",2)
bullets(["Initial order set: limit and marketable-limit; market orders disabled for low-float entry unless explicitly approved.","Every mutation requires idempotency key and expected resource version.","Cancel acknowledgment does not imply prior fills did not occur; refresh from broker.","Local timeout never changes order to Rejected without authoritative broker evidence.","Provider-specific codes are stored but mapped to stable platform states."])

page(); doc.add_heading("11. Risk engine",1)
doc.add_heading("11.1 Evaluation order",2)
table(["Sequence","Control group","Examples"],[
    ("1","System health","Fresh market data, broker reachable, reconciliation healthy, kill switch inactive"),("2","Identity/account","Authorized role, account enabled, paper/live entitlement, buying power"),
    ("3","Instrument","Approved venue/type, no suspension, tradable status, price range"),("4","Strategy","Preset version, entry trigger, catalyst, RVOL and no-chase rule"),
    ("5","Liquidity","Spread, quote age, dollar volume, depth and estimated slippage"),("6","Exposure","Position risk, concentration, open positions and pending orders"),
    ("7","Loss controls","Daily loss, consecutive losses, strategy pause and account lock"),("8","Protection","Valid stop/exit plan and broker capability")
],[1000,2600,5760],8.4)
doc.add_heading("11.2 Position sizing",2)
callout("Formula","Raw shares = floor(maximum dollar risk / absolute(entry price - stop price)). Final shares are the minimum of raw shares and every buying-power, position-value, concentration and liquidity cap.")
bullets(["Use decimal types and explicit rounding rules; do not use binary floating point for money.","Include expected fees and configurable slippage buffer.","Reject zero/negative stop distance, non-finite inputs, unavailable quotes and sizes below minimum tradable quantity.","Store every input, output, rule result and policy version."])
doc.add_heading("11.3 Kill switch",2)
table(["Mode","Behavior","Authorization"],[
    ("Block entries","Reject new opening/increasing orders","Trader or risk administrator per policy"),("Cancel working","Request cancellation of eligible working orders and reconcile","Step-up MFA"),
    ("Liquidate","Submit policy-defined close orders; cannot guarantee price","Risk administrator; explicit second confirmation"),("Provider lockout","Disable one broker/feed adapter","Operations/risk administrator")
],[1900,5000,2460],8.5)

doc.add_heading("12. Notifications, journal and reporting",1)
bullets([("Alerts: ","Candidate threshold, catalyst, fill, rejection, risk breach, halt, stale feed, broker disconnect and reconciliation mismatch."),("Delivery: ","In-app required; email/push/webhook optional by preference and severity. Trading continues from authoritative state, not notification delivery."),("Journal: ","Thesis, metrics, evidence, screenshots/links, planned risk, fills, exit reason, tags and review notes."),("Reports: ","Daily summary, strategy expectancy, drawdown, execution quality, rule adherence, data quality and incident timeline."),("Exports: ","CSV for tabular reports and PDF/JSON evidence package; exports are authorized, watermarked/logged where appropriate.")])

doc.add_heading("13. Backend Clean Architecture",1)
table(["Project / layer","Contents","Dependency rule"],[
    ("MAKH.Domain","Entities, value objects, domain services/events, invariants, policy primitives","Depends on no application/infrastructure project"),
    ("MAKH.Application","Commands, queries, handlers, ports, DTOs, validators, authorization requirements","Depends on Domain only"),
    ("MAKH.Infrastructure","EF Core, PostgreSQL, broker/data/news adapters, identity, files, notifications","Implements Application ports"),
    ("MAKH.Api","REST endpoints, SignalR hubs, middleware, composition root, OpenAPI","References Application and Infrastructure for composition"),
    ("MAKH.Worker","Scheduled/queued jobs, ingestion, scanning, reconciliation, outbox dispatch","Uses Application use cases and Infrastructure adapters"),
    ("Tests","Domain unit, application use-case, integration, contract and architecture tests","Enforces dependency boundaries")
],[2200,4700,2460],8.2)
doc.add_heading("13.1 Functional modules",2)
bullets(["Identity & Access","Accounts & Broker Connections","Security Master & Market Data","Scanner & Watchlists","Evidence & Catalysts","Orders & Positions","Risk & Policies","Journal & Reporting","Notifications","Administration & Audit"])
doc.add_heading("13.2 Application conventions",2)
bullets(["Commands change state; queries do not.","Domain invariants apply regardless of API, worker or administrator entry point.","External calls are behind interfaces and are not made from domain entities.","Outbox rows are committed atomically with state changes and dispatched asynchronously.","Exceptions are translated to RFC 9457-style problem details; secrets and sensitive values are redacted."])

doc.add_heading("14. API specification",1)
doc.add_heading("14.1 API conventions",2)
bullets(["Base path /api/v1; JSON; camelCase; ISO 8601 UTC timestamps.","Cursor pagination for event streams; page pagination for stable administrative lists.","Problem-details error body includes traceId, stable errorCode and safe field errors.","POST mutations accept Idempotency-Key; updates use ETag/If-Match or explicit version.","OpenAPI describes scopes, examples, enums and error responses; Angular client generated from the contract."])
doc.add_heading("14.2 Endpoint catalogue",2)
endpoints=[
    ("GET","/market/status","Market session and provider health","Authenticated"),("GET","/scanner/candidates","Filtered snapshot with cursor/version","Trader/Read"),
    ("GET","/securities/{id}","Security details and latest metrics","Trader/Read"),("GET","/securities/{id}/evidence","News, filings and social evidence","Trader/Read"),
    ("GET/POST","/watchlists","List/create watchlists","Trader"),("PUT/DELETE","/watchlists/{id}/items/{securityId}","Add/remove item","Trader"),
    ("POST","/orders/proposals","Validate and risk-check proposal","Trader"),("POST","/orders","Submit approved proposal","Trader + live entitlement"),
    ("POST","/orders/{id}/cancel","Request cancellation","Trader"),("POST","/orders/{id}/replace","Replace eligible order","Trader"),
    ("GET","/orders","Order history/current state","Trader/Read"),("GET","/positions","Current reconciled positions","Trader/Read"),
    ("POST","/positions/{id}/close-proposal","Generate risk-checked close proposal","Trader"),("GET","/risk/state","Limits, consumption and pauses","Trader/Read"),
    ("PUT","/risk/policies/{id}","Create new policy version","RiskAdmin"),("POST","/risk/kill-switch","Activate configured action","Privileged + MFA"),
    ("GET/POST","/journal/trades","Read/create journal record","Trader"),("GET","/reports/{type}","Generate authorized report","ReportRead"),
    ("GET","/audit/events","Search audit trail","Auditor"),("GET/PUT","/admin/providers","Provider configuration/health","OpsAdmin")
]
table(["Method","Path","Function","Policy"],endpoints,[1050,3100,3900,1310],7.8)

doc.add_heading("15. Real-time messaging",1)
table(["Channel/event","Payload essentials","Client behavior"],[
    ("scanner.updated","sequence, scannerVersion, upserts/removals","Apply in order; request snapshot after gap"),("quote.updated","securityId, bid/ask/last, timestamp, source","Display age; do not infer authoritative risk approval"),
    ("order.updated","orderId, state, filledQty, version, brokerTime","Merge by version; refresh on gap"),("position.updated","positionId, qty, cost, P&L, protection","Render reconciled server state"),
    ("risk.updated","policyVersion, capacity, pauses, breach","Immediately disable invalid actions"),("system.health","provider, status, latency, observedAt","Show degraded indicator and refresh dependencies")
],[2100,4200,3060],8.2)
bullets(["Hub connection is authenticated and authorized by account/group.","Events contain no secrets and minimize sensitive account data.","Reconnect uses exponential backoff, fresh token and snapshot resynchronization.","REST remains the recovery path; real-time delivery alone is not the system of record."])

doc.add_heading("16. PostgreSQL data design",1)
doc.add_heading("16.1 Core schemas and tables",2)
tables=[
    ("iam.users / roles","Identity mapping, status, preferences, role assignment"),("trading.accounts","Paper/live broker account reference and state"),("market.securities","Canonical security ID, symbol history, venue and instrument type"),
    ("market.quotes / bars","Current snapshots and retained market history per vendor rights"),("market.security_metrics","RVOL, float, gain, spread, liquidity and calculation version"),("evidence.items","News/filing/social metadata, source, confidence and deduplication key"),
    ("scanner.presets / runs / candidates","Versioned filters, run evidence and ranked results"),("trading.order_proposals","Immutable proposal inputs and risk decision reference"),("trading.orders / executions","Canonical order state, provider IDs, fills and versions"),
    ("trading.positions","Reconciled quantity, cost, realized/unrealized values and protection state"),("risk.policies / rules / decisions","Effective-dated policies, rules and immutable evaluations"),("journal.trade_entries","Thesis, notes, tags and outcome linked to order/position"),
    ("ops.outbox / inbox","Reliable event publication and consumer deduplication"),("audit.events","Append-only security, configuration, order and administrative evidence")
]
table(["Table group","Purpose"],tables,[3000,6360],8.3)
doc.add_heading("16.2 Data rules",2)
bullets(["Use UUID/UUIDv7-compatible identifiers; vendor IDs are alternate keys, never primary identity.","Use numeric(p,s) for price, quantity where fractional trading is supported, and monetary calculations.","Use timestamptz for instants; exchange-local dates/calendars are separate fields.","Apply unique constraints to idempotency keys, broker account/order IDs and outbox message IDs.","Orders, executions, risk decisions and audit events are not hard-deleted.","Partition very high-volume market/event tables by time after measured need; do not prematurely partition transactional tables.","Indexes are derived from query plans and include account/time, security/time, state/time and evidence source keys."])
doc.add_heading("16.3 Transaction boundaries",2)
bullets(["Order/proposal state change, risk-decision reference and outbox event commit together.","Fill processing uses broker execution ID for idempotency and locks/version checks for position update.","Policy publication creates a new immutable version; existing decisions retain the prior version.","Reconciliation corrections require reason, source snapshot and audit event."])

page(); doc.add_heading("17. Security and privacy",1)
table(["Control","Specification"],[
    ("Authentication","OIDC/OAuth 2.1-compatible provider; authorization code + PKCE; MFA/step-up for privileged actions"),("Authorization","Policy and resource-based checks on every API/hub operation; default deny"),
    ("Secrets","Managed secret store, rotation, no secrets in source/logs/database columns unless encrypted envelope is required"),("Transport","TLS for all external/internal connections; strict security headers and secure cookies"),
    ("Data protection","Encryption at rest, restricted backups, field-level protection for sensitive provider tokens"),("Web","CSP, CSRF protection, XSS-safe templates, dependency scanning, rate limits and bot controls"),
    ("Audit","Login, privilege, risk, order, provider, export and break-glass events with actor, reason and correlation ID"),("Privacy","Data minimization, purpose/retention map, user-right workflow and vendor processor review")
],[2100,7260],8.5)
doc.add_heading("17.1 Threat priorities",2)
bullets(["Unauthorized live orders or policy changes.","Credential/token theft and account takeover.","Order replay or duplicate submission.","Tampered market/news inputs leading to unsafe decisions.","Sensitive data leakage through logs, analytics, exports or websocket groups.","Denial of service that leaves local protection assumed but inactive."])

doc.add_heading("18. Observability and resilience",1)
bullets([("Metrics: ","Feed age, dropped sequences, scanner duration, API latency/errors, risk rejects, order acknowledgements, partial fills, outbox lag and reconciliation differences."),("Logs: ","Structured JSON with trace/correlation/account-safe identifiers; redact tokens, personal data and full broker payloads."),("Traces: ","Propagate W3C trace context across API, worker, database and vendor calls."),("Alerts: ","SLO-based thresholds with owner, severity, runbook and escalation."),("Health: ","Separate liveness from dependency readiness; unhealthy risk/broker/data paths fail closed for new entries."),("Recovery: ","Automated backups, point-in-time recovery, restore exercises, provider failover decisions and incident evidence.")])
doc.add_heading("18.1 Failure matrix",2)
table(["Failure","System response","User state"],[
    ("Market feed stale","Stop new entries dependent on feed; retain last value as stale","Red banner with timestamp"),("Broker timeout","Query by client order ID; no blind retry","Order shown Unknown/Pending reconciliation"),
    ("PostgreSQL unavailable","Reject writes; API readiness unhealthy","Trading disabled; status shown"),("SignalR disconnected","Continue REST recovery/polling where safe","Reconnect indicator; snapshot refresh"),
    ("Position mismatch","Freeze affected account entry and open incident","Mismatch badge and restricted actions"),("Worker backlog","Alert; prioritize order/reconciliation events","Degraded indicator")
],[2100,4500,2760],8.4)

doc.add_heading("19. Deployment and DevOps",1)
bullets(["Containerized builds with pinned base images and software bill of materials.","Separate dev, test, staging, paper-production and live-production environments/accounts.","CI gates: format, compile, unit, architecture, SAST, dependency, secret, migration and frontend accessibility checks.","CD uses signed artifacts, environment approvals, backward-compatible database deployment and rollback/run-forward plan.","EF migrations execute as a controlled job, not opportunistically on API startup.","Feature flags may expose features but cannot bypass risk policies.","Infrastructure as code defines network, compute, database, secrets, monitoring and backup policy."])
doc.add_heading("19.1 Production release order",2)
numbers(["Validate backup/restore and migration against staging-sized data.","Deploy backward-compatible database changes.","Deploy API/workers with disabled feature flags and verify health.","Deploy Angular assets and invalidate approved CDN paths.","Enable paper feature; run smoke/reconciliation checks.","Enable controlled live capability only with signed approval and monitored rollback window."])

doc.add_heading("20. Testing and acceptance",1)
table(["Test level","Required coverage"],[
    ("Domain unit","Risk formulas, invariants, order transitions, limits, rounding and policy effective dates"),("Application","Command/query authorization, validation, idempotency and transaction/outbox behavior"),
    ("Integration","PostgreSQL migrations/constraints, broker/data adapter contracts and error mapping"),("Frontend unit","Components, forms, guards, state reducers/signals and accessible interactions"),
    ("End-to-end","Sign-in, scanner, evidence, proposal, risk reject/approve, paper order, partial fill, cancel and report"),("Resilience","Stale feeds, timeouts, duplicates, sequence gaps, DB failover and reconciliation mismatch"),
    ("Security","OWASP checks, privilege escalation, token/session, CSRF/XSS, rate limits, secrets and export access"),("Performance","Scanner concurrency, quote fan-out, API p95, worker backlog and database query plans")
],[2100,7260],8.4)
doc.add_heading("20.1 Critical acceptance scenarios",2)
acs=[
    ("FSA-01","Landing pages render responsively, meet accessibility checks and contain approved risk language."),("FSA-02","Unauthenticated users cannot access portal routes, APIs or SignalR groups."),
    ("FSA-03","Scanner applies price $3-$7, RVOL >=3 and float <=500k defaults with visible timestamps/version."),("FSA-04","A 100%-600% gain alone cannot create an executable order."),
    ("FSA-05","Every order receives centralized risk evaluation and stores policy version and rule results."),("FSA-06","Duplicate HTTP requests and broker retries create at most one intended broker order."),
    ("FSA-07","Partial fills update positions and protective quantity from confirmed executions."),("FSA-08","Stale critical market data or unknown broker state blocks new entries."),
    ("FSA-09","Paper and live credentials, data and UI modes are segregated and unmistakable."),("FSA-10","Kill-switch actions require authorization/MFA and produce auditable outcomes."),
    ("FSA-11","A trade is reconstructable from evidence and proposal through final execution."),("FSA-12","PostgreSQL restore and broker reconciliation exercises pass before live activation.")]
table(["ID","Acceptance scenario"],acs,[1200,8160],8.7)

doc.add_heading("21. Delivery increments",1)
table(["Increment","Engineering deliverables","Exit gate"],[
    ("I0 Foundation","Repositories, CI, identity spike, design tokens, Clean Architecture skeleton, PostgreSQL baseline","Architecture and threat review"),
    ("I1 Public web","Landing routes, consent, legal pages, analytics boundaries and accessibility","Content/legal approval"),
    ("I2 Data + scanner","Security master, feeds, calculations, Angular scanner and real-time deltas","Replay/data-quality acceptance"),
    ("I3 Portal + evidence","Workspace, watchlists, news/filings/social labels, journal","Usability and provenance review"),
    ("I4 Risk + paper orders","Risk policies, proposals, OMS, broker paper adapter, reconciliation","Paper end-to-end certification"),
    ("I5 Reporting + operations","Reports, audit export, alerts, dashboards, backups and runbooks","Operational readiness"),
    ("I6 Controlled live","Live credentials, MFA gates, kill switch and limited-capital enablement","Formal go/no-go")
],[1600,5200,2560],8.3)

doc.add_heading("Appendix A - Key domain objects",1)
table(["Aggregate / value object","Responsibility"],[
    ("Security","Canonical instrument identity and tradability status"),("ScannerPreset / ScannerRun","Versioned criteria and reproducible candidate results"),("EvidenceItem","Provenance, classification, confidence and linkage"),
    ("OrderProposal","Trader intent before executable submission"),("RiskDecision","Immutable rule-by-rule evaluation and policy version"),("Order / Execution","Canonical lifecycle and broker-confirmed fills"),
    ("Position","Reconciled exposure, cost and protection state"),("RiskPolicy","Effective-dated hard/soft limits"),("TradeJournalEntry","Thesis, evidence, outcome and review")
],[3200,6160],8.5)

doc.add_heading("Appendix B - Open design decisions",1)
bullets(["Identity provider and whether a backend-for-frontend cookie model will be used.","Broker API, supported order types and exact paper/live environment behavior.","Market/float/news providers, entitlements, redistribution and retention rights.","Hosting platform, regions, recovery objectives and operational budget.","Whether PostgreSQL market-history storage is sufficient or a specialized time-series store is needed after measurement.","Notification providers and severity escalation policy.","Approved Angular component/design system and final brand identity."])

doc.add_heading("Appendix C - Official technology references",1)
refs=[
    ("Angular","Versioning and releases","https://angular.dev/reference/releases"),("Angular","Version compatibility","https://angular.dev/reference/versions"),
    ("Microsoft","Official .NET support policy","https://dotnet.microsoft.com/en-us/platform/support/policy"),("Microsoft Learn","Common web application architectures - Clean Architecture","https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures"),
    ("PostgreSQL","Versioning policy","https://www.postgresql.org/support/versioning/")]
for org,title,url in refs:
    p=doc.add_paragraph(style="List Bullet"); r=p.add_run(org+": "); r.bold=True; p.add_run(title+" - "+url)

doc.add_heading("Appendix D - Definition of done",1)
bullets(["Requirements and API contract accepted by product, engineering, risk and operations.","Implementation reviewed, tested, observable, documented and deployable through CI/CD.","Security, accessibility, data migration and recovery evidence attached.","No unresolved critical defect or known bypass of risk/authorization controls.","Runbooks, support ownership and rollback/run-forward plan approved."])

doc.core_properties.title="MAKH Trading Platform Functional Specification"
doc.core_properties.subject="Angular landing and portal, C# Clean Architecture backend, PostgreSQL database"
doc.core_properties.author="MAKH Trading"
doc.core_properties.keywords="FSD, Angular, C#, .NET, Clean Architecture, PostgreSQL, trading platform"
doc.core_properties.comments="FSD v1.0"
doc.save(OUT)
print(OUT)
