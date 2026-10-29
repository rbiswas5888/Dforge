import { execSync } from 'node:child_process';

const script = `
  const btns = Array.from(document.querySelectorAll('.tool-shelf button, .tool-shelf span'));
  const res = btns.map(b => ({
    tag: b.tagName,
    cls: b.className,
    tool: b.dataset.tool || b.dataset.mode || '',
    w: b.offsetWidth,
    h: b.offsetHeight,
    color: getComputedStyle(b).color,
    display: getComputedStyle(b).display
  }));
  console.log(JSON.stringify(res, null, 2));
`;

try {
  const output = execSync(
    `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --virtual-time-budget=2000 --dump-dom "http://localhost:3001/"`,
    { encoding: 'utf8' }
  );
  console.log('Dump length:', output.length);
} catch (e) {
  console.error(e);
}

