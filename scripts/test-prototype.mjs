// End-to-end smoke for the documentation UX prototype.
// Run: npm install --no-save playwright@1.57.0 && npx playwright install chromium
//      node scripts/test-prototype.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=resolve(root,'.'+relative);
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
 }catch{res.writeHead(404).end('Not found')}
});
const listen=()=>new Promise(r=>server.listen(0,'127.0.0.1',r));
await listen();
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let checks=0;
const expect=async(description,predicate)=>{
 if(!await predicate())throw new Error('UX smoke failed: '+description);
 checks++;
};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/prototype.html',{waitUntil:'networkidle'});
 await expect('home headline visible',async()=>page.locator('#homeHeading').isVisible());
 await expect('demo notice visible',async()=>page.locator('.demo-ribbon').isVisible());
 await expect('three demo search cards',async()=>await page.locator('.listing-card:not([hidden])').count()===3);
 await page.locator('#placeButton').click();
 await page.locator('[data-location="Алматы"]').click();
 await expect('manual city selection works',async()=>await page.locator('#currentPlace').innerText()==='Алматы');
 await page.locator('#searchInput').fill('Стрижка');
 await page.locator('#searchForm button[type="submit"]').click();
 await expect('search filters result cards',async()=>await page.locator('.listing-card:not([hidden])').count()===2);
 await page.locator('.top-nav [data-page="professional"]').click();
 await expect('independent profile opened',async()=>page.locator('#screen-professional').isVisible());
 await page.locator('#screen-professional [data-request="professional"]').first().click();
 await expect('personal receiver chosen',async()=>await page.locator('#requestReceiver').innerText()==='Айгүл С. — лично');
 await page.locator('#requestContact').fill('demo@example.invalid');
 await page.locator('#requestSubmit').click();
 await expect('demo request closes without sending',async()=>!await page.locator('#requestDialog').isVisible());
 await expect('personal demo request shows pending status',async()=>page.locator('#screen-request-status').isVisible() &&
   (await page.locator('#demoRequestStatus').innerText()).includes('Ожидает'));
 await expect('personal request is addressed to master',async()=>await page.locator('#demoRequestReceiver').innerText()==='Айгүл С. — лично');
 await expect('event journal labels contact and notification as simulation',async()=>/симуляция/.test((await page.locator('#demoRequestEvents').innerText()).toLowerCase()));
 await page.locator('.top-nav [data-page="seller"]').click();
 await page.locator('[data-demo-decision="accept"]').click();
 await expect('seller accepted pending request',async()=>page.locator('#screen-request-status').isVisible() &&
   (await page.locator('#demoRequestStatus').innerText()).includes('Принята'));
 await expect('no agreed time means no cancellation penalty',async()=>/Без подтверждённого времени/.test(await page.locator('#demoRequestReliability').innerText()));
 await page.locator('#demoCancelRequest').click();
 await expect('client can cancel accepted request without confirmed time',async()=>/Отменена клиентом/.test(await page.locator('#demoRequestStatus').innerText()));
 await expect('both cancellation notices are simulated',async()=>/2 логические симуляции/.test(await page.locator('#demoRequestEvents').innerText()));
 await page.locator('.top-nav [data-page="company"]').click();
 await page.locator('#screen-company [data-request="company"]').first().click();
 await expect('company is receiver inside company card',async()=>await page.locator('#requestReceiver').innerText()==='Flora Studio — компания');
 await page.locator('#requestDialog .icon-button').click();
 await page.locator('#screen-company [data-save="company"]').click();
 await page.locator('.top-nav [data-page="client"]').click();
 await expect('saved company shown privately in demo cabinet',async()=>await page.locator('#savedList').innerText()==='♡ Flora Studio');
 await page.locator('#cancelSample').click();
 await page.locator('input[name="cancelMode"][value="late"]').check();
 await expect('late cancellation explains reliability effect',async()=>/снизится/.test(await page.locator('#cancelWarning').innerText()));
 await page.locator('#cancelForm button[value="confirm"]').click();
 await expect('sample accepted request cancelled',async()=>await page.locator('#cancelledExample').isVisible());
 await expect('reliability demo score updated',async()=>await page.locator('#clientScore').innerText()==='91');
 await page.locator('.top-nav [data-page="seller"]').click();
 await expect('seller settings screen opened',async()=>page.locator('#screen-seller').isVisible());
 await expect('initial company view excludes master-hidden portfolio',async()=>!/Портфолио/.test(await page.locator('#visibleCompanyFields').innerText()));
 await page.locator('[data-master-field="portfolio"]').check();
 await expect('two-party field intersection enables portfolio',async()=>/Портфолио/.test(await page.locator('#visibleCompanyFields').innerText()));
 await page.locator('[data-master-field="bio"]').uncheck();
 await expect('revoking master field removes it from company preview',async()=>!/Описание/.test(await page.locator('#visibleCompanyFields').innerText()));
 await page.locator('.top-nav [data-page="company"]').click();
 await page.locator('#screen-company [data-page="company-professional"]').click();
 await expect('embedded professional is a separate company context',async()=>page.locator('#screen-company-professional').isVisible());
 await expect('company specialization page is routed to organization',async()=>/Flora Studio/.test(await page.locator('#screen-company-professional .contact-card').innerText()));
 await expect('master-granted portfolio displayed within company',async()=>page.locator('#embeddedPortfolio').isVisible());
 await expect('master-revoked bio hidden from company',async()=>!await page.locator('#embeddedBio').isVisible());
 await page.locator('#screen-company-professional [data-request="company"]').first().click();
 await expect('embedded specialist CTA names company as seller',async()=>await page.locator('#requestReceiver').innerText()==='Flora Studio — компания');
 await page.locator('#requestContact').fill('guest@example.invalid');
 await page.locator('#requestSubmit').click();
 await page.locator('.top-nav [data-page="seller"]').click();
 await expect('company request appears in demo seller inbox',async()=>/Flora Studio/.test(await page.locator('#demoInboxBody').innerText()));
 await page.locator('[data-demo-decision="decline"]').click();
 await expect('company can decline without quoting price',async()=>/Отклонена/.test(await page.locator('#demoRequestStatus').innerText()));
 await expect('declined request is not cancellable',async()=>await page.locator('#demoCancelRequest').isDisabled());
 await page.locator('.top-nav [data-page="seller"]').click();
 await page.locator('#cancelWindow').selectOption('24');
 await expect('cancel deadline reflected in seller preview',async()=>/24 ч/.test(await page.locator('#policyPreview').innerText()));
 await mkdir(resolve(root,'artifacts'),{recursive:true});
 await page.screenshot({path:resolve(root,'artifacts/prototype-desktop.png'),fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto(origin+'/prototype.html',{waitUntil:'networkidle'});
 await expect('mobile home visible',async()=>mobile.locator('#homeHeading').isVisible());
 await expect('mobile search is usable',async()=>mobile.locator('#searchInput').isVisible());
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 await expect('no major horizontal overflow on mobile',async()=>overflow<=2);
 await mobile.locator('.top-nav [data-page="company"]').click();
 await mobile.locator('#screen-company [data-page="company-professional"]').click();
 await expect('mobile embedded company profile is usable',async()=>mobile.locator('#screen-company-professional h1').isVisible());
 const embeddedOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 await expect('no company-card horizontal overflow on mobile',async()=>embeddedOverflow<=2);
 await mobile.goto(origin+'/prototype.html#request-status',{waitUntil:'networkidle'});
 await expect('direct request status route does not leak unrelated state',async()=>/Заявка ещё не создана/.test(await mobile.locator('#demoRequestNumber').innerText()));
 await mobile.screenshot({path:resolve(root,'artifacts/prototype-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[],'Browser JavaScript errors');
 console.log('Services UX prototype passed '+checks+' browser assertions; screenshots saved.');
}finally{
 await browser.close();await new Promise(r=>server.close(r));
}
