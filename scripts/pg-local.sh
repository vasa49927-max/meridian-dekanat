#!/usr/bin/env bash
# Локальный PostgreSQL 16 без Docker (для песочницы разработки, см. DECISIONS D-008).
# Использование: scripts/pg-local.sh start|stop|status
set -euo pipefail
# Под root initdb не запускается — выполняем от служебного пользователя.
AS=""; if [ "$(id -u)" = "0" ]; then AS="runuser -u ${PGUSER_OS:-postgres} --"; fi
PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
# Данные БД — вне папки проекта, иначе dev-сервер Next следит за файлами WAL и бесконечно перекомпилируется.
DATA="${PGDATA_DIR:-/var/tmp/meridian-pgdata}"
PORT=${PGPORT:-5432}
case "${1:-start}" in
  start)
    if [ ! -f "$DATA/PG_VERSION" ]; then
      mkdir -p "$DATA"; [ -n "$AS" ] && chown ${PGUSER_OS:-postgres} "$DATA"; $AS "$PGBIN/initdb" -D "$DATA" -U meridian --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
    fi
    $AS "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$DATA/server.log" -w start
    "$PGBIN/createdb" -h localhost -p "$PORT" -U meridian meridian 2>/dev/null || true
    "$PGBIN/createdb" -h localhost -p "$PORT" -U meridian meridian_test 2>/dev/null || true
    echo "PostgreSQL: postgresql://meridian@localhost:$PORT/meridian";;
  stop) $AS "$PGBIN/pg_ctl" -D "$DATA" stop;;
  status) $AS "$PGBIN/pg_ctl" -D "$DATA" status;;
esac
