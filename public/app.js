const domainInput = document.getElementById('domain-input');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsTable = document.getElementById('results-table').querySelector('tbody');
const detailPanels = document.getElementById('detail-panels');
const datasetCount = document.getElementById('dataset-count');
const datasetStatus = document.getElementById('dataset-status');

const domainRecords = window.__DOMAIN_DATA__ || [];

const parseDomainList = (raw) =>
  raw
    .split(/\n/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const renderDetailPanel = (keyword, type, matches) => {
  const panel = document.createElement('div');
  panel.className = 'detail-panel';

  const title = document.createElement('h3');
  title.textContent = `${type} matches for "${keyword}" (${matches.length})`;
  panel.appendChild(title);

  if (matches.length === 0) {
    const note = document.createElement('p');
    note.textContent = 'No domains from the CSV matched this category.';
    panel.appendChild(note);
  } else {
    const list = document.createElement('ul');
    matches.forEach((domain) => {
      const item = document.createElement('li');
      item.textContent = domain;
      list.appendChild(item);
    });
    panel.appendChild(list);
  }

  detailPanels.appendChild(panel);
  panel.scrollIntoView({ behavior: 'smooth' });
};

const createCountButton = (count, keyword, type, matches) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = count;
  button.disabled = count === 0;
  button.addEventListener('click', () => renderDetailPanel(keyword, type, matches));
  return button;
};

const createStatusPanel = (title, message) => {
  const panel = document.createElement('div');
  panel.className = 'detail-panel';

  const heading = document.createElement('h3');
  heading.textContent = title;
  panel.appendChild(heading);

  const text = document.createElement('p');
  text.textContent = message;
  panel.appendChild(text);

  detailPanels.appendChild(panel);
  panel.scrollIntoView({ behavior: 'smooth' });
  return panel;
};

const appendDatasetWarning = () => {
  if (document.getElementById('dataset-warning')) {
    return;
  }

  const panel = createStatusPanel(
    'Dataset unavailable',
    'The CSV data could not be loaded. Start the server and refresh to try again.'
  );
  panel.id = 'dataset-warning';
};

const appendDatasetErrorPanel = (message) => {
  if (document.getElementById('dataset-error')) {
    return;
  }

  const panel = createStatusPanel('Failed to load dataset', message);
  panel.id = 'dataset-error';
};

const setDatasetStatus = (message) => {
  datasetStatus.textContent = message || '';
};

const analyze = () => {
  const keywords = parseDomainList(domainInput.value);
  resultsTable.innerHTML = '';

  if (keywords.length === 0) {
    return;
  }

  if (domainRecords.length === 0) {
    appendDatasetWarning();
    return;
  }

  keywords.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    const prefixMatches = [];
    const suffixMatches = [];
    const exactMatches = [];

    domainRecords.forEach((record) => {
      const normalized = record.label;
      if (normalized.startsWith(lowerKeyword)) {
        prefixMatches.push(record.domain);
      } else if (normalized.endsWith(lowerKeyword)) {
        suffixMatches.push(record.domain);
      } else if (normalized.includes(lowerKeyword)) {
        exactMatches.push(record.domain);
      }
    });

    const row = document.createElement('tr');
    const keywordCell = document.createElement('td');
    keywordCell.textContent = keyword;

    const prefixCell = document.createElement('td');
    prefixCell.appendChild(createCountButton(prefixMatches.length, keyword, 'Prefix', prefixMatches));

    const suffixCell = document.createElement('td');
    suffixCell.appendChild(createCountButton(suffixMatches.length, keyword, 'Suffix', suffixMatches));

    const exactCell = document.createElement('td');
    exactCell.appendChild(createCountButton(exactMatches.length, keyword, 'Exact match', exactMatches));

    row.append(keywordCell, prefixCell, suffixCell, exactCell);
    resultsTable.appendChild(row);
  });
};

const datasetLoaded = domainRecords.length > 0;
datasetCount.textContent = domainRecords.length;
if (datasetLoaded) {
  setDatasetStatus('Dataset loaded from server.');
} else {
  setDatasetStatus('Dataset could not be loaded. Check server logs.');
  appendDatasetErrorPanel('No domain data was embedded.');
}

analyzeBtn.addEventListener('click', analyze);
