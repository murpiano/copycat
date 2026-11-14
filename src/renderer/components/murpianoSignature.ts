/** Interactive murpiano authorship signature, ported from
 * murpiano-brand/logo/signature/snippet.html (vanilla DOM/JS section).
 * Attaches hover/focus-driven paw, eye and glow behaviour to one
 * `.mp-signature` anchor; returns a cleanup function for React's effect. */

interface Point {
  x: number;
  y: number;
}

const EYES = [
  { track: '.mp-eye-track-l', cx: 39, cy: 57 },
  { track: '.mp-eye-track-r', cx: 67, cy: 57 },
];
const IDLE_EYE_OFFSET = 2.4;
const SWAT_PERIOD = 500;
const SHOULDER: Point = { x: 28, y: 145 };
const TUCKED: Point = { x: 28, y: 193 };
const GUARD: Point = { x: -9, y: 113 };
const GLOW_PERIOD = 3200;
const EYE_FADE_MS = 1400;
const RELEASE_MS = 1300;
const EYE_SPECS = [
  { sel: '.mp-eye-l', x0: 38, y0: 56, x1: 35.5, y1: 53.5 },
  { sel: '.mp-eye-r', x0: 66, y0: 56, x1: 63.5, y1: 53.5 },
];

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function mixPoint(a: Point, b: Point, t: number): Point {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
}
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function attachMurpianoSignature(sig: HTMLAnchorElement): () => void {
  const svg = sig.querySelector<SVGSVGElement>('.mp-signature__mark');
  if (!svg) return () => {};
  // Pointer events bind to the static outer zone, not the plaque itself
  // (which is the thing that visually lifts), so a stationary cursor is
  // never nudged out of hover by the plaque's own transform.
  const zone = sig.closest<HTMLElement>('.mp-signature-zone') || sig;

  const reduceMotion =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };
  const tracks = EYES.map((e) => ({
    el: svg.querySelector<SVGGElement>(e.track),
    cx: e.cx,
    cy: e.cy,
  }));
  const foreleg = svg.querySelector<SVGPathElement>('.mp-cat--foreleg-silhouette');
  const pawHead = svg.querySelector<SVGGElement>('.mp-cat--paw-head');
  const elbowJoint = svg.querySelector<SVGCircleElement>('.mp-cat--elbow-joint');
  const shoulderRound = svg.querySelector<SVGEllipseElement>('.mp-cat--shoulder-round');
  const name = sig.querySelector<HTMLElement>('.mp-signature__name');
  const contact = sig.querySelector<HTMLElement>('.mp-signature__contact');
  const glowEl = sig.querySelector<HTMLElement>('.mp-signature__glow');
  const eyeSpecs = EYE_SPECS.map((e) => ({
    el: svg.querySelector<SVGRectElement>(e.sel),
    x0: e.x0,
    y0: e.y0,
    x1: e.x1,
    y1: e.y1,
  }));

  if (!foreleg || !pawHead || !elbowJoint || !shoulderRound || !name || !contact) return () => {};

  const timers: number[] = [];
  let hovering = false;
  let awake = false;
  let ready = false;
  let hunting = false;
  let pointer: { x: number; y: number } | null = null;
  let paw: Point = { x: TUCKED.x, y: TUCKED.y };
  let planted = false;
  let nameAngle = 0;
  let nameVelocity = 0;
  let frameId = 0;
  let lastFrame = 0;
  let swatStarted = 0;
  let glowState: 'idle' | 'running' | 'releasing' = 'idle';
  let glowStart = 0;
  let releaseStart = 0;
  let releaseFromGlow = 0;
  let releaseFromEye = 0;

  function schedule(fn: () => void, ms: number) {
    timers.push(window.setTimeout(fn, ms));
  }

  function toSvg(clientX: number, clientY: number): Point | null {
    const rect = svg!.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((clientX - rect.left) * 240) / rect.width,
      y: ((clientY - rect.top) * 275) / rect.height,
    };
  }

  function nameContact(): Point | null {
    const rect = contact!.getBoundingClientRect();
    return toSvg(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function glowFrame(now: number): { glow: number; eye: number } {
    if (reduceMotion.matches) return { glow: 0, eye: 0 };
    if (glowState === 'running') {
      const elapsed = now - glowStart;
      const wave = (1 - Math.cos((2 * Math.PI * elapsed) / GLOW_PERIOD)) / 2;
      const eyeFade = Math.min(1, elapsed / EYE_FADE_MS);
      return { glow: wave, eye: wave * eyeFade };
    }
    if (glowState === 'releasing') {
      const t = Math.min(1, (now - releaseStart) / RELEASE_MS);
      const factor = (1 + Math.cos(Math.PI * t)) / 2;
      if (t >= 1) glowState = 'idle';
      return { glow: releaseFromGlow * factor, eye: releaseFromEye * factor };
    }
    return { glow: 0, eye: 0 };
  }

  function startGlow() {
    if (glowState === 'running') return;
    glowState = 'running';
    glowStart = performance.now();
  }

  function releaseGlow() {
    if (glowState === 'idle') return;
    const current = glowFrame(performance.now());
    releaseFromGlow = current.glow;
    releaseFromEye = current.eye;
    releaseStart = performance.now();
    glowState = 'releasing';
  }

  function applyGlow(now: number) {
    const frame = glowFrame(now);
    if (glowEl) glowEl.style.opacity = frame.glow.toFixed(3);
    eyeSpecs.forEach((spec) => {
      if (!spec.el) return;
      if (hunting) {
        spec.el.style.filter = '';
        return;
      }
      const size = mix(2, 7, frame.eye);
      spec.el.setAttribute('x', mix(spec.x0, spec.x1, frame.eye).toFixed(2));
      spec.el.setAttribute('y', mix(spec.y0, spec.y1, frame.eye).toFixed(2));
      spec.el.setAttribute('width', size.toFixed(2));
      spec.el.setAttribute('height', size.toFixed(2));
      spec.el.style.filter =
        frame.eye > 0.01
          ? 'drop-shadow(0 0 ' +
            (1.5 * frame.eye).toFixed(2) +
            'px rgba(255,215,122,' +
            frame.eye.toFixed(2) +
            ')) ' +
            'drop-shadow(0 0 ' +
            (4 * frame.eye).toFixed(2) +
            'px rgba(255,183,52,' +
            frame.eye.toFixed(2) +
            '))'
          : '';
    });
  }

  function updateEyes(clientX: number, clientY: number) {
    const point = toSvg(clientX, clientY);
    if (!point) return;
    if (hunting) {
      let ox = 20 * Math.tanh((point.x - 53) / 65);
      let oy = 20 * Math.tanh((point.y - 57) / 65);
      const ellipse = Math.hypot(ox / 20, oy / 19);
      if (ellipse > 1) {
        ox /= ellipse;
        oy /= ellipse;
      }
      tracks.forEach((t) => {
        if (t.el)
          t.el.setAttribute('transform', 'translate(' + ox.toFixed(2) + ',' + oy.toFixed(2) + ')');
      });
      return;
    }
    tracks.forEach((t) => {
      if (!t.el) return;
      const dx = point.x - t.cx;
      const dy = point.y - t.cy;
      const len = Math.hypot(dx, dy) || 1;
      const dist = Math.min(IDLE_EYE_OFFSET, len * 0.18);
      const ox = (dx / len) * dist;
      const oy = (dy / len) * dist;
      t.el.setAttribute('transform', 'translate(' + ox.toFixed(2) + ',' + oy.toFixed(2) + ')');
    });
  }

  function resetEyes() {
    tracks.forEach((t) => {
      if (t.el) t.el.removeAttribute('transform');
    });
  }

  function isInReach(): boolean {
    if (!pointer || !hovering || reduceMotion.matches) return false;
    const rect = svg!.getBoundingClientRect();
    const badge = sig.getBoundingClientRect();
    return (
      pointer.x >= Math.max(badge.left, rect.left - rect.width * 0.95) &&
      pointer.x <= badge.right &&
      pointer.y >= badge.top &&
      pointer.y <= badge.bottom
    );
  }

  function setHunting(next: boolean) {
    if (hunting === next) return;
    hunting = next;
    sig.classList.toggle('mp-signature--hunt', next);
    if (next) {
      planted = false;
      swatStarted = performance.now();
    }
    if (pointer) updateEyes(pointer.x, pointer.y);
  }

  function checkReach() {
    if (ready) setHunting(isInReach());
  }

  function swatTarget(): Point {
    const target = pointer && toSvg(pointer.x, pointer.y);
    if (!target) return GUARD;
    return target;
  }

  function renderPaw(x: number, y: number, rotation: number) {
    const dx = x - SHOULDER.x;
    const dy = y - SHOULDER.y;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = Math.hypot(dx, dy) < 0.001 ? -1 : dx / distance;
    const uy = Math.hypot(dx, dy) < 0.001 ? 0 : dy / distance;
    const upperReach = Math.min(79, Math.max(11, distance * 0.42));
    const bend = Math.min(33, Math.max(8, distance * 0.18));
    const bendSide = 0.7 + 0.3 * Math.tanh(-dx / 45);
    const fold = Math.max(0, 1 - distance / 28);
    const elbow: Point = {
      x: SHOULDER.x + ux * upperReach + uy * bend * bendSide - fold * 16,
      y: SHOULDER.y + uy * upperReach - ux * bend * bendSide + fold * 12,
    };
    const upperLength = Math.hypot(elbow.x - SHOULDER.x, elbow.y - SHOULDER.y) || 1;
    const lowerLength = Math.hypot(x - elbow.x, y - elbow.y) || 1;
    const upperNormal: Point = {
      x: -(elbow.y - SHOULDER.y) / upperLength,
      y: (elbow.x - SHOULDER.x) / upperLength,
    };
    const lowerNormal: Point = {
      x: -(y - elbow.y) / lowerLength,
      y: (x - elbow.x) / lowerLength,
    };
    const normalSum: Point = { x: upperNormal.x + lowerNormal.x, y: upperNormal.y + lowerNormal.y };
    const norm = Math.hypot(normalSum.x, normalSum.y);
    const jointNormal: Point =
      norm < 0.15 ? lowerNormal : { x: normalSum.x / norm, y: normalSum.y / norm };
    const radians = (rotation * Math.PI) / 180;
    const wristNormal: Point = {
      x: lowerNormal.x * Math.cos(radians) - lowerNormal.y * Math.sin(radians),
      y: lowerNormal.x * Math.sin(radians) + lowerNormal.y * Math.cos(radians),
    };
    const wrist: Point = {
      x: x - ((x - elbow.x) / lowerLength) * 17,
      y: y - ((y - elbow.y) / lowerLength) * 17,
    };
    const plus = (p: Point, n: Point, w: number): Point => ({ x: p.x + n.x * w, y: p.y + n.y * w });
    const shoulderUpper: Point = { x: 13, y: 112 };
    const shoulderLower: Point = { x: 76, y: 216 };
    const elbowUpper = plus(elbow, jointNormal, 16);
    const elbowLower = plus(elbow, jointNormal, -16);
    const wristUpper = plus(wrist, wristNormal, 9);
    const wristLower = plus(wrist, wristNormal, -9);
    const fmt = (n: number) => n.toFixed(1);
    const coords = (p: Point) => fmt(p.x) + ' ' + fmt(p.y);
    const midpoint = (a: Point, b: Point, t: number) => mixPoint(a, b, t);

    foreleg!.setAttribute(
      'd',
      [
        'M',
        coords(shoulderUpper),
        'C',
        coords(plus(midpoint(shoulderUpper, elbowUpper, 0.28), jointNormal, 10)),
        coords(plus(midpoint(shoulderUpper, elbowUpper, 0.76), jointNormal, 4)),
        coords(elbowUpper),
        'C',
        coords(plus(midpoint(elbowUpper, wristUpper, 0.31), lowerNormal, 3)),
        coords(midpoint(elbowUpper, wristUpper, 0.77)),
        coords(wristUpper),
        'C',
        coords(plus({ x: x - (x - wrist.x) * 0.34, y: y - (y - wrist.y) * 0.34 }, wristNormal, 13)),
        coords(plus({ x, y }, wristNormal, 9)),
        fmt(x),
        fmt(y),
        'C',
        coords(plus({ x, y }, wristNormal, -10)),
        coords(
          plus({ x: x - (x - wrist.x) * 0.34, y: y - (y - wrist.y) * 0.34 }, wristNormal, -12),
        ),
        coords(wristLower),
        'C',
        coords(midpoint(wristLower, elbowLower, 0.34)),
        coords(plus(midpoint(wristLower, elbowLower, 0.79), lowerNormal, -3)),
        coords(elbowLower),
        'C',
        coords(plus(midpoint(elbowLower, shoulderLower, 0.3), jointNormal, -7)),
        coords(plus(midpoint(elbowLower, shoulderLower, 0.73), jointNormal, -10)),
        coords(shoulderLower),
        'Q',
        coords({ x: 40, y: 167 }),
        coords(shoulderUpper),
        'Z',
      ].join(' '),
    );
    elbowJoint!.setAttribute('cx', fmt(elbow.x));
    elbowJoint!.setAttribute('cy', fmt(elbow.y));
    const upperDx = (elbow.x - SHOULDER.x) / upperLength;
    const upperDy = (elbow.y - SHOULDER.y) / upperLength;
    const upperAngle = (Math.atan2(upperDy, upperDx) * 180) / Math.PI;
    const reachingLeft = Math.min(1, Math.max(0, -dx / 70));
    shoulderRound!.setAttribute('rx', fmt(mix(33, 43, reachingLeft)));
    shoulderRound!.setAttribute('ry', fmt(mix(24, 27, reachingLeft)));
    shoulderRound!.setAttribute(
      'transform',
      'translate(' +
        fmt(SHOULDER.x + upperDx * 13) +
        ' ' +
        fmt(SHOULDER.y + upperDy * 13) +
        ') rotate(' +
        fmt(upperAngle) +
        ')',
    );
    const direction = (Math.atan2(y - elbow.y, x - elbow.x) * 180) / Math.PI;
    pawHead!.setAttribute(
      'transform',
      'translate(' + fmt(x) + ' ' + fmt(y) + ') rotate(' + fmt(direction) + ')',
    );
  }

  function springName(dt: number) {
    const target =
      awake && planted && sig.classList.contains('mp-signature--lean') && !hunting ? 3.8 : 0;
    if (reduceMotion.matches) {
      nameAngle = target;
      nameVelocity = 0;
    } else {
      const seconds = dt / 1000;
      nameVelocity += (target - nameAngle) * 175 * seconds;
      nameVelocity *= Math.exp(-9.3 * seconds);
      nameAngle += nameVelocity * seconds;
      if (Math.abs(target - nameAngle) < 0.008 && Math.abs(nameVelocity) < 0.06) {
        nameAngle = target;
        nameVelocity = 0;
      }
    }
    name!.style.transform = 'rotate(' + nameAngle.toFixed(3) + 'deg)';
  }

  function animate(time: number) {
    const dt = lastFrame ? Math.min(50, Math.max(1, time - lastFrame)) : 16;
    lastFrame = time;
    applyGlow(time);
    const pawVisible = awake && sig.classList.contains('mp-signature--paw-visible');
    let goal: Point = pawVisible ? nameContact() || TUCKED : TUCKED;
    let pawRotation = nameAngle;
    let strikeContact: Point | null = null;

    if (hunting) {
      const phase = ((time - swatStarted) % SWAT_PERIOD) / SWAT_PERIOD;
      const hit = swatTarget();
      const raised: Point = { x: hit.x - 7, y: hit.y - 38 };
      if (phase < 0.18) {
        goal = GUARD;
        pawRotation = -19;
      } else if (phase < 0.36) {
        goal = mixPoint(GUARD, raised, easeOut((phase - 0.18) / 0.18));
        pawRotation = -24;
      } else if (phase < 0.49) {
        const t = Math.pow((phase - 0.36) / 0.13, 2);
        goal = mixPoint(raised, hit, t);
        pawRotation = mix(-24, 18, t);
      } else if (phase < 0.55) {
        goal = hit;
        pawRotation = 18;
        strikeContact = hit;
      } else if (phase < 0.77) {
        const t = easeOut((phase - 0.55) / 0.22);
        goal = mixPoint(hit, GUARD, t);
        pawRotation = mix(18, -19, t);
      } else {
        goal = GUARD;
        pawRotation = -19;
      }
      planted = false;
    } else if (pawVisible && goal) {
      const gap = Math.hypot(goal.x - paw.x, goal.y - paw.y);
      if (gap < 2) planted = true;
    } else {
      planted = false;
    }

    const smoothing = Math.min(1, dt / (hunting ? 17 : 65));
    paw.x += (goal.x - paw.x) * smoothing;
    paw.y += (goal.y - paw.y) * smoothing;
    if (strikeContact) {
      paw.x = strikeContact.x;
      paw.y = strikeContact.y;
    }

    springName(dt);
    if (planted && !hunting) {
      const movingContact = nameContact();
      if (movingContact) {
        paw.x = movingContact.x;
        paw.y = movingContact.y;
      }
      pawRotation = nameAngle;
    }
    renderPaw(paw.x, paw.y, pawRotation);

    if (!awake && nameAngle === 0 && nameVelocity === 0 && glowState === 'idle') {
      frameId = 0;
      lastFrame = 0;
      return;
    }
    frameId = window.requestAnimationFrame(animate);
  }

  function begin() {
    startGlow();
    if (awake) return;
    awake = true;
    sig.classList.add('mp-signature--awake');
    if (!frameId) {
      lastFrame = 0;
      frameId = window.requestAnimationFrame(animate);
    }

    if (reduceMotion.matches) {
      sig.classList.add('mp-signature--eyes-on', 'mp-signature--paw-visible', 'mp-signature--lean');
      ready = true;
      return;
    }
    schedule(() => sig.classList.add('mp-signature--eyes-on'), 680);
    schedule(() => sig.classList.add('mp-signature--paw-visible'), 1030);
    schedule(() => sig.classList.add('mp-signature--lean'), 1370);
    schedule(() => {
      ready = true;
      checkReach();
    }, 1590);
  }

  function stop() {
    releaseGlow();
    if (!awake) return;
    awake = false;
    ready = false;
    hunting = false;
    pointer = null;
    planted = false;
    timers.forEach((id) => window.clearTimeout(id));
    timers.length = 0;
    sig.classList.remove(
      'mp-signature--awake',
      'mp-signature--eyes-on',
      'mp-signature--paw-visible',
      'mp-signature--lean',
      'mp-signature--hunt',
    );
    resetEyes();
  }

  function onPointerEnter(ev: PointerEvent) {
    if (ev.pointerType === 'touch') return;
    hovering = true;
    pointer = { x: ev.clientX, y: ev.clientY };
    begin();
    updateEyes(ev.clientX, ev.clientY);
  }
  function onPointerMove(ev: PointerEvent) {
    if (ev.pointerType === 'touch') return;
    pointer = { x: ev.clientX, y: ev.clientY };
    updateEyes(ev.clientX, ev.clientY);
    checkReach();
  }
  function onPointerLeave() {
    hovering = false;
    pointer = null;
    setHunting(false);
    releaseGlow();
    if (!sig.matches(':focus-visible')) stop();
    else resetEyes();
  }
  function onFocus() {
    begin();
  }
  function onBlur() {
    if (!hovering) stop();
  }

  zone.addEventListener('pointerenter', onPointerEnter);
  zone.addEventListener('pointermove', onPointerMove);
  zone.addEventListener('pointerleave', onPointerLeave);
  sig.addEventListener('focus', onFocus);
  sig.addEventListener('blur', onBlur);

  return () => {
    zone.removeEventListener('pointerenter', onPointerEnter);
    zone.removeEventListener('pointermove', onPointerMove);
    zone.removeEventListener('pointerleave', onPointerLeave);
    sig.removeEventListener('focus', onFocus);
    sig.removeEventListener('blur', onBlur);
    timers.forEach((id) => window.clearTimeout(id));
    if (frameId) window.cancelAnimationFrame(frameId);
  };
}
