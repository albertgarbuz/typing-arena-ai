export function flyLetter(key: HTMLElement | null, target: Element | null, letter: string) {
  if (!key || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const from = key.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const x = from.left + from.width / 2;
  const y = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - x;
  const dy = to.top + to.height / 2 - y;
  const glyph = document.createElement("i");
  glyph.className = "flying-letter";
  glyph.textContent = letter === " " ? "␣" : letter;
  glyph.setAttribute("aria-hidden", "true");
  Object.assign(glyph.style, {position:"fixed", left:x+"px", top:y+"px", zIndex:"80"});
  document.body.appendChild(glyph);
  const flight = glyph.animate([
    {transform:"translate(-50%,-50%) scale(.8)", opacity:0},
    {transform:`translate(calc(-50% + ${dx*.22}px),calc(-50% + ${dy*.55}px)) skew(-12deg)`, opacity:1, offset:.4},
    {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.75)`, opacity:0}
  ], {duration:420, easing:"ease-out"});
  flight.onfinish = flight.oncancel = () => glyph.remove();
}
