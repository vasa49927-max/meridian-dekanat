// Проверка: в клиентской сборке (.next/static) нет секретов и серверного кода.
// Запуск после `npm run build`: npm run check:bundle
import fs from "node:fs";
import path from "node:path";

const root = ".next/static";
const patterns = [
  [/postgres(ql)?:\/\/[^"'\s]+/i, "строка подключения к БД"],
  [/GIGACHAT_AUTH_KEY|GIGACHAT_SCOPE/, "имя переменной ключа ИИ"],
  [/ngw\.devices\.sberbank\.ru|gigachat\.devices\.sberbank\.ru/, "адрес API GigaChat (должен вызываться только с сервера)"],
  [/\$argon2id\$/, "хэш пароля"],
  [/password_hash|token_hash/, "имена секретных колонок БД"],
  [/DATABASE_URL/, "имя переменной БД"],
  [/BEGIN (RSA |EC )?PRIVATE KEY/, "приватный ключ"],
];
for (const [k, v] of Object.entries(process.env)) {
  if (/(KEY|SECRET|PASSWORD|DATABASE_URL)/.test(k) && v && v.length >= 12) patterns.push([new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `значение переменной ${k}`]);
}
let files = 0, problems = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  if (!/\.(js|css|json|map|txt|html)$/.test(e.name)) return;
  files++;
  const text = fs.readFileSync(p, "utf8");
  for (const [re, what] of patterns) if (re.test(text)) { problems++; console.log(`✗ ${p}: найдено — ${what}`); }
});
if (!fs.existsSync(root)) { console.error("Нет .next/static — сначала npm run build"); process.exit(2); }
walk(root);
console.log(problems ? `\nНайдено проблем: ${problems}` : `✓ Проверено файлов клиентской сборки: ${files}. Секретов не найдено.`);
process.exit(problems ? 1 : 0);
