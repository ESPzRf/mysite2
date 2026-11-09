# ESP Hosting

Концепт-лендинг хостинга выделенных серверов в японской редакционной эстетике.

## Запуск

Сборка не требуется — откройте `index.html` в браузере.

### Linux: локально

Нужен только браузер. Для локального HTTP-сервера достаточно Python 3:

```bash
cd /path/to/html
python3 -m http.server 8000 --bind 127.0.0.1
```

Откройте `http://localhost:8000`. Остановить сервер — `Ctrl+C`.

Если Python не установлен:

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y python3

# Fedora
sudo dnf install -y python3

# Arch
sudo pacman -S python
```

Альтернатива через Node.js:

```bash
cd /path/to/html
npx serve .
```

### Linux: публичный сервер через Nginx

```bash
sudo apt update && sudo apt install -y nginx
sudo mkdir -p /var/www/esp-hosting
sudo cp -r /path/to/html/. /var/www/esp-hosting/
sudo chown -R www-data:www-data /var/www/esp-hosting
```

Конфигурация `/etc/nginx/sites-available/esp-hosting`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/esp-hosting;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/esp-hosting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Для HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

PHP, база данных, Node.js и сборка не нужны. Все файлы статические. Оплата в проекте имитируется на клиенте; для реальных платежей понадобятся платёжный провайдер, серверная часть и HTTPS.

## Что реализовано

- Три тарифа выделенных серверов: Kaze, Mori и Yama.
- Выбор сервера кликом или с клавиатуры; после выбора появляется закреплённая панель оплаты.
- Демонстрационный checkout: срок аренды со скидками, бэкапы, выбор локации, карта / СБП / USDT.
- Валидация формы, имитация оплаты, экран подтверждения и скачивание демо-счёта.
- Адаптивная вёрстка, мобильное меню, FAQ-аккордеон, анимации и поддержка `prefers-reduced-motion`.
- Вся графика построена на SVG и CSS — внешних зависимостей нет.

Платежи демонстрационные: реальные списания не производятся.
