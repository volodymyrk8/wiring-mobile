# Навигация мобильного приложения

Точка входа — `expo-router/entry` из `package.json`. Expo Router читает `app/` в корне репозитория; корневой layout — `app/_layout.tsx`, вкладки — `app/(tabs)/_layout.tsx`.

Вкладки: feed, likes, chats, profile. Остальные экраны: login, register, person/[id], chat/[id], edit-profile, visibility. При выделении приложения пути и схема deep links `wiring` сохранены.

Веб-URL принадлежат Flask и Preact в [wiring/docs/router.md](https://github.com/volodymyrk8/wiring/blob/main/docs/router.md). Перенос файлов из `mobile/` в корень отдельного репозитория не меняет этот контракт.
