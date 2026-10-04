# Навигация мобильного приложения

Точка входа — `expo-router/entry`; корневой layout — `app/_layout.tsx`. Все экраны React Native. Вкладки: home, feed, likes, chats, profile (просмотр своей анкеты), for-you (при активном доступе и opt-in). Защита сессии в layout; незаполненная анкета из основных вкладок открывает редактор.

Отдельные страницы: главная, login/register/forgot/reset/verify, onboard, person/[id], chat/[id], edit-profile, visibility, archive, consents, notifications, plus, invite, delete-account, support и юридические документы. Свой предпросмотр открывается в person/[id] и содержит переход в архив.

`src/routes.ts` и `app/+native-intent.tsx` переводят canonical URL сайта в нативный маршрут:

| URL сайта | Экран |
|---|---|
| `/sign-in`, `/sign-up` | login, register |
| `/me` | edit-profile |
| `/feed`, `/likes`, `/chats`, `/for-you` | Соответствующая вкладка |
| `/p/:id`, `/chats/:id` | person/[id], chat/[id] |
| `/r/:code` | register с referral |
| `/?verify=...`, `/?reset=...` | verify/reset с токеном |

Схема `wiring://` сохранена, OAuth возвращает `wiring://oauth` с одноразовым кодом и state. Нативный запрос обмена кодом подтверждается отдельным PKCE verifier; access/refresh не помещаются в ссылку. Deep link на защищённую страницу запоминается до входа.

`app.json` содержит iOS associated domain и Android intent filters для `wiring.date` и `wiring.club`. Нужны серверные ассоциации `/.well-known/apple-app-site-association` и `/.well-known/assetlinks.json`. API callback не должен перехватываться Universal Links. Подписание и проверка на устройстве описаны в [соответствии сайту](web-parity.md).

Веб-URL Flask/Preact не изменяются; [контракт сайта](https://github.com/volodymyrk8/wiring/blob/main/docs/router.md) остаётся источником.

Нижняя навигация сайта воспроизведена в `src/ui/ProductNav.tsx`: главная, лента, лайки, чаты и своя анкета, с дополнительной вкладкой рекомендаций при доступе. Она доступна и на отдельных страницах; редактор открывается из своей анкеты или по `/me`.
