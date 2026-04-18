const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('/tmp/gadkari.html', 'utf8');
const $ = cheerio.load(html);

// Find ITR table by id or by content
let itrTable = $('table#income_tax');
if (!itrTable.length) {
  $('table').each((i, t) => {
    if ($(t).text().includes('Total Income Shown in ITR')) {
      itrTable = $(t);
      return false;
    }
  });
}

console.log('Found table:', itrTable.length > 0);

const itrData = {};

itrTable.find('tr').each((i, row) => {
  const cells = $(row).find('td');
  if (cells.length < 4) return;

  const relation = $(cells[0]).text().trim().toLowerCase();
  const incomeCell = $(cells[3]);
  const cellHtml = incomeCell.html() || '';

  // Split by <br> and parse each year-income pair
  const entries = cellHtml.split(/<br\s*\/?>/gi);
  entries.forEach(entry => {
    const yearMatch = entry.match(/(\d{4})\s*-\s*(\d{4})/);
    const amountMatch = entry.match(/Rs\s*([\d,]+)/i);
    if (yearMatch && amountMatch) {
      const fy = yearMatch[1] + '-' + yearMatch[2];
      const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
      if (!itrData[fy]) itrData[fy] = { self: 0, spouse: 0, huf: 0, total: 0 };
      if (relation === 'self') itrData[fy].self = amount;
      else if (relation === 'spouse') itrData[fy].spouse = amount;
      else if (relation === 'huf') itrData[fy].huf = amount;
      if (amount > 0) itrData[fy].total += amount;
    }
  });
});

// Sort by year and output
const sorted = Object.entries(itrData).sort((a, b) => a[0].localeCompare(b[0]));
for (const [fy, data] of sorted) {
  console.log(`FY ${fy}: self=${data.self} spouse=${data.spouse} huf=${data.huf} total=${data.total}`);
}
