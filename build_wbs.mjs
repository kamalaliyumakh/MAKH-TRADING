import fs from "node:fs/promises";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const outputDir = "/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/outputs/makh-wbs";
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const dash = wb.worksheets.add("Dashboard");
const wbs = wb.worksheets.add("WBS");
const milestones = wb.worksheets.add("Milestones");
const raci = wb.worksheets.add("RACI");
const raid = wb.worksheets.add("RAID Log");
const assumptions = wb.worksheets.add("Assumptions");
const codex = wb.worksheets.add("Codex Plan");

const navy = "#17365D", blue = "#2E74B5", light = "#E8EEF5", gray = "#F2F4F7", white = "#FFFFFF";
const green = "#E2F0D9", amber = "#FFF2CC", red = "#FCE8E6", border = "#CBD5E1", ink = "#1F2937";

function title(sheet, text, subtitle, endCol) {
  sheet.showGridLines = false;
  sheet.mergeCells(`A1:${endCol}1`);
  sheet.getRange("A1").values = [[text]];
  sheet.getRange(`A1:${endCol}1`).format = { fill: navy, font: { bold: true, color: white, size: 18 }, rowHeight: 32, verticalAlignment: "center" };
  sheet.mergeCells(`A2:${endCol}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${endCol}2`).format = { fill: light, font: { color: navy, italic: true, size: 10 }, rowHeight: 22, verticalAlignment: "center" };
}
function header(range) {
  range.format = { fill: navy, font: { bold: true, color: white }, wrapText: true, verticalAlignment: "center", borders: { preset: "all", style: "thin", color: border } };
}
function body(range) {
  range.format = { font: { color: ink, size: 9 }, verticalAlignment: "center", borders: { insideHorizontal: { style: "thin", color: border } } };
}

// Assumptions
title(assumptions, "MAKH Trading Platform — Planning Assumptions", "Editable inputs that drive the WBS dates and dashboard", "D");
assumptions.getRange("A4:D4").values = [["Parameter", "Value", "Unit / Format", "Planning note"]]; header(assumptions.getRange("A4:D4"));
assumptions.getRange("A5:D14").values = [
  ["Project start date", new Date("2026-08-17T00:00:00Z"), "Date", "Change this date to move the formula-driven schedule"],
  ["Baseline duration", 280, "Calendar days", "Approximately 40 weeks with parallel workstreams"],
  ["Delivery model", "Parallel product team", "Text", "PM, BA/PO, UX, Angular, .NET, data, QA, security and DevOps"],
  ["Release strategy", "Paper-first, controlled-live", "Text", "No live activation before all governance gates"],
  ["Frontend", "Angular 22", "Version", "Use supported patch level; no experimental production APIs"],
  ["Backend", ".NET 10 LTS / ASP.NET Core", "Version", "Clean Architecture modular monolith"],
  ["Database", "PostgreSQL 18", "Version", "Current supported minor release"],
  ["Initial instrument scope", "U.S.-listed common shares", "Text", "No OTC/options/crypto in MVP"],
  ["Initial account model", "Owner-only / internal roles", "Text", "Commercial multi-tenant scope requires re-planning"],
  ["Estimate confidence", "ROM ±30%", "Text", "Refine after vendor selection and capacity planning"],
];
assumptions.getRange("B5").format.numberFormat = "yyyy-mm-dd";
body(assumptions.getRange("A5:D14"));
assumptions.getRange("B5:B14").format.fill = amber;
assumptions.getRange("A16:D16").values = [["Constraint", "Impact", "Owner", "Required decision"]]; header(assumptions.getRange("A16:D16"));
assumptions.getRange("A17:D22").values = [
  ["Broker not selected", "Order types, APIs and country eligibility remain provisional", "Sponsor / Legal", "Select before detailed broker adapter build"],
  ["Data vendors not selected", "Latency, licensing and retention design remain provisional", "Product / Architecture", "Select before scanner integration sprint"],
  ["Brand/design system not final", "Landing page visual design may be reworked", "Product / UX", "Approve before public-web implementation"],
  ["Hosting platform not selected", "IaC and recovery estimates may change", "Architecture / DevOps", "Select before environment build"],
  ["Legal operating model pending", "Live launch could be blocked", "Sponsor / Legal", "Complete before live readiness gate"],
  ["Team capacity unconfirmed", "Dates are planning baseline only", "Project Manager", "Baseline resources and velocity"],
]; body(assumptions.getRange("A17:D22"));
assumptions.getRange("A:A").format.columnWidth = 27; assumptions.getRange("B:B").format.columnWidth = 30; assumptions.getRange("C:C").format.columnWidth = 20; assumptions.getRange("D:D").format.columnWidth = 58;
assumptions.freezePanes.freezeRows(4);

