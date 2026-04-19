const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const { getFirestoreDb, isFirebaseEnabled } = require('./firebase');

const FILENAME = 'analytics.json';
const COLLECTION_NAME = 'siteAnalytics';
const DOC_ID = 'summary';
const VISITOR_COLLECTION = 'siteAnalyticsVisitors';
const HISTORY_LIMIT = 30;
const APP_TIME_ZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';

const DEFAULT_SUMMARY = {
  pageViews: 0,
  uniqueVisitors: 0,
  contactLeads: 0,
  orders: 0
};

const DEFAULT_STORE = {
  summary: DEFAULT_SUMMARY,
  pages: [],
  daily: [],
  visitors: [],
  updatedAt: null
};

const numberFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const EVENT_TO_METRIC = {
  contact_lead: 'contactLeads',
  order_created: 'orders'
};

const toSafeNumber = (value) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : 0;
};

const resolveDateKey = (value = new Date()) => {
  const parts = numberFormatter.formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const normalizePath = (rawPath = '/') => {
  let value = String(rawPath || '/').trim();

  if (!value) {
    return '/';
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname || '/';
    } catch (error) {
      value = '/';
    }
  }

  value = value.split('#')[0].split('?')[0].trim();

  if (!value) {
    return '/';
  }

  if (!value.startsWith('/')) {
    value = `/${value}`;
  }

  return value.toLowerCase().slice(0, 160);
};

const resolvePageLabel = (path) => {
  const safePath = normalizePath(path);
  const directLabels = {
    '/': 'Homepage',
    '/checkout': 'Checkout',
    '/admin': 'Admin',
    '/reset-password': 'Reset Password'
  };

  if (directLabels[safePath]) {
    return directLabels[safePath];
  }

  return safePath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ') || 'Homepage';
};

const sanitizeSummary = (summary = {}) => ({
  pageViews: toSafeNumber(summary.pageViews),
  uniqueVisitors: toSafeNumber(summary.uniqueVisitors),
  contactLeads: toSafeNumber(summary.contactLeads),
  orders: toSafeNumber(summary.orders)
});

const sanitizePage = (page = {}) => {
  const path = normalizePath(page.path);

  return {
    path,
    label: String(page.label || resolvePageLabel(path)).trim(),
    views: toSafeNumber(page.views)
  };
};

const sanitizeDaily = (entry = {}) => ({
  date: /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) ? String(entry.date) : resolveDateKey(),
  pageViews: toSafeNumber(entry.pageViews),
  uniqueVisitors: toSafeNumber(entry.uniqueVisitors),
  contactLeads: toSafeNumber(entry.contactLeads),
  orders: toSafeNumber(entry.orders)
});

const sanitizeVisitor = (visitor = {}) => ({
  id: String(visitor.id || '').trim(),
  firstSeenAt: visitor.firstSeenAt || null,
  lastSeenAt: visitor.lastSeenAt || null,
  visitCount: Math.max(1, toSafeNumber(visitor.visitCount || 1)),
  lastPath: normalizePath(visitor.lastPath || '/')
});

const sanitizeStore = (store = {}) => {
  const sanitized = {
    summary: sanitizeSummary(store.summary || DEFAULT_SUMMARY),
    pages: Array.isArray(store.pages) ? store.pages.map(sanitizePage) : [],
    daily: Array.isArray(store.daily) ? store.daily.map(sanitizeDaily) : [],
    visitors: Array.isArray(store.visitors)
      ? store.visitors.map(sanitizeVisitor).filter((visitor) => visitor.id)
      : [],
    updatedAt: store.updatedAt || null
  };

  sanitized.pages.sort((left, right) => right.views - left.views || left.path.localeCompare(right.path));
  sanitized.daily.sort((left, right) => left.date.localeCompare(right.date));
  sanitized.daily = sanitized.daily.slice(-HISTORY_LIMIT);
  sanitized.visitors.sort((left, right) => new Date(right.lastSeenAt || 0) - new Date(left.lastSeenAt || 0));

  return sanitized;
};

