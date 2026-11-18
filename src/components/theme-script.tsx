/**
 * Ставит класс темы до первой отрисовки — без «вспышки» светлой темы.
 * Скрипт инлайновый, поэтому получает nonce из CSP (см. src/proxy.ts).
 * Раунд 9 (аудит UX): итоговую тему дублируем в cookie `theme-r` — корневой layout ставит класс `dark` на <html> уже на сервере.
 * Иначе при показе 404 на клиенте React пересоздавал <html> без класса, и тёмная тема «пропадала».
 */
const code = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.cookie='theme-r='+(d?'dark':'light')+';path=/;max-age=31536000;samesite=lax'}catch(e){}})()`;

export function ThemeScript({ nonce }: { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />;
}
