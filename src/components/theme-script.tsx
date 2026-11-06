/**
 * Ставит класс темы до первой отрисовки — без «вспышки» светлой темы.
 * Скрипт инлайновый, поэтому получает nonce из CSP (см. src/proxy.ts).
 */
const code = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function ThemeScript({ nonce }: { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />;
}
