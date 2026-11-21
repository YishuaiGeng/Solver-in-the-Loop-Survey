const track = document.querySelector("#figure-track");
const slides = [...track.children];
const counter = document.querySelector("#figure-counter");
const previousFigure = document.querySelector("#figure-previous");
const nextFigure = document.querySelector("#figure-next");

function current() {
  return Math.round(track.scrollLeft / track.clientWidth);
}

function update() {
  const index = current();
  counter.textContent = `${index + 1} / ${slides.length}`;
  previousFigure.disabled = index === 0;
  nextFigure.disabled = index === slides.length - 1;
}

function show(index) {
  const target = Math.max(0, Math.min(slides.length - 1, index));
  track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
}

previousFigure.addEventListener("click", () => show(current() - 1));
nextFigure.addEventListener("click", () => show(current() + 1));
track.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") { event.preventDefault(); show(current() - 1); }
  if (event.key === "ArrowRight") { event.preventDefault(); show(current() + 1); }
});
track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
window.addEventListener("resize", update);
update();
