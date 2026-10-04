# Выделение wiring-mobile

Дата: 2026-10-04.

Источник: https://github.com/volodymyrk8/wiring.

- iOS: `a9f573a116169756d33387405c226787379546b2`.
- Android: `7dc70b2fbb586130f4814922737811e9947384bc`.
- Деревья `mobile/` совпадают. Общий код извлечён через `git subtree split --prefix=mobile`; сохранены девять мобильных коммитов, авторы и даты. Хеши коммитов изменились вследствие переноса путей в корень.
- App Store: `docs/app-store-ios.md` и `docs/screenshots/` взяты из iOS-ветки.
- Android: `docs/android-build.md` взят из Android-ветки; Google Play assets уже входят в общее дерево.
- Старые ветки исходного репозитория сохранены как история. Новые изменения мобильного приложения идут в `wiring-mobile/main` для обеих платформ.
- Контракт API и его отложенные задачи остаются в `wiring/docs/mobile-api.md`, OAuth — в `wiring/docs/social-login.md`. Это ссылки на источник истины, не отдельные копии контракта.
- Идентификаторы приложений, зависимости, экраны, API URL, конфигурации Expo/EAS и signing plugins перенесены без изменений.

Локальная рабочая копия: `/Users/volodymyrkozlov/repos/wiring-mobile`. Сборки iOS и Android, signing credentials и публикация в магазины не входят в перенос репозитория.
