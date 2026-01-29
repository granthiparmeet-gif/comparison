const domainInput = document.getElementById('domain-input');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsTable = document.getElementById('results-table').querySelector('tbody');
const detailPanels = document.getElementById('detail-panels');
const datasetCount = document.getElementById('dataset-count');
const datasetStatus = document.getElementById('dataset-status');

const domainRecords = window.__DOMAIN_DATA__ || [];
const sortButtons = document.querySelectorAll('.sort-button');

let keywordResults = [];
let activeSort = { type: null, order: null };

const parsePriceValue = (priceString) => {
  if (!priceString) return 0;
  const normalized = priceString.replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPriceForDisplay = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const parseDomainList = (raw) =>
  raw
    .split(/\n/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const createCountButton = (count, priceValue, keyword, type, matches) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = `${count} (${formatPriceForDisplay(priceValue)})`;
  button.disabled = count === 0;
  button.addEventListener('click', () => renderDetailRow(button.closest('tr'), keyword, type, matches));
  return button;
};

const renderDetailRow = (row, keyword, type, matches) => {
  if (!row) {
    return;
  }

  const nextRow = row.nextElementSibling;
  if (nextRow && nextRow.classList.contains('detail-row')) {
    if (nextRow.dataset.keyword === keyword && nextRow.dataset.detailType === type) {
      nextRow.remove();
      return;
    }
    nextRow.remove();
  }

  const detailRow = document.createElement('tr');
  detailRow.className = 'detail-row';
  detailRow.dataset.keyword = keyword;
  detailRow.dataset.detailType = type;

  const detailCell = document.createElement('td');
  detailCell.colSpan = 5;

  const panel = document.createElement('div');
  panel.className = 'detail-panel';

  const header = document.createElement('div');
  header.className = 'detail-panel__header';

  const typeLabel = document.createElement('span');
  typeLabel.className = 'detail-panel__type';
  typeLabel.textContent = type;

  const title = document.createElement('h3');
  title.textContent = `Matches for "${keyword}" (${matches.length})`;

  const titleGroup = document.createElement('div');
  titleGroup.className = 'detail-panel__title-group';
  titleGroup.append(typeLabel, title);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'detail-panel__close';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => detailRow.remove());

  header.append(titleGroup, closeButton);
  panel.appendChild(header);

  if (matches.length === 0) {
    const note = document.createElement('p');
    note.textContent = 'No domains from the CSV matched this category.';
    panel.appendChild(note);
  } else {
    const list = document.createElement('ul');
    matches.forEach((record) => {
      const item = document.createElement('li');

      const name = document.createElement('div');
      name.className = 'detail-panel__domain';
      name.textContent = record.domain || '—';

      const meta = document.createElement('div');
      meta.className = 'detail-panel__meta';
      const price = document.createElement('span');
      price.textContent = `Price: ${record.price || '—'}`;
      const date = document.createElement('span');
      date.textContent = `Date: ${record.date || '—'}`;
      const venue = document.createElement('span');
      venue.textContent = `Venue: ${record.venue || '—'}`;
      meta.append(price, date, venue);

      item.append(name, meta);
      list.appendChild(item);
    });
    panel.appendChild(list);
  }

  detailCell.appendChild(panel);
  detailRow.appendChild(detailCell);
  row.after(detailRow);
  detailRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const updateSortButtonStates = () => {
  sortButtons.forEach((button) => {
    const isActive = button.dataset.type === activeSort.type && button.dataset.order === activeSort.order;
    button.classList.toggle('active', isActive);
  });
};

const renderKeywordRows = () => {
  resultsTable.innerHTML = '';

  keywordResults.forEach((result) => {
    const row = document.createElement('tr');
    const keywordCell = document.createElement('td');
    keywordCell.textContent = result.keyword;

    const prefixCell = document.createElement('td');
    prefixCell.appendChild(
      createCountButton(result.prefixMatches.length, result.prefixTotal, result.keyword, 'Prefix', result.prefixMatches)
    );

    const suffixCell = document.createElement('td');
    suffixCell.appendChild(
      createCountButton(result.suffixMatches.length, result.suffixTotal, result.keyword, 'Suffix', result.suffixMatches)
    );

    const exactCell = document.createElement('td');
    exactCell.appendChild(
      createCountButton(result.exactMatches.length, result.exactTotal, result.keyword, 'Exact match', result.exactMatches)
    );

    const totalCell = document.createElement('td');
    totalCell.appendChild(
      createCountButton(result.totalCount, result.totalPrice, result.keyword, 'Total', result.totalMatches)
    );

    row.append(keywordCell, prefixCell, suffixCell, exactCell, totalCell);
    resultsTable.appendChild(row);
  });
};

const sortKeywordResults = (type, order) => {
  const direction = order === 'desc' ? -1 : 1;

  const getCount = (result) => {
    if (type === 'total') {
      return result.totalCount;
    }
    const matchKey = `${type}Matches`;
    return result[matchKey].length;
  };

  keywordResults.sort((a, b) => {
    const difference = getCount(a) - getCount(b);
    if (difference === 0) {
      return a.keyword.localeCompare(b.keyword);
    }
    return direction * difference;
  });

  activeSort = { type, order };
  updateSortButtonStates();
  renderKeywordRows();
};

sortButtons.forEach((button) => {
  button.addEventListener('click', () => sortKeywordResults(button.dataset.type, button.dataset.order));
});

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
    keywordResults = [];
    renderKeywordRows();
    return;
  }

  if (domainRecords.length === 0) {
    appendDatasetWarning();
    return;
  }

  keywordResults = keywords.map((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    const prefixMatches = [];
    let prefixTotal = 0;
    const suffixMatches = [];
    let suffixTotal = 0;
    const exactMatches = [];
    let exactTotal = 0;

    domainRecords.forEach((record) => {
      const priceValue = parsePriceValue(record.price);
      const normalized = record.label;
      if (normalized.startsWith(lowerKeyword)) {
        prefixMatches.push(record);
        prefixTotal += priceValue;
      } else if (normalized.endsWith(lowerKeyword)) {
        suffixMatches.push(record);
        suffixTotal += priceValue;
      } else if (normalized.includes(lowerKeyword)) {
        exactMatches.push(record);
        exactTotal += priceValue;
      }
    });

    const totalMatches = [...prefixMatches, ...suffixMatches, ...exactMatches];
    const totalCount = totalMatches.length;
    const totalPrice = prefixTotal + suffixTotal + exactTotal;

    return {
      keyword,
      prefixMatches,
      prefixTotal,
      suffixMatches,
      suffixTotal,
      exactMatches,
      exactTotal,
      totalCount,
      totalPrice,
      totalMatches,
    };
  });

  if (activeSort.type) {
    sortKeywordResults(activeSort.type, activeSort.order);
  } else {
    renderKeywordRows();
  }
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