const tasks = [
// id,parent,phase,wp,task,owner,priority,dep,offset,duration,milestone,gate,status,pct,codex,evidence
["0.1","0","Mobilization","Governance","Confirm sponsor, product owner and decision rights","Project Manager","Critical","",0,5,"No","Charter","Not Started",0,"Inspect/author","Approved charter and governance map"],
["0.2","0","Mobilization","Planning","Baseline scope, delivery method, environments and reporting cadence","Project Manager","High","0.1",2,8,"No","Charter","Not Started",0,"Author","Approved integrated plan"],
["0.3","0","Mobilization","Team","Confirm team roles, capacity, ceremonies and escalation path","Project Manager","High","0.1",2,8,"No","Charter","Not Started",0,"Document","Resource and communication plan"],
["0.4","0","Mobilization","Controls","Create RAID, change control, decision log and quality plan","Project Manager","High","0.2",7,6,"Yes","Charter","Not Started",0,"Author templates","Governance pack accepted"],
["1.1","1","Discovery","Product","Validate BRD/FSD scope, personas and owner-only operating model","Product Owner","Critical","0.2",7,10,"No","Discovery","Not Started",0,"Analyze documents","Signed scope baseline"],
["1.2","1","Discovery","Compliance","Confirm jurisdiction, legal entity, disclaimers and launch constraints","Legal / Compliance","Critical","1.1",7,20,"No","Discovery","Not Started",0,"Prepare evidence matrix","Legal discovery memo"],
["1.3","1","Discovery","Broker","Evaluate broker eligibility, paper/live API, order types and support","Solution Architect","Critical","1.1",7,20,"No","Discovery","Not Started",0,"Research/compare","Broker decision record"],
["1.4","1","Discovery","Data vendors","Evaluate market, float, news, filings and permitted social providers","Solution Architect","Critical","1.1",7,24,"No","Discovery","Not Started",0,"Research/compare","Vendor decision record"],
["1.5","1","Discovery","Hosting","Select hosting, regions, secrets, monitoring and backup services","Solution Architect","High","1.1",10,18,"No","Discovery","Not Started",0,"Research/ADR","Hosting ADR"],
["1.6","1","Discovery","UX","Research landing page, portal workflows and accessibility needs","UX Lead","High","1.1",12,15,"No","Discovery","Not Started",0,"Synthesize","Research findings"],
["1.7","1","Discovery","Gate","Approve discovery decisions, refined budget and delivery baseline","Sponsor","Critical","1.2,1.3,1.4,1.5",31,2,"Yes","Discovery","Not Started",0,"Summarize","Discovery gate signed"],
["2.1","2","Architecture & UX","Architecture","Produce context, container, component and deployment views","Solution Architect","Critical","1.7",35,12,"No","Architecture","Not Started",0,"Design/document","Architecture pack"],
["2.2","2","Architecture & UX","Security","Threat model identity, orders, feeds, audit and vendor boundaries","Security Lead","Critical","1.7",35,12,"No","Architecture","Not Started",0,"Threat-model","Threat register and mitigations"],
["2.3","2","Architecture & UX","Data","Finalize logical data model, retention and migration strategy","Data Engineer","High","1.7",38,12,"No","Architecture","Not Started",0,"Model/review","Approved logical model"],
["2.4","2","Architecture & UX","API","Finalize OpenAPI, SignalR events, error and idempotency conventions","Backend Lead","Critical","2.1",42,15,"No","Architecture","Not Started",0,"Generate/review","API contract baseline"],
["2.5","2","Architecture & UX","Design system","Approve brand, tokens, components and responsive behavior","UX Lead","High","1.6",35,15,"No","Architecture","Not Started",0,"Prototype","Design system library"],
["2.6","2","Architecture & UX","Landing UX","Create landing-page wireframes and approved copy","UX Lead","High","2.5",48,12,"No","Architecture","Not Started",0,"Prototype/copy","Usability and legal approval"],
["2.7","2","Architecture & UX","Portal UX","Create dashboard, scanner, symbol, order, risk and admin flows","UX Lead","Critical","2.5",48,18,"No","Architecture","Not Started",0,"Prototype","Portal prototype accepted"],
["2.8","2","Architecture & UX","Gate","Architecture, security, data and UX design review","Solution Architect","Critical","2.2,2.3,2.4,2.6,2.7",68,2,"Yes","Architecture","Not Started",0,"Review pack","Architecture gate signed"],
["3.1","3","Engineering Foundation","Repository","Create Angular workspace, .NET solution and shared engineering standards","Engineering Lead","Critical","2.8",72,8,"No","Foundation","Not Started",0,"Scaffold/code","Build passes locally and CI"],
["3.2","3","Engineering Foundation","Clean Architecture","Create Domain, Application, Infrastructure, API and Worker projects","Backend Lead","Critical","3.1",78,10,"No","Foundation","Not Started",0,"Scaffold/test","Architecture tests pass"],
["3.3","3","Engineering Foundation","Angular","Create public-web, trading-portal and shared libraries","Frontend Lead","Critical","3.1",78,10,"No","Foundation","Not Started",0,"Scaffold/test","Angular builds and tests pass"],
["3.4","3","Engineering Foundation","PostgreSQL","Provision baseline DB, roles, migration pipeline and conventions","Data Engineer","Critical","3.1",80,12,"No","Foundation","Not Started",0,"Code/configure","Migration smoke test"],
["3.5","3","Engineering Foundation","Identity","Implement OIDC integration, authorization policies and MFA hooks","Backend Lead","Critical","3.2",88,18,"No","Foundation","Not Started",0,"Code/test","Authentication security tests"],
["3.6","3","Engineering Foundation","DevSecOps","Implement CI quality gates, secrets scanning, SBOM and artifact signing","DevOps Lead","High","3.1",78,15,"No","Foundation","Not Started",0,"Pipeline/config","CI quality report"],
["3.7","3","Engineering Foundation","Environments","Provision dev/test/staging, observability and backup baseline","DevOps Lead","Critical","1.5,3.6",90,20,"No","Foundation","Not Started",0,"IaC/verify","Environment readiness record"],
["3.8","3","Engineering Foundation","Gate","Foundation readiness review","Engineering Lead","Critical","3.2,3.3,3.4,3.5,3.7",112,2,"Yes","Foundation","Not Started",0,"Run checks","Foundation gate signed"],
["4.1","4","Public Web","Landing shell","Build SSR/prerender shell, navigation, footer and responsive tokens","Frontend Lead","High","3.8,2.6",116,12,"No","Public Web","Not Started",0,"Code/test","Visual regression pass"],
["4.2","4","Public Web","Content","Implement home, platform, security, about and status routes","Frontend Engineer","High","4.1",124,15,"No","Public Web","Not Started",0,"Code/test","Content acceptance"],
["4.3","4","Public Web","Legal","Implement risk/privacy pages and versioned consent capture","Frontend Engineer","Critical","1.2,4.1",124,12,"No","Public Web","Not Started",0,"Code/test","Legal approval"],
["4.4","4","Public Web","Lead capture","Implement request-access form, validation, bot controls and notifications","Full-stack Engineer","Medium","4.1",130,12,"No","Public Web","Not Started",0,"Code/test","Form E2E pass"],
["4.5","4","Public Web","Quality","Accessibility, SEO, performance and analytics privacy verification","QA Lead","High","4.2,4.3,4.4",142,10,"No","Public Web","Not Started",0,"Audit/fix","Lighthouse/a11y reports"],
["4.6","4","Public Web","Milestone","Release public website","Product Owner","High","4.5",154,1,"Yes","Public Web","Not Started",0,"Release checklist","Public site release accepted"],
["5.1","5","Data & Scanner","Security master","Implement canonical security, symbol history, venue and corporate actions","Backend Engineer","Critical","3.8",116,18,"No","Scanner","Not Started",0,"Code/test","Data reconciliation tests"],
["5.2","5","Data & Scanner","Market adapter","Implement selected quote/trade/bar/market-status provider adapter","Backend Engineer","Critical","1.4,5.1",130,24,"No","Scanner","Not Started",0,"Code/contract-test","Provider certification"],
["5.3","5","Data & Scanner","Reference adapter","Implement float, shares and corporate-action reference adapter","Backend Engineer","Critical","1.4,5.1",130,20,"No","Scanner","Not Started",0,"Code/contract-test","Reference-data quality report"],
["5.4","5","Data & Scanner","Calculations","Implement RVOL, spread, gain, liquidity and confidence calculations","Backend Lead","Critical","5.2,5.3",150,20,"No","Scanner","Not Started",0,"Code/property-test","Calculation test pack"],
["5.5","5","Data & Scanner","Scanner service","Implement presets, runs, ranking, filters and reproducible snapshots","Backend Engineer","Critical","5.4",166,18,"No","Scanner","Not Started",0,"Code/test","Replay acceptance"],
["5.6","5","Data & Scanner","Scanner UI","Build scanner table, filters, saved views, risk badges and watchlists","Frontend Lead","Critical","5.5,2.7",174,20,"No","Scanner","Not Started",0,"Code/e2e","Portal scanner acceptance"],
["5.7","5","Data & Scanner","Real time","Implement SignalR scanner/quote deltas, sequencing and recovery","Full-stack Engineer","High","5.5",176,18,"No","Scanner","Not Started",0,"Code/chaos-test","Sequence-gap recovery pass"],
["5.8","5","Data & Scanner","Gate","Scanner and data-quality certification","Product Owner","Critical","5.2,5.3,5.4,5.6,5.7",198,2,"Yes","Scanner","Not Started",0,"Run certification","Scanner gate signed"],
["6.1","6","Evidence & Portal","News/filings","Implement news, issuer, exchange and SEC/filing adapters","Backend Engineer","High","1.4,3.8",156,22,"No","Portal","Not Started",0,"Code/contract-test","Evidence provenance test"],
["6.2","6","Evidence & Portal","Social signals","Implement permitted social attention adapter and limitation labels","Backend Engineer","Medium","1.4,3.8",162,18,"No","Portal","Not Started",0,"Code/test","Terms and spam review"],
["6.3","6","Evidence & Portal","Evidence service","Implement deduplication, entity matching, trust class and snapshots","Backend Lead","Critical","6.1,6.2",178,18,"No","Portal","Not Started",0,"Code/test","Evidence replay test"],
["6.4","6","Evidence & Portal","Symbol workspace","Build chart, quote, metrics, evidence, thesis and proposal panels","Frontend Lead","Critical","5.6,6.3",192,22,"No","Portal","Not Started",0,"Code/e2e","Workspace usability pass"],
["6.5","6","Evidence & Portal","Dashboard","Build market pulse, connectivity, P&L and risk-capacity dashboard","Frontend Engineer","High","5.7",192,18,"No","Portal","Not Started",0,"Code/e2e","Dashboard acceptance"],
["6.6","6","Evidence & Portal","Journal","Implement trade journal, tags, evidence links and review workflow","Full-stack Engineer","Medium","6.3",196,18,"No","Portal","Not Started",0,"Code/test","Journal CRUD/audit tests"],
["6.7","6","Evidence & Portal","Gate","Portal and provenance review","Product Owner","High","6.4,6.5,6.6",218,2,"Yes","Portal","Not Started",0,"Run review","Portal gate signed"],
["7.1","7","Risk & Paper Trading","Risk domain","Implement policy versions, rule engine, decisions and position sizing","Backend Lead","Critical","3.8",156,28,"No","Paper Trading","Not Started",0,"Code/property-test","Risk test suite"],
["7.2","7","Risk & Paper Trading","Broker adapter","Implement selected broker paper adapter and canonical mappings","Backend Engineer","Critical","1.3,3.8",168,26,"No","Paper Trading","Not Started",0,"Code/contract-test","Paper broker certification"],
["7.3","7","Risk & Paper Trading","OMS","Implement proposals, idempotent submission, lifecycle, cancel and replace","Backend Lead","Critical","7.1,7.2",190,26,"No","Paper Trading","Not Started",0,"Code/integration-test","OMS lifecycle test"],
["7.4","7","Risk & Paper Trading","Positions","Implement executions, positions, P&L and protective-order state","Backend Engineer","Critical","7.3",206,20,"No","Paper Trading","Not Started",0,"Code/test","Partial-fill tests"],
["7.5","7","Risk & Paper Trading","Reconciliation","Implement order/position/cash reconciliation and mismatch lockout","Backend Engineer","Critical","7.2,7.4",220,18,"No","Paper Trading","Not Started",0,"Code/chaos-test","Mismatch recovery drill"],
["7.6","7","Risk & Paper Trading","Trading UI","Build order ticket, orders, positions, confirmations and protection states","Frontend Lead","Critical","7.3,7.4",214,24,"No","Paper Trading","Not Started",0,"Code/e2e","Paper trading E2E"],
["7.7","7","Risk & Paper Trading","Risk console","Build limits, capacity, breaches, pause and kill-switch UX","Frontend Engineer","Critical","7.1",214,20,"No","Paper Trading","Not Started",0,"Code/security-test","Risk console acceptance"],
["7.8","7","Risk & Paper Trading","Paper trial","Operate paper trading, defects, metrics and strategy validation","Product Owner","Critical","7.5,7.6,7.7",240,28,"No","Paper Trading","Not Started",0,"Monitor/analyze","Paper-trial report"],
["7.9","7","Risk & Paper Trading","Milestone","Paper-trading certification","Sponsor","Critical","7.8",269,2,"Yes","Paper Trading","Not Started",0,"Summarize evidence","Paper gate signed"],
["8.1","8","Operations & Reporting","Notifications","Implement in-app/email alerts, preferences, severity and delivery audit","Full-stack Engineer","Medium","6.7",220,16,"No","Operations","Not Started",0,"Code/test","Notification tests"],
["8.2","8","Operations & Reporting","Reports","Implement daily, strategy, execution, adherence and data-quality reports","Backend Engineer","High","7.4,6.6",228,20,"No","Operations","Not Started",0,"Code/reconcile","Report reconciliation"],
["8.3","8","Operations & Reporting","Audit exports","Implement authorized CSV/PDF/JSON evidence packages","Backend Engineer","High","8.2",244,14,"No","Operations","Not Started",0,"Code/security-test","Export authorization test"],
["8.4","8","Operations & Reporting","Admin","Build users, providers, calendars, policies and diagnostics admin UI","Full-stack Engineer","High","3.5,7.1",228,22,"No","Operations","Not Started",0,"Code/e2e","Admin privilege test"],
["8.5","8","Operations & Reporting","Observability","Complete SLO dashboards, alerts, tracing and runbooks","DevOps Lead","Critical","7.5",238,18,"No","Operations","Not Started",0,"Configure/drill","Operational readiness review"],
["8.6","8","Operations & Reporting","Recovery","Run backup restore, PITR, dependency and incident exercises","DevOps Lead","Critical","3.7,8.5",256,12,"No","Operations","Not Started",0,"Run drills","Recovery evidence"],
["8.7","8","Operations & Reporting","Gate","Operational readiness review","Project Manager","Critical","8.1,8.2,8.3,8.4,8.6",270,2,"Yes","Operations","Not Started",0,"Compile evidence","ORR signed"],
["9.1","9","Controlled Live","Security","Independent security test and remediation","Security Lead","Critical","7.9,8.7",272,8,"No","Live","Not Started",0,"Audit/remediate","Security approval"],
["9.2","9","Controlled Live","Compliance","Final legal, vendor-license, privacy and records approval","Legal / Compliance","Critical","1.2,8.7",272,8,"No","Live","Not Started",0,"Compile evidence","Compliance approval"],
["9.3","9","Controlled Live","Live config","Configure segregated live credentials, limits, MFA and kill switch","Risk Administrator","Critical","9.1,9.2",278,2,"No","Live","Not Started",0,"Configure/verify","Live configuration record"],
["9.4","9","Controlled Live","Go/no-go","Review quality, paper results, operations, security and compliance evidence","Sponsor","Critical","9.1,9.2,9.3",280,1,"Yes","Live","Not Started",0,"Summarize","Go/no-go signed"],
["9.5","9","Controlled Live","Pilot","Launch limited-capital live pilot with monitoring and rollback window","Product Owner","Critical","9.4",281,7,"No","Live","Not Started",0,"Monitor/respond","Pilot report"],
["9.6","9","Controlled Live","Closure","Accept product, transition ownership, backlog and lessons learned","Project Manager","High","9.5",288,2,"Yes","Closure","Not Started",0,"Document","Completion certificate and handover"],
];

