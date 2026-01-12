const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';
const publicDir = path.join(__dirname, 'public');

const csvPath = path.join(__dirname, 'unreported_sales.csv');
let cachedDomains = null;

const extractDomainField = (line) => {
  const targetIndex = 1;
  let field = '';
  let currentIndex = 0;
  let inQuotes = false;

  for (let i = 0; i <= line.length; i += 1) {
    const char = line[i];
    const atEnd = i === line.length;

    if (!atEnd && char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    const isDelimiter = char === ',' && !inQuotes;
    if (atEnd || isDelimiter) {
      if (currentIndex === targetIndex) {
        return field;
      }
      currentIndex += 1;
      field = '';
      continue;
    }

    if (!atEnd) {
      field += char;
    }
  }

  return null;
};

const stripTld = (domain) => {
  const trimmed = domain.trim();
  if (!trimmed) return '';
  const firstDot = trimmed.indexOf('.');
  return firstDot === -1 ? trimmed.toLowerCase() : trimmed.substring(0, firstDot).toLowerCase();
};

const loadDomainsFromCsv = () => {
  if (cachedDomains) {
    return cachedDomains;
  }

  if (!fs.existsSync(csvPath)) {
    cachedDomains = [];
    return cachedDomains;
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.shift(); // remove header

  cachedDomains = lines
    .map((line) => extractDomainField(line))
    .filter(Boolean)
    .map((domain) => ({
      label: stripTld(domain),
      domain: domain.trim(),
    }));

  return cachedDomains;
};

const domainDataset = loadDomainsFromCsv();

app.get('/domain-data.js', (req, res) => {
  try {
    res.type('application/javascript');
    res.send(`window.__DOMAIN_DATA__ = ${JSON.stringify(domainDataset)};`);
  } catch (error) {
    console.error('Failed to serialize dataset:', error);
    res.status(500).send('window.__DOMAIN_DATA__ = [];');
  }
});

app.use(express.static(publicDir));

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`Domain analyzer running at http://${host}:${port}`);
});
