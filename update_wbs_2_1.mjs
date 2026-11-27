import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath =
  '/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/outputs/makh-wbs/MAKH_Trading_Platform_WBS.xlsx';
const previewDir =
  '/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/outputs/makh-wbs/status-previews';
await fs.mkdir(previewDir, { recursive: true });

const input = await FileBlob.load(workbookPath);
const wb = await SpreadsheetFile.importXlsx(input);

if (process.env.LIST_SHEETS === '1') {
  console.log((await wb.inspect({ kind: 'sheet', include: 'id,name' })).ndjson);
  process.exit(0);
}

if (process.env.STATUS_AUDIT === '1') {
  const rows = wb.worksheets.getItem('WBS').getRange('A5:S74').values;
  const grouped = Object.groupBy(rows, (row) => String(row[14] ?? 'Blank'));
  for (const [status, items] of Object.entries(grouped)) {
    console.log(
      JSON.stringify({
        status,
        count: items.length,
        items: items.map((row) => ({ id: row[0], workPackage: row[3], percent: row[15] })),
      }),
    );
  }
  console.log(
    (
      await wb.inspect({
        kind: 'table',
        range: 'Dashboard!A4:B10',
        include: 'values,formulas',
        tableMaxRows: 10,
        tableMaxCols: 3,
      })
    ).ndjson,
  );
  process.exit(0);
}

const before = await wb.inspect({
  kind: 'table',
  range: 'WBS!A66:S71',
  include: 'values,formulas',
  tableMaxRows: 10,
  tableMaxCols: 20,
});
console.log(before.ndjson);

if (process.env.VERIFY_ONLY === '1') {
  console.log(
    (
      await wb.inspect({
        kind: 'table',
        range: 'Dashboard!A4:H14',
        include: 'values,formulas',
        tableMaxRows: 15,
        tableMaxCols: 10,
      })
    ).ndjson,
  );
  console.log(
    (
      await wb.inspect({
        kind: 'match',
        searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
        options: { useRegex: true, maxResults: 100 },
        summary: 'read-only formula error scan after resumed WBS 7.6 server-review update',
      })
    ).ndjson,
  );
  process.exit(0);
}

const beforePreview = await wb.render({
  sheetName: 'WBS',
  range: 'A59:S64',
  scale: 1.4,
  format: 'png',
});
await fs.writeFile(
  `${previewDir}/wbs-7.6-server-review-before.png`,
  new Uint8Array(await beforePreview.arrayBuffer()),
);

