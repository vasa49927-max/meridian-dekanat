// Генератор трёх вариантов главного экрана «Сегодня» для контрольной точки (а).
// Один и тот же контент и семантика, три разных визуальных направления.
import fs from 'node:fs';
const icon = (n, cls = 'i') =>
  fs.readFileSync(`node_modules/lucide-static/icons/${n}.svg`, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace('<svg', `<svg class="${cls}" aria-hidden="true"`)
    .replace(/width="24"|height="24"/g, '');

const logo = `<svg class="logo" viewBox="0 0 40 40" role="img" aria-label="Меридиан">
  <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M20 3c-6.5 4.5-9.5 10.2-9.5 17s3 12.5 9.5 17M20 3c6.5 4.5 9.5 10.2 9.5 17s-3 12.5-9.5 17" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M5 26h30" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M31.5 4.5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" class="star"/>
</svg>`;

const nav = [
  ['sun', 'Сегодня', true], ['calendar-days', 'Расписание'], ['graduation-cap', 'Успеваемость'],
  ['file-text', 'Заявки'], ['bell', 'Уведомления'], ['sparkles', 'Помощник'], ['users', 'Запись к методисту'],
];
const tabs = [['sun', 'Сегодня', true], ['calendar-days', 'Расписание'], ['graduation-cap', 'Учёба'], ['file-text', 'Заявки'], ['menu', 'Ещё']];

const html = (v) => `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Меридиан — вариант ${v.id}</title>
<link rel="stylesheet" href="node_modules/@fontsource/golos-text/400.css">
<link rel="stylesheet" href="node_modules/@fontsource/golos-text/500.css">
<link rel="stylesheet" href="node_modules/@fontsource/golos-text/600.css">
<link rel="stylesheet" href="node_modules/@fontsource/golos-text/700.css">
<link rel="stylesheet" href="node_modules/@fontsource/pt-serif/700.css">
<link rel="stylesheet" href="node_modules/@fontsource/unbounded/600.css">
<link rel="stylesheet" href="base.css"><link rel="stylesheet" href="${v.css}">
</head><body class="v-${v.id}">
<div class="app">
<aside class="side">
  <div class="brand">${logo}<span>Меридиан</span></div>
  <nav aria-label="Разделы">${nav.map(([i, t, a]) => `<a href="#" class="${a ? 'on' : ''}" ${a ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span>${t === 'Уведомления' ? '<b class="cnt">3</b>' : ''}</a>`).join('')}</nav>
  <div class="me"><div class="ava">АС</div><div><b>Анна Соколова</b><small>МЭО · 2 курс · 2.2</small></div></div>
</aside>
<main>
  <header class="top">
    <div class="mbrand">${logo}</div>
    <div class="hello"><small>Пятница, 6 ноября</small><h1>Доброе утро, Анна</h1></div>
    <div class="acts">
      <button class="ib search" aria-label="Поиск">${icon('search')}<span class="kbd">Поиск по кабинету&nbsp;&nbsp;⌘K</span></button>
      <button class="ib" aria-label="Уведомления, 3 новых">${icon('bell')}<b class="dot">3</b></button>
    </div>
  </header>

  <div class="grid">
  <section class="hero card" aria-label="Следующая пара">
    <div class="hero-top"><span class="pill live">Следующая пара</span><span class="count">через <b>25 мин</b></span></div>
    <h2>Международные финансовые рынки</h2>
    <p class="meta">10:40–12:10 · Семинар · ауд. 3047, корпус А</p>
    <p class="meta2">${icon('map-pin', 'i s')}пр. Вернадского, 76 · 4 мин пешком от главного входа</p>
    <div class="teacher"><div class="ava sm">КМ</div>доц. Ковалёва М. Р.</div>
    <div class="bar"><i style="width:72%"></i></div>
  </section>

  <section class="change card" role="status">
    ${icon('arrow-left-right')}
    <div><b>Перенос пары</b><p>Деловой английский: <s>пт 14:00, ауд. 412</s> → <b>чт 12 нояб., 10:30, ауд. 1018</b></p></div>
  </section>

  <section class="day card"><h3>Сегодня · 3 пары</h3>
    <ol class="tl">
      <li class="done"><time>09:00</time><div><b>Макроэкономика</b><small>Лекция · ауд. 2001</small></div></li>
      <li class="now"><time>10:40</time><div><b>Международные финансовые рынки</b><small>Семинар · ауд. 3047</small></div></li>
      <li><time>12:55</time><div><b>Испанский язык</b><small>Практика · ауд. 518 · подгруппа 2</small></div></li>
      <li class="moved"><time>14:30</time><div><b>Деловой английский</b><small>Перенесена на чт 12 нояб.</small></div></li>
    </ol></section>

  <section class="dl card"><h3>Ближайшие сроки</h3>
    <ul class="list">
      <li><span class="d hot">сегодня</span><div><b>Эссе по МФР</b><small>загрузить в LMS до 23:59</small></div></li>
      <li><span class="d">11 нояб.</span><div><b>Коллоквиум по макроэкономике</b><small>нужно ≥ 70% для автомата</small></div></li>
      <li><span class="d">15 нояб.</span><div><b>Запись на курсы по выбору</b><small>весенний семестр</small></div></li>
    </ul></section>

  <section class="rq card"><h3>Мои заявки</h3>
    <ul class="list">
      <li><span class="st ok">${icon('check', 'i s')}Готова</span><div><b>Справка для военкомата</b><small>электронная, с QR-кодом</small></div></li>
      <li><span class="st wip">${icon('loader', 'i s')}В работе</span><div><b>Справка об обучении (англ.)</b><small>для посольства · готова к 9 нояб.</small></div></li>
    </ul><a class="more" href="#">Заказать справку →</a></section>

  <section class="gr card"><h3>Как дела с учёбой</h3>
    <div class="score"><b>82,4</b><small>средний балл<br>из 100</small></div>
    <p class="sm">Автомат по <b>3 из 6</b> дисциплин. <span class="risk">Риск:</span> статистика — не хватает 6 баллов до 60.</p>
  </section>

  <section class="ai card"><div class="ai-h">${icon('sparkles')}<b>Помощник деканата</b></div>
    <p class="sm">«Какую справку взять для визы?» · «Что у меня с сессией?»</p>
    <div class="ask">Спроси деканат…${icon('arrow-up', 'i s')}</div></section>

  <section class="news card"><h3>Объявления</h3>
    <ul class="list">
      <li><span class="tag">Деканат МЭО</span><div><b>Продление приёма заявлений на стажировки до 20 ноября</b></div></li>
      <li><span class="tag">Студсовет</span><div><b>Модель ООН: регистрация делегатов открыта</b></div></li>
    </ul></section>
  </div>

  <footer class="foot">Концепт для конкурса МГИМО по ИИ. Не является официальным сервисом МГИМО. Все данные вымышлены.</footer>
</main>
<nav class="tabs" aria-label="Разделы">${tabs.map(([i, t, a]) => `<a href="#" class="${a ? 'on' : ''}">${icon(i)}<span>${t}</span></a>`).join('')}</nav>
</div></body></html>`;

for (const v of [
  { id: 'a', css: 'a.css' }, { id: 'b', css: 'b.css' }, { id: 'c', css: 'c.css' },
]) fs.writeFileSync(`variant-${v.id}.html`, html(v));
console.log('ok');
