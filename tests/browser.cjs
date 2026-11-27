const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out=process.env.TEST_OUTPUT||'/tmp/lot-dvor-results';fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/');
await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.locator('[data-theme]').count(),20);
assert.equal(await page.evaluate(()=>THEMES.reduce((s,t)=>s+t.items.length,0)),320);
await page.screenshot({path:out+'/home-mobile.png',fullPage:true});
await page.locator('#all-themes').click();
for(const id of await page.locator('[data-theme]').evaluateAll(bs=>bs.map(b=>b.dataset.theme))){
 await page.locator(`[data-theme="${id}"]`).click();
 assert.equal(await page.locator(`[data-theme="${id}"]`).getAttribute('aria-pressed'),'true');
}
await page.locator('[data-theme="yard"]').click();
await page.locator('#name0').fill('Первый');await page.locator('#name1').fill('Второй');
await page.locator('button[type="submit"]').click();
assert.deepEqual(await page.evaluate(()=>[balance(0),balance(1)]),[20,20]);
assert.equal(await page.evaluate(()=>new Set(game.deck).size),12);
await page.locator('#reveal').click();
await page.locator('#price').fill('21');assert(await page.locator('[data-buy="0"]').isDisabled());
await page.locator('#price').fill('1.5');assert(await page.locator('[data-buy="0"]').isDisabled());
await page.locator('#price').fill('-1');assert(await page.locator('[data-buy="0"]').isDisabled());
await page.locator('#price').fill('4');await page.locator('[data-buy="0"]').click();
assert.deepEqual(await page.evaluate(()=>[balance(0),balance(1)]),[16,20]);
await page.reload();assert.equal(await page.evaluate(()=>game.index),1);
assert.equal(await page.evaluate(()=>balance(0)),16);
await page.locator('#undo').click();assert.equal(await page.evaluate(()=>balance(0)),20);
assert(await page.locator('#price').isVisible());
await page.locator('#price').fill('20');await page.locator('[data-buy="0"]').click();
await page.locator('#reveal').click();assert(await page.locator('[data-buy="0"]').isDisabled());
await page.screenshot({path:out+'/auction-mobile.png',fullPage:true});
await page.locator('#skip').click();
await page.locator('#undo').click();assert.equal(await page.evaluate(()=>game.index),1);
await page.locator('#price').fill('4');await page.locator('[data-buy="1"]').click();
for(let i=2;i<12;i++){await page.locator('#reveal').click();if(i%2===0&&i<8){await page.locator('#price').fill('2');await page.locator('[data-buy="1"]').click();}else await page.locator('#skip').click();}
assert.equal(await page.evaluate(()=>game.stage),'result');assert.equal(await page.evaluate(()=>game.history.length),12);
assert.equal(await page.locator('.result-scene').count(),2);
assert(await page.evaluate(()=>validGame(game)));
const result=await page.evaluate(()=>[score(0),score(1)]);
for(const s of result)assert.equal(s.total,s.totals.reduce((a,b)=>a+b,0)+s.variety);
await page.screenshot({path:out+'/result-mobile.png',fullPage:true});
const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-download="0"]').click()]);
assert(download.suggestedFilename().endsWith('.svg'));
await download.saveAs(out+'/result.svg');
await page.reload();assert.equal(await page.evaluate(()=>game.stage),'result');
await page.locator('#result-undo').click();assert.equal(await page.evaluate(()=>game.index),11);
await page.locator('#skip').click();
await page.locator('.new-game').click();await page.locator('#cancel-reset').click();assert.equal(await page.evaluate(()=>game.stage),'result');
await page.locator('.new-game').click();await page.locator('#confirm-reset').click();
assert.equal(await page.evaluate(()=>game),null);
await page.locator('#name0').fill('<img src=x onerror=alert(1)>');await page.locator('button[type="submit"]').click();
assert.equal(await page.locator('.wallet img').count(),0);
await page.locator('#finish').click();assert.equal(await page.locator('.result-head img').count(),0);
// Validate a full game for all twenty themes, then inspect a desktop start screen.
const allThemes=await page.evaluate(()=>{
 for(const t of THEMES){const ids=t.items.map(i=>i.id);if(new Set(ids).size!==16)throw Error('duplicate item');
  for(const it of t.items)if(it.scores.length!==3||it.scores.some(s=>!Number.isInteger(s)||s<1||s>5))throw Error('bad scores');
  const sample={version:1,theme:t.id,names:['A','B'],deck:ids.slice(0,12),index:12,revealed:false,stage:'result',history:ids.slice(0,12).map((id,i)=>({id,player:i%2,price:1}))};if(!validGame(sample))throw Error('bad full game '+t.id);
 }
 return THEMES.length;
});
assert.equal(allThemes,20);
await page.evaluate(()=>localStorage.clear());await page.reload();
await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:out+'/home-desktop.png',fullPage:true});
for(const width of [320,360,390,768,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}
await page.evaluate(()=>localStorage.setItem(KEY,'{broken'));await page.reload();assert.equal(await page.locator('#start-form').count(),1);
assert.deepEqual(errors,[]);
console.log('PASS: 20 themes / 320 lots; full 12-round mobile game; balances; invalid prices; undo; reload; results and scoring; download; restart; XSS escaping; corrupted save; 5 viewport widths.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
