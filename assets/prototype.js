/* Services UX prototype. All data is simulated; nothing is sent or persisted. */
(() => {
  'use strict';
  const $ = (selector, parent=document) => parent.querySelector(selector);
  const $$ = (selector, parent=document) => [...parent.querySelectorAll(selector)];
  const pages = ['home','professional','company','client','seller'];
  const state = {city:'Караганда',query:'',saved:new Set(),receiver:'professional',sampleCancelled:false,score:98,language:'ru'};
  let toastTimer;
  const locations = {'Караганда':'Караганда','Алматы':'Алматы','Астана':'Астана','Весь мир':'Весь мир','Онлайн':'Онлайн'};
  const requestDialog = $('#requestDialog');
  const locationDialog = $('#locationDialog');
  const cancelDialog = $('#cancelDialog');
  const showToast = message => {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3800);
  };
  const navigate = (page, shouldScroll=true) => {
    if(!pages.includes(page))return;
    $$('.screen').forEach(el => {el.hidden = el.id !== 'screen-'+page;el.classList.toggle('active-screen',!el.hidden);});
    $$('[data-page]').forEach(el=>el.classList.toggle('nav-active',el.dataset.page===page && el.closest('.top-nav')!==null));
    if(shouldScroll)window.scrollTo({top:0,behavior:'instant'});
    const heading=$('#screen-'+page+' h1');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    history.replaceState(null,'','#'+page);
  };
  const search = (query) => {
    const input=$('#searchInput');
    input.value=query;
    state.query=query.trim().toLocaleLowerCase('ru');
    let count=0;
    $$('.listing-card').forEach(card=>{
      const matches=!state.query || card.dataset.search.includes(state.query);
      card.hidden=!matches;
      if(matches)count++;
    });
    $('#resultCount').textContent=count;
    $('#emptyResults').hidden=count>0;
    $('#searchFeedback').textContent=state.query ? (count ? 'Результаты для «'+query.trim()+'» — демонстрационные данные.' : 'По вашему запросу в демонстрационном наборе ничего не найдено.') : '';
    if(state.query)$('[id="results"]').scrollIntoView({behavior:'smooth',block:'start'});
  };
  const setLocation=city=>{
    if(!locations[city])return;
    state.city=city;
    $('#currentPlace').textContent=city;
    $$('[data-city]').forEach(el=>el.textContent=city);
    if(city==='Онлайн')showToast('Демо: показаны примерные карточки онлайн-услуг. Реального фильтра по географии нет.');
    else showToast('Выбран регион: '+city+'. Демо-карточки остались теми же.');
    if(locationDialog.open)locationDialog.close();
  };
  const updateSaved=()=>{
    $$('[data-save]').forEach(btn=>{
      const active=state.saved.has(btn.dataset.save);
      btn.setAttribute('aria-pressed',String(active));
      btn.textContent=active?'♥ Сохранено':'♡ Сохранить';
    });
    $('#savedCount').textContent=state.saved.size+' '+(state.saved.size===1?'страница':'страниц');
    const holder=$('#savedList');
    holder.replaceChildren();
    if(!state.saved.size){const el=document.createElement('span');el.className='muted';el.textContent='Пока пусто.';holder.append(el);return}
    state.saved.forEach(key=>{const b=document.createElement('span');b.textContent=key==='professional'?'♡ Айгүл С.':'♡ Flora Studio';holder.append(b)});
  };
  const request = receiver=>{
    state.receiver=receiver==='company'?'company':'professional';
    $('#requestReceiver').textContent=state.receiver==='company'?'Flora Studio — компания':'Айгүл С. — лично';
    $('#requestRule').textContent=state.receiver==='company'?'Пример: отмена за 24 часа до начала':'Пример: отмена за 2 часа до начала';
    $('#requestContact').value='';
    $('#requestNote').value='';
    $('#requestDate').value='';
    requestDialog.showModal();
  };
  const updatePolicy=()=>{
    const hours=Number($('#cancelWindow').value);
    $('#policyPreview').textContent=hours ? 'За '+hours+' ч до начала' : 'До начала записи';
  };
  const updateChannels=()=>{
    const channels=['channelPhone','channelWhatsapp','channelRequest','channelCalendar'].map(x=>$('#'+x));
    const any=channels.some(x=>x.checked);
    $('#channelValidation').textContent=any ? 'Вы можете использовать выбранные способы обращения.' : 'Нужно включить хотя бы один способ связи.';
    return any;
  };
  const updatePermissionPreview=()=>{
    const fieldNames={bio:'Описание',portrait:'Фото',portfolio:'Портфолио',personalPhone:'Личный телефон'};
    const shown=Object.keys(fieldNames).filter(field=>$('[data-master-field="'+field+'"]').checked && $('[data-company-field="'+field+'"]').checked);
    $('#visibleCompanyFields').textContent=shown.length?shown.map(k=>fieldNames[k]).join(', '):'Ничего: мастер или компания не разрешили поля.';
    $$('[data-company-field]').forEach(box=>{
      const master=$('[data-master-field="'+box.dataset.companyField+'"]');
      // Company can preselect a field, but not publish it without master's grant.
      box.parentElement.style.opacity=master.checked?'1':'.5';
    });
  };
  const updateCancelWarning=()=>{
    const late=$('input[name=cancelMode]:checked').value==='late';
    $('#cancelWarning').textContent=late?'После дедлайна зарегистрированному клиенту снизится отдельная надёжность. Отмена всё равно разрешена.':'При своевременной отмене рейтинг надёжности остаётся прежним.';
    $('#cancelWarning').style.background=late?'#fff5eb':'#eef7f2';
  };
  const applySampleCancel=late=>{
    if(state.sampleCancelled)return;
    state.sampleCancelled=true;
    $('#cancelSample').closest('.request-item').hidden=true;
    $('#cancelledExample').hidden=false;
    if(late){
      state.score=83;
      $('#cancelOutcome').textContent='Поздняя отмена: демонстрационная надёжность клиента снижена (98 → 83).';
      $('#sampleAfter').textContent='В реальном продукте изменение рейтинга будет зависеть от истории, подтверждённого правила и возможности апелляции.';
    }else{
      $('#cancelOutcome').textContent='Отмена вовремя: демонстрационная надёжность осталась без изменений.';
      $('#sampleAfter').textContent='Правило: отмена до установленного дедлайна не ухудшает надёжность клиента.';
    }
    $('#clientScore').textContent=state.score;
    showToast('Запись отменена в прототипе. Уведомления обеим сторонам только симулированы.');
  };
  // Event delegation keeps page/card buttons working without hand-wiring every example.
  document.addEventListener('click', event=>{
    const page=event.target.closest('[data-page]');
    if(page){navigate(page.dataset.page);return}
    const query=event.target.closest('[data-query]');
    if(query){navigate('home',false);search(query.dataset.query);return}
    const requestButton=event.target.closest('[data-request]');
    if(requestButton){request(requestButton.dataset.request);return}
    const save=event.target.closest('[data-save]');
    if(save){const k=save.dataset.save;if(state.saved.has(k))state.saved.delete(k);else state.saved.add(k);updateSaved();showToast(state.saved.has(k)?'Страница сохранена только в этой демонстрации.':'Страница удалена из демонстрационного избранного.');return}
    if(event.target.closest('[data-open-location]')){locationDialog.showModal();return}
    const location=event.target.closest('[data-location]');
    if(location){setLocation(location.dataset.location);return}
    if(event.target.closest('[data-reset-search]')){navigate('home',false);search('');return}
    if(event.target.closest('[data-demo-contact]')){
      showToast('Демо: внешние звонки и WhatsApp отключены. Никакая связь не инициируется.');
      return;
    }
  });
  $('#placeButton').addEventListener('click',()=>locationDialog.showModal());
  $('#filterButton').addEventListener('click',()=>locationDialog.showModal());
  $('#searchForm').addEventListener('submit',event=>{
    event.preventDefault();search($('#searchInput').value);
  });
  $('#requestForm').addEventListener('submit',event=>{
    const submitter=event.submitter;
    if(submitter?.value==='cancel')return;
    event.preventDefault();
    if(!$('#requestContact').reportValidity())return;
    requestDialog.close();
    showToast('Сценарий заявки показан. Данные не отправлены, OTP не отправлялся.');
  });
  $('#cancelSample').addEventListener('click',()=>{updateCancelWarning();cancelDialog.showModal()});
  $$('input[name=cancelMode]').forEach(el=>el.addEventListener('change',updateCancelWarning));
  $('#cancelForm').addEventListener('submit',event=>{
    if(event.submitter?.value!=='confirm')return;
    event.preventDefault();
    const late=$('input[name=cancelMode]:checked').value==='late';
    cancelDialog.close();applySampleCancel(late);
  });
  $('#scoreInfo').addEventListener('click',()=>showToast('Показатель — учебная модель. Отзывы о качестве услуг считаются отдельно.'));
  $('#cancelWindow').addEventListener('change',updatePolicy);
  $$('#screen-seller input[type=checkbox]').forEach(el=>el.addEventListener('change',()=>{
    if(el.hasAttribute('data-company-field')||el.hasAttribute('data-master-field'))updatePermissionPreview();
    else updateChannels();
  }));
  const languageCopy={
    ru:{home:'Поиск',professional:'Специалист',company:'Компания',client:'Мой кабинет',seller:'Для исполнителя',search:'Найти',hint:'Какую услугу вы ищете?',intro:'УСЛУГИ РЯДОМ С ВАМИ'},
    kk:{home:'Іздеу',professional:'Маман',company:'Компания',client:'Жеке кабинет',seller:'Қызмет көрсетушіге',search:'Іздеу',hint:'Қандай қызмет іздеп жүрсіз?',intro:'ЖАҚЫН ЖЕРДЕГІ ҚЫЗМЕТТЕР'}
  };
  $('#languageSelect').addEventListener('change',event=>{
    const lang=event.target.value;
    state.language=lang;
    document.documentElement.lang=lang;
    const copy=languageCopy[lang];
    for(const p of pages){const b=$('.top-nav [data-page="'+p+'"]');if(b)b.textContent=copy[p];}
    $('#searchForm button').firstChild.textContent=copy.search+' ';
    $('#searchInput').placeholder=copy.hint;
    $('#screen-home .hero-copy .eyebrow').lastChild.textContent=' '+copy.intro;
    if(lang==='kk')showToast('Демо аударма: негізгі навигация қазақша. Толық интерфейс мәтіндері әлі дайын емес.');
    else showToast('Демонстрационный язык: русский.');
  });
  $$('.modal').forEach(d=>d.addEventListener('click',event=>{
    if(event.target===d)d.close();
  }));
  updateSaved();updatePermissionPreview();updatePolicy();updateChannels();
  const initial=location.hash.replace('#','');
  navigate(pages.includes(initial)?initial:'home',false);
})();