const createEmptyDailyEntry = (date) => ({
  date,
  pageViews: 0,
  uniqueVisitors: 0,
  contactLeads: 0,
  orders: 0
});

const ensureDailyEntry = (store, date) => {
  const existingEntry = store.daily.find((entry) => entry.date === date);

  if (existingEntry) {
    return existingEntry;
  }

  const createdEntry = createEmptyDailyEntry(date);
  store.daily.push(createdEntry);
  return createdEntry;
};

const ensurePageEntry = (store, path) => {
  const safePath = normalizePath(path);
  const existingPage = store.pages.find((entry) => entry.path === safePath);

  if (existingPage) {
    return existingPage;
  }

  const createdPage = {
    path: safePath,
    label: resolvePageLabel(safePath),
    views: 0
  };

  store.pages.push(createdPage);
  return createdPage;
};

const stripVisitors = (store) => {
  const sanitized = sanitizeStore(store);
  return {
    summary: sanitized.summary,
    pages: sanitized.pages,
    daily: sanitized.daily,
    updatedAt: sanitized.updatedAt
  };
};

const applyPageViewMutation = (store, payload) => {
  const safeStore = sanitizeStore(store);
  const timestamp = payload.timestamp || new Date().toISOString();
  const dateKey = resolveDateKey(timestamp);
  const path = normalizePath(payload.path || '/');
  const dailyEntry = ensureDailyEntry(safeStore, dateKey);
  const pageEntry = ensurePageEntry(safeStore, path);
  const visitorId = String(payload.visitorId || '').trim();

  safeStore.summary.pageViews += 1;
  dailyEntry.pageViews += 1;
  pageEntry.views += 1;

  if (visitorId) {
    const currentVisitor = safeStore.visitors.find((entry) => entry.id === visitorId);
    const lastSeenDate = currentVisitor?.lastSeenAt ? resolveDateKey(currentVisitor.lastSeenAt) : null;

    if (!currentVisitor) {
      safeStore.summary.uniqueVisitors += 1;
      dailyEntry.uniqueVisitors += 1;
      safeStore.visitors.push(
        sanitizeVisitor({
          id: visitorId,
          firstSeenAt: timestamp,
          lastSeenAt: timestamp,
          visitCount: 1,
          lastPath: path
        })
      );
    } else {
      if (lastSeenDate !== dateKey) {
        dailyEntry.uniqueVisitors += 1;
      }

      currentVisitor.lastSeenAt = timestamp;
      currentVisitor.lastPath = path;
      currentVisitor.visitCount = toSafeNumber(currentVisitor.visitCount) + 1;
    }
  }

  safeStore.updatedAt = timestamp;
  return sanitizeStore(safeStore);
};

const applyCounterEventMutation = (store, eventType, timestamp = new Date().toISOString()) => {
  const safeStore = sanitizeStore(store);
  const metric = EVENT_TO_METRIC[eventType];

  if (!metric) {
    return safeStore;
  }

  const dailyEntry = ensureDailyEntry(safeStore, resolveDateKey(timestamp));
  safeStore.summary[metric] += 1;
  dailyEntry[metric] += 1;
  safeStore.updatedAt = timestamp;

  return sanitizeStore(safeStore);
};

const readStore = async () => sanitizeStore(await readJsonFile(FILENAME, DEFAULT_STORE));

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, sanitizeStore(store));
};

const getAnalyticsSnapshot = async () => {
  if (isFirebaseEnabled()) {
    const db = getFirestoreDb();
    const snapshot = await db.collection(COLLECTION_NAME).doc(DOC_ID).get();

    if (!snapshot.exists) {
      return stripVisitors(DEFAULT_STORE);
    }

    return stripVisitors(snapshot.data());
  }

  return stripVisitors(await readStore());
};

