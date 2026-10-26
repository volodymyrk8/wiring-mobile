# Передача Мише: iOS → TestFlight

Мобильный репозиторий: https://github.com/volodymyrk8/wiring-mobile, ветка для текущей сборки `codex/trello-bugs-oct24`.
Сервер: https://github.com/volodymyrk8/wiring, ветка `codex/native-parity-api`, PR https://github.com/volodymyrk8/wiring/pull/6. PR 6 включает документацию из PR 5; отдельно повторно применять её не нужно.

## Сборка

Expo SDK 57 / React Native 0.86.3. Требуются iOS 16.4+ и Xcode 26.4+; профиль EAS `testflight` фиксирует Xcode 26.6. 26 октября 2026 локальная сборка 1.0.0 (18) успешно создана на macOS Tahoe 26.7.1 / Xcode 26.6 (17F113), iOS SDK 26.5. IPA отправлена напрямую в App Store Connect; Apple подтвердила загрузку без ошибок. Статус обработки и доступность тестировщикам проверяются отдельно.

Bundle ID: `date.wiring.app`, Apple Team: `G3T7684N3M`, версия: `1.0.0`. В app.json buildNumber `4`; EAS использует удалённую нумерацию и autoIncrement. Перед загрузкой проверить, что следующий номер выше уже загруженных сборок App Store Connect.

```sh
git clone https://github.com/volodymyrk8/wiring-mobile.git
cd wiring-mobile
git checkout codex/trello-bugs-oct24
npm ci --legacy-peer-deps
npm run typecheck
npm run lint
npm test
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile testflight
npx eas-cli@latest submit --platform ios --profile testflight --id <BUILD_ID>
```

Репозиторий связан с `@wirings-team/wiring`, projectId `849a1504-0766-4b10-a065-bcd70d7dfd7e` сохранён в app.json. На другом хосте нужен вход в Expo с доступом к команде. Сертификат App Store и provisioning profile настроены в EAS для Apple Team `G3T7684N3M`. Секреты и сертификаты в Git не коммитить. APNs в этом EAS-проекте пока не настроен.

Иконка `assets/icon.png` обновлена из веб-исходника `scripts/make_icons.py`: знак W на тёмном фоне, 1024×1024 RGB без прозрачности. Она проверена внутри IPA №18; ранее установленная сборка её не получит через OTA. Локальные проверки: typecheck, lint и 25 тестов прошли.

Предыдущая попытка №15 на Xcode 26.3 завершилась ошибкой Swift/C++ в `ExpoModulesJSI`; Xcode 26.6 устранил её. Попытки №16–17 остановились до компиляции из-за отсутствующей iOS-платформы. После установки iOS 26.5 через Xcode → Settings → Components проверка Release destination и архивирование №18 прошли. Одного наличия iOS SDK в `xcodebuild -showsdks` для проверки готовности оказалось недостаточно. Удалённый buildNumber — 18, следующий запуск с autoIncrement получит 19.

Для локальной сборки нужны Fastlane, CocoaPods и выбранный Xcode с установленной iOS-платформой. При медленном интернете сохраняйте npm/ReactNative/CocoaPods-кэши; `npm_config_prefer_offline=true` предпочитает скачанные зависимости. Вход, проверка signing credentials и отправка IPA требуют сети. Затем:

```sh
mkdir -p releases
EXPO_NO_CAPABILITY_SYNC=1 npm_config_legacy_peer_deps=true npm_config_prefer_offline=true npx eas-cli@latest build --platform ios --profile testflight --local --output ./releases/wiring-testflight.ipa
npx eas-cli@latest submit --platform ios --profile testflight --path ./releases/wiring-testflight.ipa
```

`EXPO_NO_CAPABILITY_SYNC=1` сохраняет существующие Apple capabilities: синхронизация EAS пыталась отключить `APPLE_ID_AUTH` и получила ошибку Apple API. При повторном использовании проверенных remote credentials дополнительная Apple API-авторизация может не понадобиться; если EAS запросит её, используйте учётную запись Apple или локальный ASC API key через документированные переменные окружения. Никаких ключей в репозитории нет.

Профиль `testflight` обращается к `https://wiring.date`. До проверки новых OAuth, подтверждения почты, поддержки с bearer-токеном и Universal Links необходимо выложить серверный PR 6. Использовать обычную процедуру развёртывания сервера с резервной копией и обновлением схемы по его инструкциям. Провайдерские OAuth-настройки и HTTPS должны быть рабочими. Не использовать локальный HTTP-профиль `preview` для TestFlight.

После обработки сборки в App Store Connect добавить её в нужную группу TestFlight. Для внешних тестировщиков может потребоваться Beta App Review. Это передача для тестирования; публикация в App Store отдельная.

## Проверка и материалы

TypeScript, lint и 25 модульных тестов прошли перед локальной сборкой №18. Ранее выполнены экспорты Hermes для обеих платформ и серверные тесты. На iOS в Expo Go проверены вход локальным аккаунтом, лента, повторный показ, список чатов, поиск и открытие переписки. Исправлена ошибка обращения к уже освобождённому аудио-рекордеру при закрытии экрана.

Скриншоты: [iOS](screenshots/web-parity/ios/) и [сайт](screenshots/web-parity/web/). Синяя кнопка поверх iOS-экранов принадлежит Expo Go и не входит в интерфейс приложения. Полная матрица: [web-parity.md](web-parity.md). Android отложен по просьбе владельца.

В подписанной сборке на iPhone проверить вход и восстановление сессии, like → match → чат, отправку текста/фото/голоса, разрешения камеры/микрофона, фон/возврат, OAuth, push и Universal Links. Полная проверка всех страниц и физических устройств пока не завершена.