if (process.env.PREVIEW_ONLY === '1') process.exit(0);
if (process.env.PREVIEW_ALL === '1') {
  for (const [sheetName, range, fileName] of [
    ['Dashboard', 'A1:H15', 'all-dashboard-7.6-server-review.png'],
    ['WBS', 'A1:S74', 'all-wbs-7.6-server-review.png'],
    ['Milestones', 'A1:J15', 'all-milestones-7.6-server-review.png'],
    ['RACI', 'A1:L15', 'all-raci-7.6-server-review.png'],
    ['RAID Log', 'A1:K14', 'all-raid-log-7.6-server-review.png'],
    ['Assumptions', 'A1:D22', 'all-assumptions-7.6-server-review.png'],
    ['Codex Plan', 'A1:I15', 'all-codex-plan-7.6-server-review.png'],
  ]) {
    const preview = await wb.render({ sheetName, range, scale: 0.9, format: 'png' });
    await fs.writeFile(`${previewDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()));
  }
  process.exit(0);
}
if (process.env.PLAN_ONLY === '1') {
  const plan = wb.worksheets.getItem('Codex Plan');
  const waves = plan.getRange('A5:A20').values;
  let planRow = null;
  for (let i = 0; i < waves.length; i++) {
    if (String(waves[i][0] ?? '') === 'C5') planRow = i + 5;
  }
  if (planRow === null) throw new Error('Codex wave C5 was not found');
  plan.getRange(`I${planRow}`).values = [['In Progress']];
  console.log(
    (
      await wb.inspect({
        kind: 'table',
        range: `Codex Plan!A${planRow}:I${planRow}`,
        include: 'values,formulas',
      })
    ).ndjson,
  );
  const errors = await wb.inspect({
    kind: 'match',
    searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
    options: { useRegex: true, maxResults: 100 },
    summary: 'formula error scan after Codex wave C5 synchronization',
  });
  console.log(errors.ndjson);
  const preview = await wb.render({
    sheetName: 'Codex Plan',
    range: 'A1:I15',
    scale: 1.2,
    format: 'png',
  });
  await fs.writeFile(
    `${previewDir}/codex-plan-after-7.1.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
  const output = await SpreadsheetFile.exportXlsx(wb);
  await output.save(workbookPath);
  process.exit(0);
}
if (process.env.MILESTONE_ONLY === '1') {
  const milestones = wb.worksheets.getItem('Milestones');
  const milestoneIds = milestones.getRange('A5:A20').values;
  let milestoneRow = null;
  for (let i = 0; i < milestoneIds.length; i++) {
    if (String(milestoneIds[i][0] ?? '') === '9.6') milestoneRow = i + 5;
  }
  if (milestoneRow === null) throw new Error('Milestone 9.6 was not found');
  milestones.getRange(`H${milestoneRow}`).values = [['In Progress']];
  milestones.getRange(`I${milestoneRow}`).values = [[0.3]];
  milestones.getRange(`J${milestoneRow}`).values = [
    ['Closure/transition package prepared; Reject/Defer project acceptance with only 6 of 70 packages Complete and all handover approvals pending'],
  ];
  milestones.getRange(`A${milestoneRow}:J${milestoneRow}`).format.rowHeight = 32;
  milestones.getRange(`J${milestoneRow}`).format.wrapText = true;
  const errors = await wb.inspect({
    kind: 'match',
    searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
    options: { useRegex: true, maxResults: 100 },
    summary: 'formula error scan after milestone 9.6 synchronization',
  });
  console.log(errors.ndjson);
  console.log(
    (
      await wb.inspect({
        kind: 'table',
        range: `Milestones!A${milestoneRow}:J${milestoneRow}`,
        include: 'values,formulas',
      })
    ).ndjson,
  );
  const preview = await wb.render({
    sheetName: 'Milestones',
    range: 'A1:J15',
    scale: 1.2,
    format: 'png',
  });
  await fs.writeFile(
    `${previewDir}/milestones-after-9.6.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
  const output = await SpreadsheetFile.exportXlsx(wb);
  await output.save(workbookPath);
  process.exit(0);
}

const wbs = wb.worksheets.getItem('WBS');
const ids = wbs.getRange('A5:A100').values;
let targetRow = null;
for (let i = 0; i < ids.length; i++) {
  if (String(ids[i][0] ?? '') === '7.6') {
    targetRow = i + 5;
    break;
  }
}
if (targetRow === null) throw new Error('WBS item 7.6 was not found');

wbs.getRange(`O${targetRow}`).values = [['In Progress']];
wbs.getRange(`P${targetRow}`).values = [[0.88]];
wbs.getRange(`S${targetRow}`).values = [
  [
    'Paper trading UI: account-bound antiforgery server review enforces guardrails, idempotency and false submission/mutation/authority flags; 48 portal, 9 service and 4 focused API cases pass; no authoritative risk/OMS provider, execution, lifecycle e2e or approvals',
  ],
];

await wb.comments.setSelf({ displayName: 'User' });
wb.comments.addThread(
  { cell: wbs.getRange(`S${targetRow}`) },
  'Current evidence: Angular risk service resolves /api/v1/session before overview, validates subject/mode/account, requires overview account echo and reuses only that account for previews. Invalid or changed context clears evidence and remains locked. Provider normalization, trading mutation and authority remain absent.',
);

const after = await wb.inspect({
  kind: 'table',
  range: `WBS!A${targetRow}:S${targetRow}`,
  include: 'values,formulas',
  tableMaxRows: 3,
  tableMaxCols: 20,
});
console.log(after.ndjson);

const dashboardCheck = await wb.inspect({
  kind: 'table',
  range: 'Dashboard!A4:H14',
  include: 'values,formulas',
  tableMaxRows: 15,
  tableMaxCols: 10,
});
console.log(dashboardCheck.ndjson);

const errors = await wb.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'formula error scan after resumed WBS 7.6 server-review update',
});
console.log(errors.ndjson);

for (const [sheetName, range, fileName] of [
  ['WBS', `A${targetRow}:S${targetRow}`, 'wbs-7.6-server-review-after.png'],
  ['Dashboard', 'A1:H15', 'dashboard-after-7.6-server-review.png'],
  ['Codex Plan', 'A1:I15', 'codex-plan-after-7.6-server-review.png'],
]) {
  const preview = await wb.render({ sheetName, range, scale: 1.2, format: 'png' });
  await fs.writeFile(`${previewDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(workbookPath);
console.log(workbookPath);