// WBS
title(wbs, "MAKH Trading Platform — Work Breakdown Structure", "Baseline: Angular 22 + .NET 10 Clean Architecture + PostgreSQL 18 | Formula-driven dates and status", "S");
const headers = ["WBS ID","Parent","Phase","Work Package","Task / Deliverable","Owner","Priority","Dependency","Start Offset","Duration","Planned Start","Planned Finish","Milestone","Gate","Status","% Complete","RAG","Codex Mode","Acceptance Evidence"];
wbs.getRange("A4:S4").values = [headers]; header(wbs.getRange("A4:S4"));
const rows = tasks.map(t => [t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],null,null,t[10],t[11],t[12],t[13],null,t[14],t[15]]);
wbs.getRange(`A5:S${rows.length+4}`).values = rows;
for (let r=5;r<=rows.length+4;r++) {
  wbs.getRange(`K${r}`).formulas = [[`='Assumptions'!$B$5+I${r}`]];
  wbs.getRange(`L${r}`).formulas = [[`=K${r}+J${r}-1`]];
  wbs.getRange(`Q${r}`).formulas = [[`=IF(O${r}="Complete","Green",IF(AND(L${r}<TODAY(),O${r}<>"Complete"),"Red",IF(AND(L${r}-TODAY()<=14,P${r}<1),"Amber","Green")))`]];
}
wbs.getRange(`K5:L${rows.length+4}`).format.numberFormat = "yyyy-mm-dd";
wbs.getRange(`P5:P${rows.length+4}`).format.numberFormat = "0%";
body(wbs.getRange(`A5:S${rows.length+4}`));
wbs.getRange(`O5:O${rows.length+4}`).dataValidation = { rule: { type: "list", values: ["Not Started","In Progress","Blocked","Complete","Deferred"] } };
wbs.getRange(`G5:G${rows.length+4}`).dataValidation = { rule: { type: "list", values: ["Critical","High","Medium","Low"] } };
wbs.getRange(`P5:P${rows.length+4}`).dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
wbs.getRange(`Q5:Q${rows.length+4}`).conditionalFormats.add("containsText", { text: "Red", format: { fill: "#F4CCCC", font: { color: "#9C0006", bold: true } } });
wbs.getRange(`Q5:Q${rows.length+4}`).conditionalFormats.add("containsText", { text: "Amber", format: { fill: amber, font: { color: "#9C6500", bold: true } } });
wbs.getRange(`Q5:Q${rows.length+4}`).conditionalFormats.add("containsText", { text: "Green", format: { fill: green, font: { color: "#006100", bold: true } } });
wbs.getRange(`O5:O${rows.length+4}`).conditionalFormats.add("containsText", { text: "Blocked", format: { fill: red, font: { color: "#9C0006", bold: true } } });
wbs.getRange(`O5:O${rows.length+4}`).conditionalFormats.add("containsText", { text: "Complete", format: { fill: green, font: { color: "#006100" } } });
wbs.tables.add(`A4:S${rows.length+4}`, true, "WBSTable").style = "TableStyleMedium2";
wbs.freezePanes.freezeRows(4); wbs.freezePanes.freezeColumns(5);
const widths = [10,8,21,20,56,22,11,18,12,10,14,14,11,16,14,12,10,20,42];
"ABCDEFGHIJKLMNOPQRS".split("").forEach((c,i)=>wbs.getRange(`${c}:${c}`).format.columnWidth=widths[i]);

