const express = require('express');
const { trackAnalyticsEvent } = require('../utils/analyticsStore');

const router = express.Router();
const ALLOWED_EVENTS = new Set(['page_view']);

router.post('/track', async (req, res) => {
  try {
    const eventType = String(req.body?.eventType || '').trim().toLowerCase();

    if (!ALLOWED_EVENTS.has(eventType)) {
      return res.status(400).json({ error: 'Tipe analytics tidak valid.' });
    }

    await trackAnalyticsEvent({
      eventType,
      visitorId: req.body?.visitorId,
      path: req.body?.path
    });

    res.status(202).json({
      message: 'Analytics diterima.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
