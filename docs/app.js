(() => {
  const copyButtons = document.querySelectorAll("[data-copy]");
  for (const button of copyButtons) {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      if (!target) return;
      const text = target.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        const previous = button.textContent;
        button.textContent = "copied";
        button.style.color = "#3fb950";
        setTimeout(() => {
          button.textContent = previous;
          button.style.color = "";
        }, 1400);
      } catch {
        button.textContent = "select";
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

  const typed = document.getElementById("typed");
  if (typed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const full = typed.textContent;
    typed.textContent = "";
    let index = 0;
    const tick = () => {
      typed.textContent = full.slice(0, index);
      index += 1;
      if (index <= full.length) setTimeout(tick, 18 + Math.random() * 22);
    };
    setTimeout(tick, 420);
  }
})();