// Dashboard
title(dash, "MAKH Trading Platform — Project Control Dashboard", "Senior Project Manager view | Update Status and % Complete on the WBS sheet", "L");
dash.getRange("A4:B4").values = [["KPI","Value"]]; header(dash.getRange("A4:B4"));
dash.getRange("A5:A12").values = [["Total work items"],["Completed"],["In progress"],["Blocked"],["Overall completion"],["Project start"],["Planned completion"],["Critical milestones"]];
dash.getRange("B5:B12").formulas = [
  [`=COUNTA('WBS'!$A$5:$A$${rows.length+4})`],[`=COUNTIF('WBS'!$O$5:$O$${rows.length+4},"Complete")`],[`=COUNTIF('WBS'!$O$5:$O$${rows.length+4},"In Progress")`],[`=COUNTIF('WBS'!$O$5:$O$${rows.length+4},"Blocked")`],
  [`=SUMPRODUCT('WBS'!$J$5:$J$${rows.length+4},'WBS'!$P$5:$P$${rows.length+4})/SUM('WBS'!$J$5:$J$${rows.length+4})`],[`='Assumptions'!$B$5`],[`=MAX('WBS'!$L$5:$L$${rows.length+4})`],[`=COUNTIF('WBS'!$M$5:$M$${rows.length+4},"Yes")`]
];
dash.getRange("A5:B12").format = { borders: { preset: "all", style: "thin", color: border }, verticalAlignment: "center" };
dash.getRange("A5:A12").format = { fill: gray, font: { bold: true, color: navy } };
dash.getRange("B9").format.numberFormat="0%"; dash.getRange("B10:B11").format.numberFormat="yyyy-mm-dd";
dash.getRange("D4:H4").values = [["Phase","Items","Complete","% Complete","RAG"]]; header(dash.getRange("D4:H4"));
const phases = [...new Set(tasks.map(t=>t[2]))];
dash.getRange(`D5:D${phases.length+4}`).values = phases.map(x=>[x]);
for(let r=5;r<=phases.length+4;r++){
  dash.getRange(`E${r}`).formulas=[[`=COUNTIF('WBS'!$C$5:$C$${rows.length+4},D${r})`]];
  dash.getRange(`F${r}`).formulas=[[`=COUNTIFS('WBS'!$C$5:$C$${rows.length+4},D${r},'WBS'!$O$5:$O$${rows.length+4},"Complete")`]];
  dash.getRange(`G${r}`).formulas=[[`=IF(E${r}=0,0,F${r}/E${r})`]];
  dash.getRange(`H${r}`).formulas=[[`=IF(COUNTIFS('WBS'!$C$5:$C$${rows.length+4},D${r},'WBS'!$Q$5:$Q$${rows.length+4},"Red")>0,"Red",IF(COUNTIFS('WBS'!$C$5:$C$${rows.length+4},D${r},'WBS'!$Q$5:$Q$${rows.length+4},"Amber")>0,"Amber","Green"))`]];
}
body(dash.getRange(`D5:H${phases.length+4}`)); dash.getRange(`G5:G${phases.length+4}`).format.numberFormat="0%";
dash.getRange(`H5:H${phases.length+4}`).conditionalFormats.add("containsText",{text:"Red",format:{fill:red,font:{color:"#9C0006",bold:true}}});
dash.getRange(`H5:H${phases.length+4}`).conditionalFormats.add("containsText",{text:"Amber",format:{fill:amber,font:{color:"#9C6500",bold:true}}});
dash.getRange(`H5:H${phases.length+4}`).conditionalFormats.add("containsText",{text:"Green",format:{fill:green,font:{color:"#006100",bold:true}}});
dash.getRange("A15:L15").merge(); dash.getRange("A15").values=[["Decision Gate Rule: Live trading cannot be enabled until Paper Trading, Operational Readiness, Security and Compliance gates are signed."]]; dash.getRange("A15:L15").format={fill:amber,font:{bold:true,color:"#7F6000"},wrapText:true,rowHeight:30};
dash.getRange("A:A").format.columnWidth=28; dash.getRange("B:B").format.columnWidth=18; dash.getRange("C:C").format.columnWidth=3; dash.getRange("D:D").format.columnWidth=28; dash.getRange("E:H").format.columnWidth=15;
dash.freezePanes.freezeRows(2);

