(() => {
  'use strict';

  // ---------- Configuration ----------
  const SLOT = 1200;   // 20 minutes in seconds
  const BATCH = 20;    // rows added per infinite-scroll load

  // EVENTS[minute] = the GATEs that can happen in that time slot (:00, :20, :40).
  //   name      GATE name (must match ALL_TYPES / TIMING / icon file name)
  //   weight    chance of this GATE relative to the others in the same slot
  //   variants  OPTIONAL. [{ name, weight }, ...] for this GATE in this slot only.
  //             Leave it out (or empty) when the GATE has no variants.
  // Order matters: the first draw picks the GATE by walking this list in order,
  // the second draw picks the variant by walking that GATE's variants in order.
  // Example (not active):
  //   { name: 'Air Force One', weight: 32, variants: [{ name: 'Variant A', weight: 1 }, { name: 'Variant B', weight: 3 }] },
  
  //notice variant weights do not add up to 100.
  //AFO Cieldalaes has 3 routes, I wasn't sure what to call them
  const AFO_CIELDALAES_VARIANTS = [
    { name: 'Cieldalaes: Sea Route', weight: 1},
    { name: 'Cieldalaes: Cave Route', weight: 1},
    { name: 'Cieldalaes: River Route', weight: 1}
  ];
  
  //AFO golden saucer also has 3 routes, and I just named them based on where you start
  const AFO_GS_VARIANTS = [
    { name: 'Event Square Route', weight: 1},
	{ name: 'Wonder Square Route', weight: 1},
	{ name: 'Round Square Route', weight : 1}
  ];
  
  const LEAP_VARIANTS = [
    { name: "The Fall of Belah'dia", weight: 9},
    { name: 'The Falling City of Nym', weight: 9},
    { name: 'Sylphstep', weight: 9}
  ];
  
  const CLIFFHANGER_VARIANTS = [
    { name: 'Round Square', weight: 7},
	{ name: 'Wonder Square East', weight : 7}
  ];
  
  //this is just a filler, Wind and Slice have no "variants" that I know of
  const WIND_SLICE_VARIANTS = [
    { name: 'Event Square', weight: 1}
  ]; 
  
  const EVENTS = {
    0: [
      { name: 'Air Force One', weight: 32 , variants: AFO_CIELDALAES_VARIANTS },
      { name: 'Cliffhanger',   weight: 33 , variants: CLIFFHANGER_VARIANTS },
      { name: 'Leap of Faith', weight: 35 , variants: LEAP_VARIANTS},
    ],
    20: [
      { name: 'Any Way the Wind Blows', weight: 45 , variants: WIND_SLICE_VARIANTS},
      { name: 'The Slice is Right',     weight: 33 , variants: WIND_SLICE_VARIANTS},
      { name: 'Air Force One',          weight: 22 , variants: AFO_GS_VARIANTS },
    ],
    40: [
      { name: 'The Slice is Right', weight: 12 , variants: WIND_SLICE_VARIANTS},
      { name: 'Leap of Faith',      weight: 13 , variants: LEAP_VARIANTS },
      { name: 'Air Force One',      weight: 75 , variants: AFO_CIELDALAES_VARIANTS },
    ],
  };

  const ALL_TYPES = [
    'Air Force One',
    'Cliffhanger',
    'Leap of Faith',
    'Any Way the Wind Blows',
    'The Slice is Right',
  ];

  // Icons: put 40x40 images in an /images folder named after the slug,
  // e.g. images/air-force-one.webp.
  const ICON_DIR = 'images/';
  const ICON_EXT = '.webp';
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  //standard xorshift128 implementation, except every state word initialized to 0,
  //and then time seed (ts) used as the seed (x).
  function xorshift128(ts) {
    let x = ts >>> 0, y = 0, z = 0, w = 0;
    return function next() {
      const t = (x ^ (x << 11)) >>> 0;
      x = y; y = z; z = w;
      w = (w ^ (w >>> 19) ^ t ^ (t >>> 8)) >>> 0;
      return w;
    };
  }

  // Picks an item from a list of { weight } objects using a raw draw.
  // The modulus is the sum of the weights, so weights don't need to add up to 100.
  function pickWeighted(items, draw) {
    let total = 0;
    for (const it of items) total += it.weight;
    const r = draw % total;
    let acc = 0;
    for (const it of items) {
      acc += it.weight;
      if (r < acc) return it;
    }
    return items[items.length - 1];
  }

  // Returns { name, variant } for the slot starting at slotStart.
  //   1st draw -> which GATE        (modulus = total weight of the GATEs in the slot)
  //   2nd draw -> which variant     (modulus = total weight of that GATE's variants)
  // variant is null when the chosen GATE has no variants.
  function getGate(slotStart) {
    // Slot start is a multiple of 1200s, so the UTC minute is 0, 20 or 40.
    const minutes = (Math.floor(slotStart / SLOT) % 3) * 20;
    const events = EVENTS[minutes];
    const next = xorshift128(slotStart);
    const gate = pickWeighted(events, next());
    let variant = null;
    if (gate.variants && gate.variants.length > 0) {
      variant = pickWeighted(gate.variants, next()).name;
    }
    return { name: gate.name, variant };
  }

  const slotOf = (nowSec) => Math.floor(nowSec / SLOT) * SLOT;

  // ---------- State ----------
  const STORAGE_KEY = 'gate-enabled-types';
  let enabled = loadEnabled();
  let nextSlot = 0;     // next slot start time not yet considered for the list
  let currentSlot = 0;

  function loadEnabled() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return new Set(saved.filter((n) => ALL_TYPES.includes(n)));
    } catch (e) { /* ignore */ }
    return new Set(ALL_TYPES);
  }
  function saveEnabled() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled])); } catch (e) { /* ignore */ }
  }

  // ---------- DOM ----------
  const $current = document.getElementById('current');
  const $list = document.getElementById('list');
  const $empty = document.getElementById('empty');
  const $sentinel = document.getElementById('sentinel');
  const $filterList = document.getElementById('filter-list');
  const $filters = document.getElementById('filters');

  const nowSec = () => Math.floor(Date.now() / 1000);

  // ---------- Formatting ----------
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  function formatStart(slotStart) {
    const d = new Date(slotStart * 1000);
    // Within the next 24 hours: time only. Beyond that: date + time.
    return slotStart - nowSec() < 86400 ? timeFmt.format(d) : dateTimeFmt.format(d);
  }

  function formatCountdown(sec) {
    sec = Math.max(0, sec);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ---------- Row building ----------
  function makeIcon(name) {
    const img = document.createElement('img');
    img.className = 'icon';
    img.width = 40;
    img.height = 40;
    img.alt = '';
    img.loading = 'lazy';
    img.src = ICON_DIR + slug(name) + ICON_EXT;
    img.addEventListener('error', () => { img.removeAttribute('src'); }); // keep the 40x40 placeholder box
    return img;
  }

  function makeRow(slotStart, name, tag, variant) {
    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(makeIcon(name));

    const info = document.createElement('div');
    info.className = 'info';
    if (tag) {
      const t = document.createElement('span');
      t.className = 'tag';
      t.textContent = tag;
      info.appendChild(t);
    }
    const n = document.createElement('div');
    n.className = 'name';
    n.textContent = name;
    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = formatStart(slotStart);
    info.appendChild(n);
    if (variant) {
      const v = document.createElement('div');
      v.className = 'variant';
      v.textContent = variant;
      info.appendChild(v);
    }
    info.appendChild(time);
    row.appendChild(info);
    return row;
  }

  // ---------- Current GATE ----------
  // Seconds a GATE can be entered, and then stays in progress, measured from its start.
  const TIMING = {
    'Air Force One':          { entry_period: 600, in_progress: 0 },
    'Cliffhanger':            { entry_period: 600, in_progress: 0 },
    'Leap of Faith':          { entry_period: 480, in_progress: 0 },
    'Any Way the Wind Blows': { entry_period: 120, in_progress: 75 },
    'The Slice is Right':     { entry_period: 120, in_progress: 270 },
  };
  const TAGS = { entry: 'Now – Entry open', progress: 'Now – In progress', coming: 'Coming up' };
  const COUNTDOWN_LABELS = { entry: 'entry closes in', progress: 'ends in', coming: 'starts in' };

  let pinned = null;

  // Decides which GATE is pinned and in what state:
  //   entry    -> GATE's entry period (counts down to its end)
  //   progress -> GATE in progress (counts down to its end)
  //   coming   -> after in-progress ends, the next GATE (counts down to its start)
  function computePinned(now) {
    const s = slotOf(now);
    const { name, variant } = getGate(s);
    const t = TIMING[name];
    const elapsed = now - s;
    if (elapsed < t.entry_period) {
      return { slot: s, name, variant, state: 'entry', end: s + t.entry_period };
    }
    if (elapsed < t.entry_period + t.in_progress) {
      return { slot: s, name, variant, state: 'progress', end: s + t.entry_period + t.in_progress };
    }
    const next = s + SLOT;
    const g = getGate(next);
    return { slot: next, name: g.name, variant: g.variant, state: 'coming', end: next };
  }
  function renderCurrent() {
    pinned = computePinned(nowSec());
    currentSlot = pinned.slot;
    const row = makeRow(pinned.slot, pinned.name, TAGS[pinned.state], pinned.variant);
    row.classList.add('state-' + pinned.state);
    const cd = document.createElement('div');
    cd.className = 'countdown';
    cd.id = 'countdown';
    row.appendChild(cd);
    $current.replaceChildren(row);
    updateCountdown();
  }

  function updateCountdown() {
    const el = document.getElementById('countdown');
    if (el) el.textContent = COUNTDOWN_LABELS[pinned.state] + ' ' + formatCountdown(pinned.end - nowSec());
  }

  // ---------- Upcoming list (infinite) ----------
  function loadMore(count = BATCH) {
    if (enabled.size === 0) return;
    let added = 0;
    const frag = document.createDocumentFragment();
    while (added < count) {
      const g = getGate(nextSlot);
      if (enabled.has(g.name)) {
        const li = document.createElement('li');
        li.dataset.time = nextSlot;
        li.appendChild(makeRow(nextSlot, g.name, null, g.variant));
        frag.appendChild(li);
        added++;
      }
      nextSlot += SLOT;
    }
    $list.appendChild(frag);
  }

  function resetList() {
    $list.replaceChildren();
    nextSlot = pinned.slot + SLOT;
    $empty.hidden = enabled.size > 0;
    loadMore(BATCH);
    // Make sure the viewport is filled so the observer keeps firing.
    fillViewport();
  }

  function fillViewport() {
    let guard = 0;
    while (enabled.size > 0 && $sentinel.getBoundingClientRect().top < window.innerHeight + 300 && guard++ < 50) {
      loadMore(BATCH);
    }
  }

  function refreshLabels() {
    $list.querySelectorAll('li').forEach((li) => {
      li.querySelector('.time').textContent = formatStart(Number(li.dataset.time));
    });
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) loadMore(BATCH);
  }, { rootMargin: '400px' });
  observer.observe($sentinel);

  // ---------- Notifications ----------
  // Works while the page is open (including in a background tab) and, once the
  // service worker is registered, shows through the OS notification system.
  const NOTIFY_KEY = 'gate-notify';
  const MAX_LATE = 90; // don't notify if the entry period started more than this many seconds ago
  const notifySupported = 'Notification' in window;
  let notifyOn = false;
  let swReg = null;
  let lastNotifiedSlot = 0;
  let permissionPending = false; // true while the browser's notification permission prompt is open

  try {
    notifyOn = notifySupported &&
      localStorage.getItem(NOTIFY_KEY) === '1' &&
      Notification.permission === 'granted';
  } catch (e) { /* ignore */ }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
  }

  // Called when a GATE's entry period begins. Skipped if the GATE is filtered out.
  function notifyEntry(p) {
    if (!notifyOn || !notifySupported || Notification.permission !== 'granted') return;
    if (!enabled.has(p.name)) return;
    if (p.slot === lastNotifiedSlot) return;
    if (nowSec() - p.slot > MAX_LATE) return;
    lastNotifiedSlot = p.slot;

    const mins = Math.round(TIMING[p.name].entry_period / 60);
    const title = p.name + ' – entry is open';
    const opts = {
      body: (p.variant ? p.variant + '. ' : '') + `You can enter for the next ${mins} min.`,
      icon: ICON_DIR + slug(p.name) + ICON_EXT,
      tag: 'gate-' + p.slot,
    };
    try {
      if (swReg) swReg.showNotification(title, opts); else new Notification(title, opts);
    } catch (e) { /* ignore */ }
  }

  function buildNotifyOption() {
    const divider = document.createElement('div');
    divider.className = 'divider';
    $filterList.appendChild(divider);

    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const note = document.createElement('div');
    note.className = 'note';

    if (!notifySupported) {
      cb.disabled = true;
      note.textContent = 'Notifications aren\'t supported in this browser. On iPhone/iPad, add this page to your Home Screen first.';
    } else {
      cb.checked = notifyOn;
      cb.addEventListener('change', async () => {
        note.textContent = '';
        if (cb.checked) {
          let perm = Notification.permission;
          if (perm === 'default') {
            permissionPending = true;
            try { perm = await Notification.requestPermission(); } finally { permissionPending = false; }
          }
          if (perm !== 'granted') {
            cb.checked = false;
            note.textContent = 'Notifications are blocked. Allow them in your browser\'s site settings.';
            return;
          }
          notifyOn = true;
        } else {
          notifyOn = false;
        }
        try { localStorage.setItem(NOTIFY_KEY, notifyOn ? '1' : '0'); } catch (e) { /* ignore */ }
      });
    }
    label.append(cb, document.createTextNode('Notify when entry opens'));
    $filterList.append(label, note);

    const link = document.createElement('a');
    link.className = 'options-link';
    link.href = 'https://github.com/rooroodev/ffxivgateschedule';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'help/github';
    $filterList.appendChild(link);
  }

  // ---------- Filters ----------
  function buildFilters() {
    ALL_TYPES.forEach((name) => {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = enabled.has(name);
      cb.addEventListener('change', () => {
        if (cb.checked) enabled.add(name); else enabled.delete(name);
        saveEnabled();
        renderCurrent();
        resetList();
      });
      label.append(cb, document.createTextNode(name));
      $filterList.appendChild(label);
    });
    buildNotifyOption();
  }

  document.addEventListener('click', (e) => {
    if (!$filters.contains(e.target)) $filters.open = false;
  });

  // Also close the Options menu when the window loses focus or the tab is hidden.
  // Skipped while the notification permission prompt is open, since that steals focus too.
  function closeMenuOnBlur() {
    if (!permissionPending) $filters.open = false;
  }
  window.addEventListener('blur', closeMenuOnBlur);
  document.addEventListener('visibilitychange', () => { if (document.hidden) closeMenuOnBlur(); });

  // ---------- Tick: detect slot changes ----------
  function tick() {
    const p = computePinned(nowSec());
    if (p.slot !== pinned.slot || p.state !== pinned.state) {
      const slotChanged = p.slot !== pinned.slot;
      renderCurrent();
      if (pinned.state === 'entry') notifyEntry(pinned);
      if (slotChanged) {
        // Pinned GATE moved forward: drop list rows that are now pinned or past, refresh labels.
        $list.querySelectorAll('li').forEach((li) => {
          if (Number(li.dataset.time) <= pinned.slot) li.remove();
        });
        refreshLabels();
        if (enabled.size > 0) loadMore(1);
        fillViewport();
      }
    } else {
      updateCountdown();
    }
  }

  // ---------- Init ----------
  buildFilters();
  renderCurrent();
  resetList();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();
