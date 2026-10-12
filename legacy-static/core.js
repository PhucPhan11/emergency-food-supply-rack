// Logic thuần của kệ dự phòng: định mức, tồn kho, hạn dùng. Không đụng tới DOM.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Pantry = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAY_MS = 86400000;
  const round = (n) => Math.round(n * 1000) / 1000;

  function isoDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function daysUntil(exp, today) {
    return Math.round((Date.parse(exp) - Date.parse(today)) / DAY_MS);
  }

  // Hàng còn dùng được đến hết ngày ghi trên bao bì.
  function isExpired(lot, today) {
    return lot.exp != null && daysUntil(lot.exp, today) < 0;
  }

  function minOf(item, settings) {
    if (item.minOverride != null) return item.minOverride;
    const raw = item.rate * settings.people * settings.days;
    return round(Math.ceil(raw / item.step - 1e-9) * item.step);
  }

  // Lô đã hết hạn không được tính vào tồn kho.
  function stockOf(item, today) {
    return round(item.lots.reduce((sum, lot) => (isExpired(lot, today) ? sum : sum + lot.qty), 0));
  }

  function coverDays(item, settings, today) {
    const perDay = item.rate * settings.people;
    return perDay > 0 ? stockOf(item, today) / perDay : null;
  }

  function addLot(item, qty, exp, id) {
    item.lots.push({ id, qty: round(qty), exp: exp || null });
  }

  // Lấy ra theo thứ tự hết hạn sớm nhất trước; lô không ghi hạn lấy sau cùng.
  function consume(item, qty, today) {
    const order = item.lots
      .filter((lot) => !isExpired(lot, today))
      .sort((a, b) => (a.exp || '9999-12-31').localeCompare(b.exp || '9999-12-31'));
    let left = qty;
    for (const lot of order) {
      if (left <= 0) break;
      const take = Math.min(lot.qty, left);
      lot.qty = round(lot.qty - take);
      left = round(left - take);
    }
    item.lots = item.lots.filter((lot) => lot.qty > 0);
    return round(qty - left);
  }

  function removeLot(item, lotId) {
    item.lots = item.lots.filter((lot) => lot.id !== lotId);
  }

  function shoppingList(state, today) {
    const list = [];
    for (const item of state.items) {
      const need = round(minOf(item, state.settings) - stockOf(item, today));
      if (need > 0) list.push({ item, need });
    }
    return list;
  }

  // Các lô đã hết hạn hoặc sẽ hết hạn trong warnDays ngày, gần hạn nhất đứng đầu.
  function eatFirst(state, today) {
    const due = [];
    for (const item of state.items) {
      for (const lot of item.lots) {
        if (lot.exp == null) continue;
        const days = daysUntil(lot.exp, today);
        if (days <= state.settings.warnDays) due.push({ item, lot, days });
      }
    }
    return due.sort((a, b) => a.days - b.days);
  }

  function normalize(raw) {
    const num = (value, fallback, min) => {
      const n = Number(value);
      return value !== null && value !== '' && Number.isFinite(n) && n >= min ? n : fallback;
    };
    const settings = (raw && raw.settings) || {};
    const items = raw && Array.isArray(raw.items) ? raw.items : [];
    return {
      version: 1,
      settings: {
        people: num(settings.people, 4, 1),
        days: num(settings.days, 14, 1),
        warnDays: num(settings.warnDays, 30, 0),
      },
      items: items.map((item, i) => ({
        id: String(item.id || `item-${i}`),
        name: String(item.name || 'Món chưa đặt tên'),
        category: String(item.category || 'Khác'),
        unit: String(item.unit || 'cái'),
        note: String(item.note || ''),
        rate: num(item.rate, 0, 0),
        step: num(item.step, 1, 0.001),
        minOverride: num(item.minOverride, null, 0),
        lots: (Array.isArray(item.lots) ? item.lots : [])
          .filter((lot) => Number(lot.qty) > 0)
          .map((lot, j) => ({
            id: String(lot.id || `lot-${i}-${j}`),
            qty: round(Number(lot.qty)),
            exp: /^\d{4}-\d{2}-\d{2}$/.test(lot.exp) ? lot.exp : null,
          })),
      })),
    };
  }

  return {
    round, isoDate, daysUntil, isExpired, minOf, stockOf, coverDays,
    addLot, consume, removeLot, shoppingList, eatFirst, normalize,
  };
});