// Milestones
title(milestones,"MAKH Trading Platform — Milestones & Stage Gates","Derived from WBS milestone work items","J");
milestones.getRange("A4:J4").values=[["WBS ID","Milestone","Phase","Owner","Planned Date","Dependency","Gate","Status","% Complete","Acceptance Evidence"]]; header(milestones.getRange("A4:J4"));
const ms = tasks.filter(t=>t[10]==="Yes");
const msRows = ms.map(t=>[t[0],t[4],t[2],t[5],null,t[7],t[11],t[12],t[13],t[15]]);
milestones.getRange(`A5:J${msRows.length+4}`).values=msRows;
for(let i=0;i<msRows.length;i++) milestones.getRange(`E${i+5}`).formulas=[[`=INDEX('WBS'!$L$5:$L$${rows.length+4},MATCH(A${i+5},'WBS'!$A$5:$A$${rows.length+4},0))`]];
milestones.getRange(`E5:E${msRows.length+4}`).format.numberFormat="yyyy-mm-dd"; milestones.getRange(`I5:I${msRows.length+4}`).format.numberFormat="0%"; body(milestones.getRange(`A5:J${msRows.length+4}`));
milestones.getRange(`H5:H${msRows.length+4}`).dataValidation={rule:{type:"list",values:["Not Started","In Progress","Blocked","Complete","Deferred"]}};
milestones.tables.add(`A4:J${msRows.length+4}`,true,"MilestonesTable").style="TableStyleMedium2"; milestones.freezePanes.freezeRows(4);
[10,42,22,22,15,24,18,14,12,48].forEach((v,i)=>milestones.getRange(`${String.fromCharCode(65+i)}:${String.fromCharCode(65+i)}`).format.columnWidth=v);

