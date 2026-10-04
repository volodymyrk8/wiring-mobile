# Архитектура WIRING Mobile

Один Expo/React Native + TypeScript проект для iOS и Android. Сайт и backend — [wiring](https://github.com/volodymyrk8/wiring). Приложения используют тот же PostgreSQL runtime и существующие HTTP-сценарии; отдельного backend для дизайна приложений нет.

- `app/` — Expo Router страницы и layout; `package.json` запускает `expo-router/entry`.
- `src/api/` — bearer транспорт без cookie, одноразовый refresh, типы и endpoints. Токены в Keychain/Keystore.
- `src/auth.tsx`, `src/features/inbox.tsx`, `src/push.ts` — сессия, badge/notices и native push.
- `src/features/feed/` — вертикальная лента, локальное состояние позиции, общие карточки рекомендаций. `/api/feed/view` вызывается при просмотре обычной ленты.
- `src/features/profile/` — черновик и сериализованное автосохранение с восстановлением AsyncStorage; устаревший ответ не стирает новый черновик.
- `src/features/chat/` — native audio и распознавание через общий API. Полное обновление переписки учитывает edit/delete; текстовые retries сохраняют client_id.
- `src/features/auth/` — системная браузерная OAuth-сессия и отдельный PKCE handoff. Сам интерфейс приложений остаётся native.
- `src/ui/` — общие шапка, Modal, подтверждение, кнопки и типографика. `src/themeTokens.ts` — CSS-палитры сайта; `src/prefs.ts` хранит одну из pastel/mist/dusk/night/slate.
- `src/routes.ts` — перевод ссылок сайта; `src/content/` — снимки общих юридических документов.
- `app.json`, `app.config.js`, `plugins/` — настройка платформ; `ios/`, `android/`, `dist/` генерируются и не коммитятся.

Native permissions, keyboard avoidance и safe areas реализуются средствами React Native/Expo. Нативные сборки, проверки экранов и push остаются отдельными от JS-экспорта. Текущее состояние и конкретные ограничения: [web-parity.md](web-parity.md).
