# Чеклист публикации kbm.eorok.ru

Выполняет администратор сервера / владелец домена.

## A. DNS (панель eorok.ru)

1. Создать запись: `kbm` → A → IP сервера приложения.
2. Подождать распространения (обычно 5–60 минут).
3. Проверить: `nslookup kbm.eorok.ru`

## B. Сервер

1. Скопировать проект в `/var/www/kbm-contest`.
2. Запустить: `sudo bash /var/www/kbm-contest/deploy/install.sh`
3. Сохранить выведенный `ORGANIZER_PASSWORD`.
4. После готовности DNS: `sudo certbot --nginx -d kbm.eorok.ru`

## C. Приёмка

- [ ] https://kbm.eorok.ru/ открывается (форма)
- [ ] https://kbm.eorok.ru/organizer просит логин/пароль
- [ ] После входа кабинет работает, сохранение участников пишет в `data/`
- [ ] `systemctl restart kbm-contest` — данные на месте
- [ ] Есть cron-бэкап / ручной `deploy/backup-data.sh`

## D. Ссылки для рассылки

- Благочинным: https://kbm.eorok.ru/
- Организатору: https://kbm.eorok.ru/organizer  
  Логин: `organizer` (или значение `ORGANIZER_USER` из env)  
  Пароль: из `/var/www/kbm-contest/deploy/kbm-contest.env`
