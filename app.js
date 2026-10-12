(function () {
  'use strict';

  const P = window.Pantry;
  const STORE_KEY = 'ke-du-phong.v1';
  const TOAST_MS = 6000;
  const TABS = [
    { id: 'shelf', label: 'Kệ' },
    { id: 'buy', label: 'Cần mua' },
    { id: 'soon', label: 'Ăn trước' },
    { id: 'settings', label: 'Cài đặt' },
  ];

  const $ = (selector) => document.querySelector(selector);
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  const fmt = (n) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const fmtDate = (iso) => iso.split('-').reverse().join('/');
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const findItem = (id) => state.items.find((item) => item.id === id);

  let state = load();
  let tab = 'shelf';
  let undoSnapshot = null;
  let toastTimer = 0;
  let lotTarget = null;
  let itemTarget = null;
  const openLots = new Set();

  function defaultState() {
    return P.normalize({ items: window.PANTRY_SEED });
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return P.normalize(JSON.parse(saved));
    } catch (err) {
      console.warn('Không đọc được dữ liệu đã lưu, dùng danh mục mẫu.', err);
    }
    return defaultState();
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('Trình duyệt không cho lưu. Hãy sao lưu ra tệp trong Cài đặt.');
    }
  }

  // Mọi thay đổi dữ liệu đi qua đây để luôn lưu, vẽ lại và hoàn tác được.
  function commit(message, change) {
    undoSnapshot = JSON.stringify(state);
    change();
    save();
    render();
    toast(message, true);
  }

  function toast(message, canUndo) {
    $('#toastText').textContent = message;
    $('#toast [data-act="undo"]').hidden = !canUndo;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, TOAST_MS);
  }

  function dueLabel(days) {
    if (days < 0) return `quá hạn ${-days} ngày`;
    if (days === 0) return 'hết hạn hôm nay';
    return `còn ${days} ngày`;
  }

  function lotLine(item, lot, today) {
    const days = lot.exp == null ? null : P.daysUntil(lot.exp, today);
    const cls = days == null ? '' : days < 0 ? 'short' : days <= state.settings.warnDays ? 'low' : '';
    const when = lot.exp == null ? 'không ghi hạn' : `HSD ${fmtDate(lot.exp)}, ${dueLabel(days)}`;
    return `<li>
      <span><b>${fmt(lot.qty)} ${esc(item.unit)}</b> <span class="${cls}">${when}</span></span>
      <button type="button" class="link" data-act="lot-remove" data-id="${esc(item.id)}" data-lot="${esc(lot.id)}">Bỏ lô</button>
    </li>`;
  }

  function itemCard(item, today) {
    const min = P.minOf(item, state.settings);
    const stock = P.stockOf(item, today);
    const cover = P.coverDays(item, state.settings, today);
    const level = stock >= min ? 'ok' : stock >= min / 2 ? 'low' : 'short';
    const pct = min > 0 ? Math.min(100, (stock / min) * 100) : 100;
    const id = esc(item.id);
    const unit = esc(item.unit);
    const use = Math.min(item.step, stock);

    const badges = [];
    if (stock < min) badges.push(`<span class="badge ${level}">Thiếu ${fmt(P.round(min - stock))} ${unit}</span>`);
    const due = item.lots.filter((lot) => lot.exp != null && P.daysUntil(lot.exp, today) <= state.settings.warnDays);
    const expired = due.filter((lot) => P.isExpired(lot, today)).length;
    if (expired) badges.push(`<span class="badge short">${expired} lô quá hạn</span>`);
    if (due.length > expired) badges.push(`<span class="badge low">${due.length - expired} lô sắp hết hạn</span>`);

    const isOpen = openLots.has(item.id);
    const lotsToggle = item.lots.length
      ? `<button type="button" class="link" data-act="lots" data-id="${id}" aria-expanded="${isOpen}">${item.lots.length} lô ${isOpen ? '▴' : '▾'}</button>`
      : '';

    return `<article class="item ${level}">
      <button type="button" class="item-head" data-act="edit" data-id="${id}" title="Sửa món">
        <span class="name">${esc(item.name)}</span>
        ${item.note ? `<span class="note">${esc(item.note)}</span>` : ''}
      </button>
      <div class="meter" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <div class="item-row">
        <p class="qty"><b>${fmt(stock)}</b> / ${fmt(min)} ${unit}${cover == null || stock <= 0 ? '' : `<span class="cover">đủ khoảng ${fmt(Math.floor(cover))} ngày</span>`}</p>
        <div class="actions">
          <button type="button" class="btn" data-act="use" data-id="${id}" ${stock > 0 ? '' : 'disabled'} aria-label="Lấy ra ${fmt(use)} ${unit}">− ${fmt(use || item.step)}</button>
          <button type="button" class="btn primary" data-act="add" data-id="${id}">+ Nhập</button>
        </div>
      </div>
      ${badges.length || lotsToggle ? `<div class="item-foot">${badges.join('')}<span class="spacer"></span>${lotsToggle}</div>` : ''}
      ${isOpen && item.lots.length ? `<ul class="lots">${item.lots.map((lot) => lotLine(item, lot, today)).join('')}</ul>` : ''}
    </article>`;
  }

  function viewShelf(today) {
    const groups = new Map();
    for (const item of state.items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    }
    let html = '';
    for (const [category, items] of groups) {
      html += `<section class="group"><h2>${esc(category)}</h2>${items.map((item) => itemCard(item, today)).join('')}</section>`;
    }
    return `${html}<button type="button" class="btn wide" data-act="new">+ Thêm món</button>`;
  }

  function viewBuy(today) {
    const list = P.shoppingList(state, today);
    if (!list.length) return '<p class="empty">Kệ đang đủ mức tối thiểu, chưa cần mua gì.</p>';
    const rows = list.map(({ item, need }) => `<li>
      <span><b>${esc(item.name)}</b><span class="sub">${fmt(need)} ${esc(item.unit)}</span></span>
      <button type="button" class="btn primary" data-act="add" data-id="${esc(item.id)}">Đã mua</button>
    </li>`);
    return `<p class="lead">Mua bù những món này để kệ về lại mức tối thiểu.</p>
      <ul class="list">${rows.join('')}</ul>
      <button type="button" class="btn wide" data-act="copy">Sao chép danh sách</button>`;
  }

  function viewSoon(today) {
    const due = P.eatFirst(state, today);
    if (!due.length) {
      return `<p class="empty">Không có lô nào hết hạn trong ${state.settings.warnDays} ngày tới.</p>`;
    }
    const rows = due.map(({ item, lot, days }) => `<li>
      <span><b>${esc(item.name)}</b><span class="sub">${fmt(lot.qty)} ${esc(item.unit)}, HSD ${fmtDate(lot.exp)}</span></span>
      <span class="badge ${days < 0 ? 'short' : 'low'}">${dueLabel(days)}</span>
      <button type="button" class="btn" data-act="lot-remove" data-id="${esc(item.id)}" data-lot="${esc(lot.id)}">${days < 0 ? 'Bỏ đi' : 'Đã ăn hết'}</button>
    </li>`);
    return `<p class="lead">Đem những lô này ra nấu trước, rồi mua lô mới thế vào.</p>
      <ul class="list">${rows.join('')}</ul>`;
  }

  function viewSettings() {
    const { people, days, warnDays } = state.settings;
    return `<section class="group">
        <h2>Quy mô kệ</h2>
        <div class="panel">
          <label>Số người ăn
            <input type="number" min="1" step="1" inputmode="numeric" data-setting="people" value="${people}">
          </label>
          <label>Số ngày cần đủ ăn
            <input type="number" min="1" step="1" inputmode="numeric" data-setting="days" value="${days}">
          </label>
          <label>Báo trước khi hết hạn (ngày)
            <input type="number" min="0" step="1" inputmode="numeric" data-setting="warnDays" value="${warnDays}">
          </label>
          <small>Đổi số người hoặc số ngày thì mức tối thiểu của các món tự tính lại, trừ món đã đặt mức cố định.</small>
        </div>
      </section>
      <section class="group">
        <h2>Dữ liệu</h2>
        <div class="panel">
          <small>Dữ liệu chỉ nằm trong trình duyệt của máy này. Sao lưu ra tệp để chuyển sang máy khác hoặc phòng khi xoá dữ liệu trình duyệt.</small>
          <button type="button" class="btn" data-act="export">Sao lưu ra tệp</button>
          <button type="button" class="btn" data-act="import">Khôi phục từ tệp</button>
          <button type="button" class="btn danger" data-act="reset">Đặt lại về danh mục mẫu</button>
        </div>
      </section>`;
  }

  function render() {
    const today = P.isoDate(new Date());
    const total = state.items.length;
    const counts = { buy: P.shoppingList(state, today).length, soon: P.eatFirst(state, today).length };
    const enough = total - counts.buy;

    $('#scope').textContent = `${fmt(state.settings.people)} người, ${fmt(state.settings.days)} ngày`;
    $('#overallBar').style.width = `${total ? (enough / total) * 100 : 0}%`;
    $('#overallText').textContent = `${enough} trên ${total} món đang đủ mức tối thiểu`;
    $('#tabs').innerHTML = TABS.map(({ id, label }) => `<button type="button" data-act="tab" data-tab="${id}" ${id === tab ? 'aria-current="page"' : ''}>${label}${counts[id] ? `<span class="count">${counts[id]}</span>` : ''}</button>`).join('');

    const views = { shelf: viewShelf, buy: viewBuy, soon: viewSoon, settings: viewSettings };
    $('#view').innerHTML = views[tab](today);
  }

  function openLotDialog(item) {
    const today = P.isoDate(new Date());
    const need = P.round(P.minOf(item, state.settings) - P.stockOf(item, today));
    const dialog = $('#lotDialog');
    const form = dialog.querySelector('form');
    lotTarget = item.id;
    form.reset();
    dialog.querySelector('h2').textContent = `Nhập ${item.name}`;
    dialog.querySelector('[data-unit]').textContent = item.unit;
    form.elements.qty.value = need > 0 ? need : item.step;
    dialog.returnValue = '';
    dialog.showModal();
  }

  function openItemDialog(item) {
    const dialog = $('#itemDialog');
    const form = dialog.querySelector('form');
    const fields = form.elements;
    itemTarget = item ? item.id : null;
    form.reset();
    dialog.querySelector('h2').textContent = item ? 'Sửa món' : 'Thêm món';
    dialog.querySelector('[data-delete]').hidden = !item;
    $('#categoryList').innerHTML = [...new Set(state.items.map((it) => it.category))]
      .map((category) => `<option value="${esc(category)}">`).join('');
    if (item) {
      fields.name.value = item.name;
      fields.category.value = item.category;
      fields.unit.value = item.unit;
      fields.rate.value = item.rate;
      fields.step.value = item.step;
      fields.minOverride.value = item.minOverride == null ? '' : item.minOverride;
      fields.note.value = item.note;
    } else {
      fields.step.value = 1;
    }
    dialog.returnValue = '';
    dialog.showModal();
  }

  $('#lotDialog').addEventListener('close', (event) => {
    const dialog = event.target;
    const item = findItem(lotTarget);
    if (dialog.returnValue !== 'ok' || !item) return;
    const fields = dialog.querySelector('form').elements;
    const qty = Number(fields.qty.value);
    if (!(qty > 0)) return;
    commit(`Đã nhập ${fmt(qty)} ${item.unit} ${item.name}`, () => {
      P.addLot(item, qty, fields.exp.value, newId());
    });
  });

  $('#itemDialog').addEventListener('close', (event) => {
    const dialog = event.target;
    const item = findItem(itemTarget);
    if (dialog.returnValue === 'delete' && item) {
      commit(`Đã xoá ${item.name}`, () => {
        state.items = state.items.filter((it) => it !== item);
      });
      return;
    }
    if (dialog.returnValue !== 'ok') return;
    const fields = dialog.querySelector('form').elements;
    const name = fields.name.value.trim();
    if (!name) return;
    const draft = {
      id: item ? item.id : newId(),
      name,
      category: fields.category.value.trim(),
      unit: fields.unit.value.trim(),
      note: fields.note.value.trim(),
      rate: fields.rate.value,
      step: fields.step.value,
      minOverride: fields.minOverride.value,
      lots: item ? item.lots : [],
    };
    commit(item ? `Đã lưu ${name}` : `Đã thêm ${name}`, () => {
      const [clean] = P.normalize({ items: [draft] }).items;
      if (item) state.items[state.items.indexOf(item)] = clean;
      else state.items.push(clean);
    });
  });

  async function copyShoppingList() {
    const today = P.isoDate(new Date());
    const lines = P.shoppingList(state, today).map(({ item, need }) => `- ${item.name}: ${fmt(need)} ${item.unit}`);
    const text = `Cần mua cho kệ dự phòng:\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('Đã sao chép danh sách cần mua');
    } catch (err) {
      window.prompt('Sao chép danh sách bên dưới:', text);
    }
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ke-du-phong-${P.isoDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  $('#importFile').addEventListener('change', async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.items)) throw new Error('Thiếu danh sách items');
      commit('Đã khôi phục dữ liệu từ tệp', () => { state = P.normalize(data); });
    } catch (err) {
      toast('Tệp không đúng định dạng sao lưu của kệ dự phòng.');
    }
  });

  const actions = {
    tab(el) {
      tab = el.dataset.tab;
      render();
      window.scrollTo(0, 0);
    },
    use(el) {
      const item = findItem(el.dataset.id);
      const today = P.isoDate(new Date());
      const used = Math.min(item.step, P.stockOf(item, today));
      if (!(used > 0)) return;
      commit(`Đã lấy ${fmt(used)} ${item.unit} ${item.name}`, () => P.consume(item, used, today));
    },
    add(el) {
      openLotDialog(findItem(el.dataset.id));
    },
    edit(el) {
      openItemDialog(findItem(el.dataset.id));
    },
    new() {
      openItemDialog(null);
    },
    lots(el) {
      const id = el.dataset.id;
      if (!openLots.delete(id)) openLots.add(id);
      render();
    },
    'lot-remove'(el) {
      const item = findItem(el.dataset.id);
      commit(`Đã bỏ một lô ${item.name}`, () => P.removeLot(item, el.dataset.lot));
    },
    copy: copyShoppingList,
    export: exportBackup,
    import() {
      $('#importFile').click();
    },
    reset() {
      if (!window.confirm('Xoá toàn bộ tồn kho và các món đã sửa, quay về danh mục mẫu?')) return;
      commit('Đã đặt lại về danh mục mẫu', () => { state = defaultState(); });
    },
    undo() {
      if (!undoSnapshot) return;
      state = P.normalize(JSON.parse(undoSnapshot));
      undoSnapshot = null;
      save();
      render();
      toast('Đã hoàn tác');
    },
  };

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-act]');
    if (el && actions[el.dataset.act]) actions[el.dataset.act](el);
  });

  document.addEventListener('change', (event) => {
    const key = event.target.dataset.setting;
    if (!key) return;
    const value = Math.floor(Number(event.target.value));
    const floor = key === 'warnDays' ? 0 : 1;
    if (!Number.isFinite(value) || value < floor) {
      render();
      return;
    }
    commit('Đã cập nhật cài đặt', () => { state.settings[key] = value; });
  });

  render();
})();
