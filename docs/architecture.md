# Архитектура WIRING Mobile

Один Expo/React Native + TypeScript проект для iOS и Android. Исходники находятся в корне `wiring-mobile`; сервер и сайт остаются в [wiring](https://github.com/volodymyrk8/wiring).

- `package.json` → `expo-router/entry`; маршруты и экраны — `app/`.
- `src/api/` — общий транспорт, токены и API-типы; `src/auth.tsx` — состояние авторизации.
- `src/ui/` — общие компоненты; `src/theme.ts` — темы; `src/push.ts` — push.
- `app.json`, `app.config.js`, `plugins/` — настройки обеих платформ и config plugins.
- `eas.json` — профили сборок; `store/` и `docs/` — материалы магазинов.
- `ios/` и `android/` генерируются Expo и не коммитятся.

Приложения используют существующий Flask `/api/*`; база остаётся PostgreSQL на сервере. Источник контракта — [docs/mobile-api.md](https://github.com/volodymyrk8/wiring/blob/main/docs/mobile-api.md). URL API, идентификаторы приложений и настройки подписания при выделении не менялись. EAS-проект, APNs/FCM и аккаунты магазинов настраиваются отдельно; создание репозитория не создаёт их.

Сайт и приложения — один продукт. Общий набор тем: pastel (утро), mist (день), dusk (сумерки), night (ночь), slate (полночь). Существующие расхождения и отложенные функции исправляются отдельными задачами, разделение репозитория их не меняет.
