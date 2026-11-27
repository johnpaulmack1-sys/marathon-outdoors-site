/* =========================================================
   Marathon Outdoors: QUOTE ESTIMATOR
   A step-by-step pop-up (<dialog>) that:
     1. asks a few quick questions about the project,
     2. shows a ballpark price range (prices live in js/pricing.js),
     3. asks if that range works for the visitor's budget,
     4. collects contact info and the $150 consultation.
   Any element with [data-quote] opens it.
   ========================================================= */
{
  const P = window.MO_PRICING;
  const dlg = document.getElementById('quote-dialog');
  if (!P || !dlg) { console.warn('Estimator: missing pricing or dialog'); }
  const body = dlg.querySelector('.q-body');
  const backBtn = dlg.querySelector('.q-back');
  const nextBtn = dlg.querySelector('.q-next');
  const stepLabel = dlg.querySelector('.q-step');
  const bar = dlg.querySelector('.q-bar span');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- options ----------
  const TYPES = [
    ['patio', 'Patio', 'Paver, stone or gravel patio'],
    ['walkway', 'Walkway', 'Path or front walk'],
    ['retaining', 'Retaining wall', 'Holds back a slope'],
    ['seating', 'Seating wall', 'Low wall around a patio'],
    ['steps', 'Steps & stairs', 'Stone or paver steps'],
    ['firepit', 'Fire pit', 'Built-in fire feature'],
    ['kitchen', 'Outdoor kitchen', 'Island, grill or bar'],
    ['lighting', 'Landscape lighting', 'Paths, steps, house, trees'],
    ['drainage', 'Drainage fix', 'Standing water or erosion'],
    ['turf', 'Turf or gravel area', 'Artificial turf or gravel'],
  ];
  const PATIO_SIZES = { small: 120, medium: 320, large: 600 };
  const WALL_HEIGHTS = { low: 1.5, mid: 2.5, tall: 3.5 };
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  // ---------- state ----------
  const fresh = () => ({
    types: new Set(),
    d: {
      patioSize: 'medium', patioL: 16, patioW: 20,
      walkLen: 30, walkWidth: 4,
      wallLen: 30, wallHeight: 'mid',
      seatLen: 16, steps: 4, kitchen: 'medium',
      fixtures: 10, drainLen: 60, crawl: false,
      turfKind: 'turf', turfSqFt: 300,
    },
    material: 'standard',
    slope: 'flat', access: 'wide', removal: 'no', water: 'no',
    zip: '', timeline: '',
    fit: null, budget: '', sendAnyway: false,
    c: { name: '', phone: '', email: '', address: '', notes: '' },
    est: null, sent: false,
  });
  let S = fresh();
  let step = 'type';

  // ---------- flow ----------
  const needsMaterial = () => S.types.has('patio') || S.types.has('walkway');
  // before anything is picked, assume the material step so the step count doesn't jump
  const showMaterial = () => S.types.size === 0 || needsMaterial();
  const flow = () => [
    'type', 'details', showMaterial() ? 'material' : null, 'site', 'where', 'estimate',
    S.fit === 'close' ? 'options' : null,
    S.fit === 'no' ? 'over' : null,
    (S.fit === 'yes' || S.fit === 'close' || S.sendAnyway) ? 'contact' : null,
    (S.fit === 'yes' || S.fit === 'close') ? 'pay' : null,
    'done',
  ].filter(Boolean);
  const questionSteps = () => flow().slice(0, flow().indexOf('estimate'));

  // ---------- math ----------
  const times = ([lo, hi], k) => [lo * k, hi * k];
  function estimate(state = S) {
    const d = state.d;
    const m = P.materials[state.material] || P.materials.standard;
    const items = [];
    let patioArea = 0;
    if (state.types.has('patio')) {
      patioArea = d.patioSize === 'custom' ? Math.max(0, d.patioL * d.patioW) : PATIO_SIZES[d.patioSize];
      items.push([`Patio · about ${patioArea} sq ft`, times(m.perSqFt, patioArea)]);
    }
    if (state.types.has('walkway')) {
      const a = d.walkLen * d.walkWidth;
      items.push([`Walkway · ${d.walkLen} ft × ${d.walkWidth} ft`, times(m.perSqFt, a * P.walkwayMultiplier)]);
    }
    if (state.types.has('retaining')) {
      const face = d.wallLen * WALL_HEIGHTS[d.wallHeight];
      items.push([`Retaining wall · ${d.wallLen} ft long`, times(P.retainingWallPerFaceSqFt, face)]);
    }
    if (state.types.has('seating')) items.push([`Seating wall · ${d.seatLen} ft`, times(P.seatingWallPerLinearFt, d.seatLen)]);
    if (state.types.has('steps')) items.push([`Steps · ${d.steps}`, times(P.stepEach, d.steps)]);
    if (state.types.has('firepit')) items.push(['Fire pit', P.firePit]);
    if (state.types.has('kitchen')) items.push([`Outdoor kitchen · ${d.kitchen}`, P.kitchen[d.kitchen]]);
    if (state.types.has('drainage')) {
      let r = times(P.drainagePerLinearFt, d.drainLen);
      if (d.crawl) r = [r[0] + P.crawlspaceDrainage[0], r[1] + P.crawlspaceDrainage[1]];
      items.push([`Drainage · ${d.drainLen} ft${d.crawl ? ' + crawlspace' : ''}`, r]);
    }
    if (state.types.has('turf')) {
      const rate = d.turfKind === 'turf' ? P.turfPerSqFt : P.gravelAreaPerSqFt;
      items.push([`${d.turfKind === 'turf' ? 'Artificial turf' : 'Gravel area'} · ${d.turfSqFt} sq ft`, times(rate, d.turfSqFt)]);
    }
    if (state.removal === 'yes') {
      const a = patioArea || 200;
      items.push([`Remove old patio/concrete · ~${a} sq ft`, times(P.removalPerSqFt, a)]);
    }
    // site adjustments apply to construction, not to lighting
    const mult = (P.slope[state.slope] || 1) * (P.access[state.access] || 1);
    let lo = 0, hi = 0;
    items.forEach(([, r]) => { lo += r[0]; hi += r[1]; });
    const siteExtra = [lo * (mult - 1), hi * (mult - 1)];
    lo *= mult; hi *= mult;
    if (state.types.has('lighting')) {
      const r = [d.fixtures * P.lightingPerFixture[0] + P.lightingTransformer[0],
                 d.fixtures * P.lightingPerFixture[1] + P.lightingTransformer[1]];
      items.push([`Lighting · ${d.fixtures} fixtures + transformer`, r]);
      lo += r[0]; hi += r[1];
    }
    if (mult > 1) items.push([`Slope / access adjustment (+${Math.round((mult - 1) * 100)}%)`, siteExtra]);
    let raisedToMin = false;
    if (hi < P.minimumJob) { lo = P.minimumJob; hi = P.minimumJob * 1.2; raisedToMin = true; }
    else if (lo < P.minimumJob) lo = P.minimumJob;
    const R = P.roundTo;
    return { items, low: Math.floor(lo / R) * R, high: Math.ceil(hi / R) * R, raisedToMin };
  }

  // ---------- small template helpers ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const opt = (group, value, label, desc = '', on = false, multi = false) =>
    `<button type="button" class="q-opt${on ? ' is-on' : ''}" data-${multi ? 'multi' : 'pick'}="${group}" data-value="${value}" aria-pressed="${on}">
       <span class="q-opt-label">${label}</span>${desc ? `<span class="q-opt-desc">${desc}</span>` : ''}
     </button>`;
  const chips = (group, list, cur) =>
    `<div class="q-chips" role="group">${list.map(([v, l]) =>
      `<button type="button" class="q-chip${cur === v ? ' is-on' : ''}" data-pick="${group}" data-value="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
  const num = (key, val, unit, min = 1, max = 5000) =>
    `<label class="q-num"><input type="number" inputmode="numeric" min="${min}" max="${max}" value="${val}" data-num="${key}"><span>${unit}</span></label>`;
  const field = (label, html, hint = '') =>
    `<div class="q-field"><div class="q-label">${label}</div>${html}${hint ? `<p class="q-hint">${hint}</p>` : ''}</div>`;
  const head = (title, sub = '') =>
    `<h2 class="q-title" id="q-title" tabindex="-1">${title}</h2>${sub ? `<p class="q-sub">${sub}</p>` : ''}`;

  // ---------- steps ----------
  const STEPS = {
    type: {
      render: () => head('What are you building?', 'Pick everything that applies. You can choose more than one.') +
        `<div class="q-grid">${TYPES.map(([v, l, d]) => opt('types', v, l, d, S.types.has(v), true)).join('')}</div>`,
      valid: () => S.types.size > 0 || 'Choose at least one project.',
    },
    details: {
      render: () => {
        const d = S.d; let h = head('Tell us the size', 'Rough numbers are fine. Tom will measure on site.');
        if (S.types.has('patio')) h += field('Patio size', chips('d.patioSize', [['small', 'Small · ~10×12'], ['medium', 'Medium · ~16×20'], ['large', 'Large · 20×30+'], ['custom', 'I know my size']], d.patioSize) +
          (d.patioSize === 'custom' ? `<div class="q-row">${num('patioL', d.patioL, 'ft long')}${num('patioW', d.patioW, 'ft wide')}</div>` : ''));
        if (S.types.has('walkway')) h += field('Walkway', `<div class="q-row">${num('walkLen', d.walkLen, 'ft long')}</div>` + chips('d.walkWidth', [[3, '3 ft wide'], [4, '4 ft wide'], [5, '5 ft wide']], d.walkWidth));
        if (S.types.has('retaining')) h += field('Retaining wall', `<div class="q-row">${num('wallLen', d.wallLen, 'ft long')}</div>` + chips('d.wallHeight', [['low', 'Under 2 ft tall'], ['mid', '2–3 ft tall'], ['tall', 'Over 3 ft']], d.wallHeight),
          d.wallHeight === 'tall' ? 'Walls over 3–4 ft may need an engineer. Tom will confirm on site.' : '');
        if (S.types.has('seating')) h += field('Seating wall length', `<div class="q-row">${num('seatLen', d.seatLen, 'ft')}</div>`);
        if (S.types.has('steps')) h += field('Number of steps', `<div class="q-row">${num('steps', d.steps, 'steps', 1, 60)}</div>`);
        if (S.types.has('kitchen')) h += field('Outdoor kitchen', chips('d.kitchen', [['small', 'Small · grill island'], ['medium', 'Medium · island + counter'], ['large', 'Large · full kitchen']], d.kitchen));
        if (S.types.has('lighting')) h += field('Lights', `<div class="q-row">${num('fixtures', d.fixtures, 'fixtures', 1, 200)}</div>`, 'A typical front yard uses 8–15 lights.');
        if (S.types.has('drainage')) h += field('Drainage', `<div class="q-row">${num('drainLen', d.drainLen, 'ft of drain')}</div>` +
          chips('d.crawl', [[false, 'Yard only'], [true, 'Yard + crawlspace']], d.crawl));
        if (S.types.has('turf')) h += field('Turf or gravel', chips('d.turfKind', [['turf', 'Artificial turf'], ['gravel', 'Gravel']], d.turfKind) + `<div class="q-row">${num('turfSqFt', d.turfSqFt, 'sq ft')}</div>`);
        if (S.types.has('firepit')) h += field('Fire pit', '<p class="q-note">Included. Tom will help you pick the style.</p>');
        return h;
      },
      valid: () => [...dlg.querySelectorAll('[data-num]')].every((i) => +i.value > 0) || 'Please fill in each size with a number above 0.',
    },
    material: {
      render: () => head('Which material?', 'This is the biggest factor in price.') +
        `<div class="q-grid two">${Object.entries(P.materials).map(([v, m]) =>
          opt('material', v, m.label, { standard: '$ · durable, many colors', premium: '$$ · modern, clean look', natural: '$$$ · one-of-a-kind', gravel: '$ · relaxed, drains well' }[v], S.material === v)).join('')}</div>`,
      valid: () => true,
    },
    site: {
      render: () => head('About your yard', 'These change how much work it takes.') +
        field('How flat is the area?', chips('slope', [['flat', 'Flat'], ['gentle', 'Gentle slope'], ['steep', 'Steep']], S.slope)) +
        field('Can a small machine reach the work area?', chips('access', [['wide', 'Yes · 6 ft+ gate'], ['narrow', 'Narrow gate'], ['none', 'No access']], S.access)) +
        field('Is there an old patio or concrete to remove?', chips('removal', [['no', 'No'], ['yes', 'Yes']], S.removal)) +
        field('Does water pool or wash out there?', chips('water', [['no', 'No'], ['some', 'Sometimes'], ['yes', 'Yes, a lot']], S.water),
          S.water === 'yes' && !S.types.has('drainage') ? 'Tom may suggest a drainage fix. Our open-graded base also helps.' : ''),
      valid: () => true,
    },
    where: {
      render: () => {
        const z = S.zip.trim();
        const inArea = /^\d{5}$/.test(z) ? P.serviceZips.includes(z) : null;
        return head('Where and when?') +
          field('Project ZIP code', `<input class="q-input short" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="27511" value="${esc(z)}" data-text="zip">`,
            inArea === true ? '<span class="q-ok">✓ In our service area</span>' : inArea === false ? 'That ZIP may be outside our usual area (Cary, Apex, Durham, Chapel Hill, Wake County). You can still continue.' : '') +
          field('When would you like to start?', chips('timeline', [['asap', 'As soon as possible'], ['1-3', '1–3 months'], ['3-6', '3–6 months'], ['planning', 'Just planning']], S.timeline));
      },
      valid: () => {
        if (!/^\d{5}$/.test(S.zip.trim())) return 'Enter a 5-digit ZIP code.';
        if (!S.timeline) return 'Choose a timeline.';
        return true;
      },
    },
    estimate: {
      render: () => {
        S.est = estimate();
        const e = S.est;
        return `<p class="q-kicker">Your estimated range</p>` + head(`<span class="q-price" data-low="${e.low}" data-high="${e.high}">${money(e.low)} – ${money(e.high)}</span>`) +
          `<p class="q-sub">A ballpark for planning. Your final price is set after Tom sees the site.</p>
           <details class="q-break"><summary>See what's included</summary><ul>${e.items.map(([l, [lo, hi]]) =>
             `<li><span>${esc(l)}</span><span>${money(lo)} – ${money(hi)}</span></li>`).join('')}</ul>
             ${e.raisedToMin ? `<p class="q-hint">Raised to our ${money(P.minimumJob)} minimum project size.</p>` : ''}</details>
           ${P.demoPricing ? '<p class="q-demo">Sample pricing. Final numbers coming from Tom.</p>' : ''}
           <div class="q-ask"><div class="q-label">Does this range work for your budget?</div>
             <div class="q-grid three">
               ${opt('fit', 'yes', 'Yes, that works', 'Book a consultation', S.fit === 'yes')}
               ${opt('fit', 'close', 'Close, a little high', 'See ways to lower it', S.fit === 'close')}
               ${opt('fit', 'no', 'More than I planned', 'Let’s talk options', S.fit === 'no')}
             </div></div>`;
      },
      valid: () => !!S.fit || 'Choose an answer to continue.',
    },
    options: {
      render: () => {
        const ideas = [];
        if (needsMaterial() && S.material !== 'standard' && S.material !== 'gravel') {
          const e = estimate({ ...S, material: 'standard' });
          ideas.push(['material:standard', 'Switch to standard pavers', `Same layout, durable concrete pavers: ${money(e.low)} – ${money(e.high)}`]);
        }
        if (S.types.has('patio') && S.d.patioSize !== 'small') {
          const smaller = { large: 'medium', medium: 'small', custom: 'medium' }[S.d.patioSize];
          const e = estimate({ ...S, d: { ...S.d, patioSize: smaller } });
          ideas.push([`patio:${smaller}`, 'Go a size smaller', `A ${smaller} patio: ${money(e.low)} – ${money(e.high)}`]);
        }
        if (S.types.size > 1) {
          const first = [...S.types][0];
          const e = estimate({ ...S, types: new Set([first]) });
          const name = TYPES.find(([v]) => v === first)[1];
          ideas.push([`phase:${first}`, 'Build it in phases', `Start with the ${name.toLowerCase()} now (${money(e.low)} – ${money(e.high)}), add the rest later.`]);
        }
        return head('Ways to bring it down', 'Tap one to update your estimate, or keep your plan and book.') +
          (ideas.length ? `<div class="q-grid">${ideas.map(([v, l, d]) => opt('idea', v, l, d)).join('')}</div>` :
            '<p class="q-note">Your plan is already lean. Tom can suggest other savings at the consultation.</p>') +
          field('Roughly what budget did you have in mind? (optional)', budgetChips());
      },
      valid: () => true,
    },
    over: {
      render: () => head('Thanks for being upfront', 'Most projects can be scaled or phased. Here are your options.') +
        field('What budget did you have in mind?', budgetChips()) +
        `<div class="q-grid">
           ${opt('over', 'smaller', 'Plan something smaller', 'Go back and adjust your project')}
           ${opt('over', 'send', 'Send my info to Tom', 'No fee. He’ll reach out if he can help', S.sendAnyway)}
         </div>`,
      valid: () => S.sendAnyway || 'Choose an option, or close this window.',
    },
    contact: {
      render: () => head('Your contact info', S.sendAnyway ? 'Tom will reach out if he can fit your budget.' : 'So Tom can confirm your consultation.') +
        `<div class="q-form">
          ${input('name', 'Full name', 'text', 'name')}
          ${input('phone', 'Phone', 'tel', 'tel')}
          ${input('email', 'Email', 'email', 'email')}
          ${input('address', 'Project address', 'text', 'street-address')}
          <label class="q-field full"><span class="q-label">Anything else? (optional)</span>
            <textarea class="q-input" rows="3" data-text="c.notes" placeholder="Slope, drainage, existing patio, HOA…">${esc(S.c.notes)}</textarea></label>
        </div>`,
      valid: () => {
        const c = S.c;
        if (c.name.trim().length < 2) return 'Please enter your name.';
        if (c.phone.replace(/\D/g, '').length < 10) return 'Please enter a 10-digit phone number.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return 'Please enter a valid email.';
        if (c.address.trim().length < 5) return 'Please enter the project address.';
        return true;
      },
    },
    pay: {
      render: () => head('Book your consultation') +
        `<div class="q-pay">
           <div class="q-pay-row"><span>On-site consultation with Tom</span><strong>${money(P.consultFee)}</strong></div>
           <p class="q-sub">Credited toward your project if you hire Marathon Outdoors. Tom measures, checks drainage and access, and gives you a written quote.</p>
           ${P.stripePaymentLink
             ? `<a class="q-primary" href="${esc(P.stripePaymentLink)}?prefilled_email=${encodeURIComponent(S.c.email)}" target="_blank" rel="noopener" data-paid>Pay ${money(P.consultFee)} securely</a>
                <p class="q-hint">Opens Stripe's secure checkout in a new tab.</p>`
             : `<button type="button" class="q-primary" data-paid>Pay ${money(P.consultFee)} (demo)</button>
                <p class="q-demo">Demo: payment connects to Stripe once Tom's account is set up.</p>`}
         </div>`,
      valid: () => true,
    },
    done: {
      render: () => head(S.sendAnyway ? 'Got it. Thank you!' : 'You’re all set!',
        S.sendAnyway ? 'Tom has your project details and will reach out if he can help.' : 'Tom has your project details and will reach out to schedule your on-site consultation.') +
        `<div class="q-summary"><div><span>Your estimate</span><strong>${money(S.est.low)} – ${money(S.est.high)}</strong></div>
          <div><span>Project</span><strong>${[...S.types].map((t) => TYPES.find(([v]) => v === t)[1]).join(', ')}</strong></div></div>
         <p class="q-sub">Questions? Call <a href="tel:5550000000">(555) 000-0000</a>.</p>`,
      valid: () => true,
    },
  };
  function budgetChips() {
    return chips('budget', [['<10k', 'Under $10k'], ['10-25k', '$10k–25k'], ['25-50k', '$25k–50k'], ['50k+', '$50k+']], S.budget);
  }
  function input(key, label, type, ac) {
    return `<label class="q-field"><span class="q-label">${label}</span>
      <input class="q-input" type="${type}" autocomplete="${ac}" value="${esc(S.c[key])}" data-text="c.${key}"></label>`;
  }

  // ---------- render ----------
  function render(dir = 1) {
    const f = flow();
    const qs = questionSteps();
    const qi = qs.indexOf(step);
    stepLabel.textContent = qi >= 0 ? `Step ${qi + 1} of ${qs.length}` : step === 'done' ? 'Done' : 'Your estimate';
    bar.style.width = (qi >= 0 ? (qi + 1) / (qs.length + 1) : 1) * 100 + '%';
    body.innerHTML = STEPS[step].render() + '<p class="q-error" role="alert"></p>';
    body.scrollTop = 0;
    // footer buttons
    const i = f.indexOf(step);
    backBtn.hidden = i === 0 || step === 'done';
    const labels = { where: 'See my estimate', estimate: 'Continue', contact: S.sendAnyway ? 'Send to Tom' : 'Continue to booking', done: 'Close' };
    nextBtn.hidden = step === 'pay';
    nextBtn.textContent = labels[step] || 'Continue';
    if (!reduceMotion) {
      body.classList.remove('q-in', 'q-in-back');
      void body.offsetWidth;
      body.classList.add(dir > 0 ? 'q-in' : 'q-in-back');
    }
    if (step === 'estimate') countUp();
    dlg.querySelector('#q-title')?.focus({ preventScroll: true });
  }
  function countUp() {
    const el = body.querySelector('.q-price');
    if (!el || reduceMotion) return;
    const lo = +el.dataset.low, hi = +el.dataset.high, t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      el.textContent = `${money(lo * e)} – ${money(hi * e)}`;
      if (k < 1) requestAnimationFrame(tick); else el.textContent = `${money(lo)} – ${money(hi)}`;
    };
    requestAnimationFrame(tick);
  }
  function go(to, dir = 1) { step = to; render(dir); }
  function next() {
    const ok = STEPS[step].valid();
    if (ok !== true) { body.querySelector('.q-error').textContent = ok; return; }
    if (step === 'done') { close(); return; }
    if (step === 'contact') { submit(); return; }
    const f = flow();
    go(f[f.indexOf(step) + 1], 1);
  }
  function back() {
    const f = flow();
    const i = f.indexOf(step);
    if (i > 0) go(f[i - 1], -1);
  }

  // ---------- submit ----------
  async function submit() {
    nextBtn.disabled = true; nextBtn.textContent = 'Sending…';
    const payload = {
      _subject: `Quote request: ${S.c.name} (${money(S.est.low)}–${money(S.est.high)})`,
      name: S.c.name, phone: S.c.phone, email: S.c.email, address: S.c.address, zip: S.zip, notes: S.c.notes,
      projects: [...S.types].join(', '), material: needsMaterial() ? S.material : 'n/a',
      sizes: JSON.stringify(S.d), slope: S.slope, access: S.access, removal: S.removal, water: S.water,
      timeline: S.timeline, estimate: `${money(S.est.low)} – ${money(S.est.high)}`,
      budgetFit: S.fit, budget: S.budget || 'not given', path: S.sendAnyway ? 'over budget, sent info' : 'booking',
    };
    try {
      if (P.formEndpoint) {
        const r = await fetch(P.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('send failed');
      } else {
        console.info('[Estimator demo] Request that would be emailed to Tom:', payload);
        await new Promise((r) => setTimeout(r, 500));
      }
      S.sent = true;
      nextBtn.disabled = false;
      const f = flow();
      go(f[f.indexOf('contact') + 1], 1);
    } catch {
      nextBtn.disabled = false; nextBtn.textContent = 'Try again';
      body.querySelector('.q-error').textContent = 'Something went wrong sending your request. Please try again or call us.';
    }
  }

  // ---------- events ----------
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (e.target === dlg) { close(); return; }   // click on the dark backdrop
    if (!b) return;
    if (b.matches('.q-close')) return close();
    if (b.matches('[data-paid]')) { setTimeout(() => go('done', 1), b.tagName === 'A' ? 400 : 0); return; }
    if (b.dataset.multi === 'types') {
      const v = b.dataset.value;
      S.types.has(v) ? S.types.delete(v) : S.types.add(v);
      b.classList.toggle('is-on'); b.setAttribute('aria-pressed', S.types.has(v));
      body.querySelector('.q-error').textContent = '';
      return;
    }
    if (b.dataset.pick) {
      const g = b.dataset.pick;
      let v = b.dataset.value;
      if (v === 'true' || v === 'false') v = v === 'true';
      else if (/^\d+$/.test(v) && g === 'd.walkWidth') v = +v;
      if (g === 'idea') return applyIdea(v);
      if (g === 'over') {
        if (v === 'smaller') { S.fit = null; return go('type', -1); }
        S.sendAnyway = true; return next();
      }
      if (g.startsWith('d.')) S.d[g.slice(2)] = v; else S[g] = v;
      if (g === 'fit') { S.sendAnyway = false; render(0); return next(); }
      render(0);
    }
  });
  dlg.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.num) S.d[t.dataset.num] = Math.max(0, +t.value || 0);
    if (t.dataset.text) {
      const [a, b] = t.dataset.text.split('.');
      if (b) S[a][b] = t.value; else S[a] = t.value;
      if (a === 'zip' && t.value.length === 5) { const pos = t.selectionStart; render(0); const z = body.querySelector('[data-text="zip"]'); z.focus(); z.setSelectionRange(pos, pos); }
    }
    const err = body.querySelector('.q-error'); if (err) err.textContent = '';
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); next(); }
  });
  function applyIdea(v) {
    const [k, val] = v.split(':');
    if (k === 'material') S.material = val;
    if (k === 'patio') S.d.patioSize = val;
    if (k === 'phase') S.types = new Set([val]);
    S.fit = null;
    go('estimate', -1);
  }
  nextBtn.addEventListener('click', next);
  backBtn.addEventListener('click', back);
  dlg.addEventListener('close', () => document.documentElement.classList.remove('q-open'));

  // ---------- open / close ----------
  function open() {
    if (S.sent || step === 'done') { S = fresh(); }
    if (!S.est) step = 'type';
    document.documentElement.classList.add('q-open');
    document.body.classList.remove('menu-open');
    dlg.showModal();
    render(0);
  }
  function close() {
    dlg.close();
    if (step === 'done') { S = fresh(); step = 'type'; }
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-quote]');
    if (!t) return;
    e.preventDefault();
    open();
  });
  // allow opening from a link like .../#quote-form
  if (location.hash === '#get-quote') open();
}
