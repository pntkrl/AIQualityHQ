import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const footerPath = path.resolve('src/components/layout/Footer.astro');
const footerContent = fs.readFileSync(footerPath, 'utf8');

// Extract Set 1 of Marquee
const set1Match = footerContent.match(/<!-- Set 1 -->([\s\S]*?)<!-- Set 2/);
if (!set1Match) {
  console.error('Could not find Set 1 marquee block in Footer.astro');
  process.exit(1);
}

const set1Html = set1Match[1];

// Regex to capture badge anchors
// Each badge is inside <a ...> ... </a> or <div data-codemarket-widget ...>
const anchorRegex = /<a[\s\S]*?href="([^"]+)"[\s\S]*?>([\s\S]*?)<\/a>/g;

const badges = [];
let match;
let count = 0;

while ((match = anchorRegex.exec(set1Html)) !== null) {
  count++;
  const url = match[1];
  const innerHtml = match[2];
  
  // Extract img src and alt if present
  const imgMatch = innerHtml.match(/<img[\s\S]*?src="([^"]+)"[\s\S]*?alt="([^"]*)"/i) 
                || innerHtml.match(/<img[\s\S]*?alt="([^"]*)"[\s\S]*?src="([^"]+)"/i);
                
  let imgSrc = '';
  let altText = '';
  
  if (imgMatch) {
    if (imgMatch[1].startsWith('http')) {
      imgSrc = imgMatch[1];
      altText = imgMatch[2] || '';
    } else {
      altText = imgMatch[1] || '';
      imgSrc = imgMatch[2] || '';
    }
  }

  // Extract title if present
  const titleMatch = match[0].match(/title="([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract rel if present
  const relMatch = match[0].match(/rel="([^"]+)"/);
  const rel = relMatch ? relMatch[1] : '';

  // Infer Platform Name
  let platformName = '';
  if (altText) {
    platformName = altText.replace(/^Featured on\s+/i, '')
                          .replace(/^Listed on\s+/i, '')
                          .replace(/^Verified on\s+/i, '')
                          .replace(/^One of the\s+/i, '')
                          .replace(/\s+-.*$/, '');
  } else if (title) {
    platformName = title.replace(/^Featured on\s+/i, '')
                        .replace(/^Listed on\s+/i, '');
  } else {
    // Extract text inside span if present
    const textMatch = innerHtml.match(/<span[^>]*>([^<]+)<\/span>/g);
    if (textMatch) {
      platformName = textMatch.map(s => s.replace(/<[^>]+>/g, '').trim()).join(' ');
    } else {
      try {
        const parsedUrl = new URL(url);
        platformName = parsedUrl.hostname.replace('www.', '');
      } catch (e) {
        platformName = url;
      }
    }
  }

  badges.push({
    id: count,
    platform: platformName.trim(),
    targetUrl: url,
    badgeImageUrl: imgSrc || '(Custom SVG / HTML Badge)',
    altText: altText || title || platformName,
    relAttribute: rel || 'noopener'
  });
}

console.log(`Found ${badges.length} published badges in Footer.astro Set 1.`);

// Create Excel Workbook
const workbook = new ExcelJS.Workbook();
workbook.creator = 'AIQualityHQ';
workbook.lastModifiedBy = 'AIQualityHQ';
workbook.created = new Date();

const worksheet = workbook.addWorksheet('Published Badges', {
  pageSetup: { paperSize: 9, orientation: 'landscape' }
});

// Configure columns
worksheet.columns = [
  { header: 'S.No.', key: 'id', width: 8 },
  { header: 'Platform Name', key: 'platform', width: 30 },
  { header: 'Target Website URL', key: 'targetUrl', width: 55 },
  { header: 'Badge Image / SVG URL', key: 'badgeImageUrl', width: 65 },
  { header: 'Alt / Title Text', key: 'altText', width: 45 },
  { header: 'Rel Attribute', key: 'relAttribute', width: 25 }
];

// Style Header Row
const headerRow = worksheet.getRow(1);
headerRow.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFF' } };
headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: '0F172A' } // Sleek dark slate #0f172a
};
headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
headerRow.height = 28;

// Add Data Rows
badges.forEach((b) => {
  const row = worksheet.addRow(b);
  row.height = 22;
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  
  // Format cells
  row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Add hyperlinks
  if (b.targetUrl.startsWith('http')) {
    row.getCell(3).value = {
      text: b.targetUrl,
      hyperlink: b.targetUrl
    };
    row.getCell(3).font = { color: { argb: '2563EB' }, underline: true };
  }
  
  if (b.badgeImageUrl.startsWith('http')) {
    row.getCell(4).value = {
      text: b.badgeImageUrl,
      hyperlink: b.badgeImageUrl
    };
    row.getCell(4).font = { color: { argb: '2563EB' }, underline: true };
  }
});

// Add borders to grid
worksheet.eachRow((row, rowNumber) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } }
    };
  });
});

const outputPath = path.resolve('AIQualityHQ_Published_Badges.xlsx');
await workbook.xlsx.writeFile(outputPath);
console.log(`Successfully generated Excel file at: ${outputPath}`);