// RACI
title(raci,"MAKH Trading Platform — RACI Matrix","A = Accountable, R = Responsible, C = Consulted, I = Informed","L");
const roles=["Sponsor","Project Manager","Product Owner","Solution Architect","UX Lead","Frontend Lead","Backend Lead","Data Engineer","QA Lead","Security/Legal","DevOps Lead"];
raci.getRange("A4:L4").values=[["Workstream",...roles]]; header(raci.getRange("A4:L4"));
const raciRows=[
 ["Governance","A","R","C","I","I","I","I","I","I","C","I"],["Discovery & vendors","A","R","R","R","C","I","C","C","I","R","C"],
 ["Architecture","I","C","C","A/R","C","C","R","R","C","C","C"],["UX & design system","I","C","A","C","R","C","C","I","C","C","I"],
 ["Public landing page","I","C","A","C","R","R","C","I","R","C","C"],["Data & scanner","I","C","A","R","C","C","R","R","R","C","C"],
 ["Portal & evidence","I","C","A","C","R","R","R","C","R","C","C"],["Risk & OMS","I","C","C","C","I","C","A/R","C","R","C","C"],
 ["Security & compliance","A","C","C","C","I","C","C","I","R","R","C"],["Operations & release","A","R","C","C","I","C","C","C","R","C","R"],
 ["Controlled live pilot","A","R","R","C","I","C","R","I","R","R","R"],
];
raci.getRange(`A5:L${raciRows.length+4}`).values=raciRows; body(raci.getRange(`A5:L${raciRows.length+4}`)); raci.tables.add(`A4:L${raciRows.length+4}`,true,"RACITable").style="TableStyleMedium2"; raci.freezePanes.freezeRows(4); raci.freezePanes.freezeColumns(1);
raci.getRange("A:A").format.columnWidth=28; raci.getRange("B:L").format.columnWidth=16;

