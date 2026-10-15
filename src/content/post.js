if (window.hljs) {
  hljs.highlightAll();
  hljs.addPlugin(new CopyButtonPlugin());
}

let activeTooltip = null;

const VIEWPORT_MARGIN = 8;
function showTooltip(tooltip) {
  tooltip.style.setProperty('--shift', '0px');
  tooltip.classList.add('visible');
  const rect = tooltip.getBoundingClientRect();
  const right = document.documentElement.clientWidth - VIEWPORT_MARGIN;
  let shift = 0;
  if (rect.left < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - rect.left;
  else if (rect.right > right) shift = right - rect.right;
  tooltip.style.setProperty('--shift', shift + 'px');
}

document.querySelectorAll('.footnote-ref').forEach(ref => {
  const fnId = ref.getAttribute('href');
  if (fnId) {
    const escapedId = fnId.replace(/:/g, '\\:');
    const fnElement = document.querySelector(escapedId);
    if (fnElement) {
      let html = fnElement.innerHTML
        .replace(/<a class="footnote-backref".*?<\/a>/s, '')
        .trim();

      html = html.replace(/^<p>(.*)<\/p>$/s, '$1');

      const tooltip = document.createElement('div');
      tooltip.className = 'footnote-tooltip';
      tooltip.innerHTML = html;

      ref.addEventListener('mouseenter', () => {
        if (activeTooltip && activeTooltip !== tooltip) {
          activeTooltip.classList.remove('visible');
        }
        showTooltip(tooltip);
        activeTooltip = tooltip;
      });

      ref.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!tooltip.matches(':hover')) {
            tooltip.classList.remove('visible');
            if (activeTooltip === tooltip) activeTooltip = null;
          }
        }, 50);
      });

      tooltip.addEventListener('mouseenter', () => {
        showTooltip(tooltip);
        activeTooltip = tooltip;
      });

      tooltip.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!ref.matches(':hover')) {
            tooltip.classList.remove('visible');
            if (activeTooltip === tooltip) activeTooltip = null;
          }
        }, 50);
      });

      ref.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && tooltip.contains(e.target)) {
          return;
        }

        e.preventDefault();
        if (tooltip.classList.contains('visible')) {
          tooltip.classList.remove('visible');
          activeTooltip = null;
        } else {
          if (activeTooltip && activeTooltip !== tooltip) {
            activeTooltip.classList.remove('visible');
          }
          showTooltip(tooltip);
          activeTooltip = tooltip;
        }
      });

      document.addEventListener('click', (e) => {
        if (!ref.contains(e.target) && !tooltip.contains(e.target)) {
          if (tooltip.classList.contains('visible')) {
            tooltip.classList.remove('visible');
            if (activeTooltip === tooltip) activeTooltip = null;
          }
        }
      });

      ref.appendChild(tooltip);
    }
  }
});
