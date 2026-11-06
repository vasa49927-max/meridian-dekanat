const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = process.argv[2] || '../docs/screenshots';
  for (const v of ['a','b','c']) {
    for (const [w,h,tag] of [[360,800,'360'],[1440,900,'1440']]) {
      const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor: 2 });
      await p.goto(`file://${process.cwd()}/variant-${v}.html`);
      await p.waitForTimeout(300);
      const sw = await p.evaluate(()=>document.documentElement.scrollWidth);
      await p.screenshot({ path: `${out}/01-concept-variant-${v}-${tag}.png`, fullPage: tag==='360' ? false : true });
      if (tag==='360') await p.screenshot({ path: `${out}/01-concept-variant-${v}-${tag}-full.png`, fullPage: true });
      console.log(v, tag, 'scrollWidth', sw);
      await p.close();
    }
  }
  await b.close();
})();