// RAID
title(raid,"MAKH Trading Platform — RAID Log","Starter risks, assumptions, issues and decisions; update during weekly governance","K");
raid.getRange("A4:K4").values=[["ID","Type","Description","Probability","Impact","Score","Owner","Response / Decision","Due Date","Status","Trigger / Evidence"]]; header(raid.getRange("A4:K4"));
const raidRows=[
 ["R-01","Risk","Broker does not support required securities/order types for user jurisdiction",4,5,null,"Sponsor / Architect","Complete eligibility and API due diligence before adapter build",new Date("2026-09-11"),"Open","Broker written confirmation"],
 ["R-02","Risk","Low-float market slippage/halts exceed modeled loss",4,5,null,"Risk Administrator","Liquidity gates, conservative sizing, paper trial and halt procedures",new Date("2027-04-30"),"Open","Paper tail-loss analysis"],
 ["R-03","Risk","Market/float/news licensing restricts storage or display",3,5,null,"Product / Legal","Contract review and retention design before implementation",new Date("2026-09-18"),"Open","Signed vendor terms"],
 ["R-04","Risk","Feed or broker outage creates unknown order/position state",3,5,null,"Backend / DevOps","Idempotency, reconciliation, fail-closed behavior and drills",new Date("2027-05-14"),"Open","Chaos and recovery evidence"],
 ["R-05","Risk","Strategy overfits historical/paper data",4,4,null,"Product Owner","Point-in-time replay, walk-forward tests and unchanged paper trial",new Date("2027-05-14"),"Open","Validation report"],
 ["R-06","Risk","Security compromise enables unauthorized live orders",3,5,null,"Security Lead","OIDC, MFA, policy authorization, secrets, audit and independent test",new Date("2027-05-21"),"Open","Security approval"],
 ["A-01","Assumption","Parallel cross-functional team is available at planned capacity",3,4,null,"Project Manager","Confirm named resources before baseline approval",new Date("2026-08-28"),"Open","Resource plan"],
 ["A-02","Assumption","Owner-only operating model remains valid through MVP",2,5,null,"Sponsor / Legal","Raise change request if commercial/multi-tenant scope emerges",new Date("2026-09-04"),"Open","Operating model decision"],
 ["D-01","Decision","Use modular monolith with Clean Architecture for first release",1,3,null,"Solution Architect","Revisit only with measured scaling evidence",new Date("2026-10-23"),"Approved","Architecture gate"],
 ["D-02","Decision","Paper-first release; live activation is a separate gated decision",1,5,null,"Sponsor","No live credentials before gate approval",new Date("2027-05-24"),"Approved","Go/no-go record"],
];
raid.getRange(`A5:K${raidRows.length+4}`).values=raidRows;
for(let r=5;r<=raidRows.length+4;r++) raid.getRange(`F${r}`).formulas=[[`=D${r}*E${r}`]];
raid.getRange(`I5:I${raidRows.length+4}`).format.numberFormat="yyyy-mm-dd"; body(raid.getRange(`A5:K${raidRows.length+4}`));
raid.getRange(`D5:E${raidRows.length+4}`).dataValidation={rule:{type:"whole",operator:"between",formula1:1,formula2:5}};
raid.getRange(`J5:J${raidRows.length+4}`).dataValidation={rule:{type:"list",values:["Open","Mitigating","Accepted","Approved","Closed"]}};
raid.getRange(`F5:F${raidRows.length+4}`).conditionalFormats.add("cellIs",{operator:"greaterThanOrEqual",formula:15,format:{fill:red,font:{color:"#9C0006",bold:true}}});
raid.getRange(`F5:F${raidRows.length+4}`).conditionalFormats.add("cellIs",{operator:"between",formula:[8,14],format:{fill:amber,font:{color:"#9C6500",bold:true}}});
raid.tables.add(`A4:K${raidRows.length+4}`,true,"RAIDTable").style="TableStyleMedium2"; raid.freezePanes.freezeRows(4);
[10,14,52,12,10,10,24,54,15,14,38].forEach((v,i)=>raid.getRange(`${String.fromCharCode(65+i)}:${String.fromCharCode(65+i)}`).format.columnWidth=v);