const trackPageViewFirestore = async ({ visitorId, path, timestamp }) => {
  const db = getFirestoreDb();
  const summaryRef = db.collection(COLLECTION_NAME).doc(DOC_ID);
  const safeVisitorId = String(visitorId || '').trim();
  const visitorRef = safeVisitorId
    ? db.collection(VISITOR_COLLECTION).doc(safeVisitorId)
    : null;
  let nextSnapshot = stripVisitors(DEFAULT_STORE);

  await db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);
    const baseStore = sanitizeStore(summaryDoc.exists ? summaryDoc.data() : DEFAULT_STORE);

    if (!visitorRef) {
      const nextStore = applyPageViewMutation(baseStore, { visitorId: '', path, timestamp });
      nextSnapshot = stripVisitors(nextStore);
      transaction.set(summaryRef, nextSnapshot);
      return;
    }

    const visitorDoc = await transaction.get(visitorRef);
    const currentVisitor = visitorDoc.exists
      ? sanitizeVisitor({
        id: safeVisitorId,
        ...visitorDoc.data()
      })
      : null;
    const nextStore = applyPageViewMutation(
      {
        ...baseStore,
        visitors: currentVisitor ? [currentVisitor] : []
      },
      { visitorId: safeVisitorId, path, timestamp }
    );
    const nextVisitor = nextStore.visitors.find((entry) => entry.id === safeVisitorId);

    nextSnapshot = stripVisitors(nextStore);
    transaction.set(summaryRef, nextSnapshot);
    transaction.set(visitorRef, {
      firstSeenAt: nextVisitor?.firstSeenAt || timestamp,
      lastSeenAt: nextVisitor?.lastSeenAt || timestamp,
      visitCount: nextVisitor?.visitCount || 1,
      lastPath: nextVisitor?.lastPath || normalizePath(path),
      updatedAt: timestamp
    });
  });

  return nextSnapshot;
};

const trackCounterEventFirestore = async (eventType, timestamp) => {
  const db = getFirestoreDb();
  const summaryRef = db.collection(COLLECTION_NAME).doc(DOC_ID);
  let nextSnapshot = stripVisitors(DEFAULT_STORE);

  await db.runTransaction(async (transaction) => {
    const summaryDoc = await transaction.get(summaryRef);
    const nextStore = applyCounterEventMutation(
      summaryDoc.exists ? summaryDoc.data() : DEFAULT_STORE,
      eventType,
      timestamp
    );

    nextSnapshot = stripVisitors(nextStore);
    transaction.set(summaryRef, nextSnapshot);
  });

  return nextSnapshot;
};

const trackAnalyticsEvent = async ({ eventType, visitorId = '', path = '/', timestamp = new Date().toISOString() }) => {
  const safeEventType = String(eventType || '').trim().toLowerCase();

  if (safeEventType === 'page_view') {
    if (isFirebaseEnabled()) {
      return trackPageViewFirestore({ visitorId, path, timestamp });
    }

    return runSerialized(FILENAME, async () => {
      const currentStore = await readStore();
      const nextStore = applyPageViewMutation(currentStore, { visitorId, path, timestamp });
      await writeStore(nextStore);
      return stripVisitors(nextStore);
    });
  }

  if (!EVENT_TO_METRIC[safeEventType]) {
    return getAnalyticsSnapshot();
  }

  if (isFirebaseEnabled()) {
    return trackCounterEventFirestore(safeEventType, timestamp);
  }

  return runSerialized(FILENAME, async () => {
    const currentStore = await readStore();
    const nextStore = applyCounterEventMutation(currentStore, safeEventType, timestamp);
    await writeStore(nextStore);
    return stripVisitors(nextStore);
  });
};

const recordContactLead = async (payload = {}) =>
  trackAnalyticsEvent({
    eventType: 'contact_lead',
    path: payload.path || '/',
    timestamp: payload.timestamp
  });

const recordOrderCreated = async (payload = {}) =>
  trackAnalyticsEvent({
    eventType: 'order_created',
    path: payload.path || '/checkout',
    timestamp: payload.timestamp
  });

module.exports = {
  getAnalyticsSnapshot,
  recordContactLead,
  recordOrderCreated,
  trackAnalyticsEvent
};