// Codex plan sheet
title(codex,"MAKH Trading Platform — Codex Execution Plan","Implementation waves mapped to WBS gates; each wave ends with tests, evidence and a user review","I");
codex.getRange("A4:I4").values=[["Wave","WBS Scope","Codex Objective","Primary Outputs","Verification","Human Decision","Exit Condition","Suggested Branch","Status"]]; header(codex.getRange("A4:I4"));
const waves=[
 ["C0","0.*–2.*","Convert approved requirements into repository-ready architecture and ADRs","Architecture docs, OpenAPI baseline, data model, threat model, UX route map","Document review, contract lint, architecture checklist","Vendor, hosting, identity and design approvals","Architecture gate signed","codex/foundation-architecture","Not Started"],
 ["C1","3.1–3.8","Create the buildable Angular/.NET/PostgreSQL foundation","Angular workspace, Clean Architecture solution, migrations, CI, identity skeleton","Compile, unit, architecture, migration and auth smoke tests","Identity/provider credentials and environment approval","Foundation gate signed","codex/platform-foundation","Not Started"],
 ["C2","4.1–4.6","Deliver the public landing application","SSR routes, legal pages, consent, lead capture, accessibility and SEO","Angular tests, e2e, accessibility, performance and security headers","Brand/copy/legal acceptance","Public web milestone accepted","codex/public-web","Not Started"],
 ["C3","5.1–5.8","Deliver market ingestion and scanner","Provider adapters, metrics, presets, SignalR deltas, scanner UI and watchlists","Contract tests, point-in-time replay, sequence recovery and UI e2e","Data quality and licensing acceptance","Scanner gate signed","codex/scanner","Not Started"],
 ["C4","6.1–6.7","Deliver evidence and core portal workflows","News/filing/social adapters, evidence service, symbol workspace, dashboard and journal","Provenance, deduplication, accessibility and portal e2e tests","Product/usability approval","Portal gate signed","codex/portal-evidence","Not Started"],
 ["C5","7.1–7.9","Deliver centralized risk and paper trading","Risk domain, broker paper adapter, OMS, positions, reconciliation, trading UI and kill switch","Property, integration, duplicate, partial-fill, timeout, chaos and paper e2e tests","Paper broker and risk-policy approval","Paper certification signed","codex/paper-trading","Not Started"],
 ["C6","8.1–8.7","Complete reporting and production operations","Notifications, reports, exports, admin, SLOs, runbooks, backups and recovery","Authorization, reconciliation, observability, restore and incident drills","Operational readiness approval","ORR signed","codex/operations","Not Started"],
 ["C7","9.1–9.6","Prepare and support controlled live pilot","Security fixes, live segregation, MFA gates, deployment checklist, monitoring and handover","Independent security test, compliance evidence, smoke/reconciliation and rollback drill","Sponsor go/no-go; live credentials","Pilot accepted and product handed over","codex/controlled-live","Not Started"],
];
codex.getRange(`A5:I${waves.length+4}`).values=waves; body(codex.getRange(`A5:I${waves.length+4}`)); codex.getRange(`I5:I${waves.length+4}`).dataValidation={rule:{type:"list",values:["Not Started","In Progress","Blocked","Complete"]}};
codex.tables.add(`A4:I${waves.length+4}`,true,"CodexPlanTable").style="TableStyleMedium2"; codex.freezePanes.freezeRows(4);
[9,15,42,48,42,38,32,29,14].forEach((v,i)=>codex.getRange(`${String.fromCharCode(65+i)}:${String.fromCharCode(65+i)}`).format.columnWidth=v);
codex.getRange("A15:I15").merge(); codex.getRange("A15").values=[["Codex working rule: inspect existing code and AGENTS.md first; implement the smallest gate-complete vertical slice; run tests and security checks; document evidence; stop before any external/live action that requires new authority."]]; codex.getRange("A15:I15").format={fill:amber,font:{bold:true,color:"#7F6000"},wrapText:true,rowHeight:42};

// General row/format fixes
for (const sh of [dash,wbs,milestones,raci,raid,assumptions,codex]) {
  const used = sh.getUsedRange();
  used.format.wrapText = true;
  used.format.autofitRows();
}

await wb.comments.setSelf({ displayName: "User" });
wb.comments.addThread({ cell: assumptions.getRange("B5") }, "Editable project start date. WBS planned dates update from this cell.");
wb.comments.addThread({ cell: assumptions.getRange("B14") }, "ROM estimate confidence should be tightened after vendors and team capacity are confirmed.");

const inspect = await wb.inspect({ kind: "table", range: "Dashboard!A1:H15", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 10 });
console.log(inspect.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);

for (const name of ["Dashboard","WBS","Milestones","RACI","RAID Log","Assumptions","Codex Plan"]) {
  const preview = await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${name.replaceAll(" ","_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(`${outputDir}/MAKH_Trading_Platform_WBS.xlsx`);
console.log(`${outputDir}/MAKH_Trading_Platform_WBS.xlsx`);
