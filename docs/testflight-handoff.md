# Передача Мише: iOS → TestFlight

Мобильный репозиторий: https://github.com/volodymyrk8/wiring-mobile, актуальная ветка `main`.
Сервер: https://github.com/volodymyrk8/wiring, `main`. Первичное заполнение и свободный выбор изображения выложены в production через https://github.com/volodymyrk8/wiring/pull/14; мобильные изменения — https://github.com/volodymyrk8/wiring-mobile/pull/6.

## Последний выпуск

26 октября 2026 локально собрана и выпущена **1.0.0 (19)**. Среда: macOS Tahoe 26.7.1, Xcode 26.6 (17F113), iOS SDK 26.5, Expo SDK 57 / React Native 0.86.3. Поддерживаются iOS 16.4+.

IPA `releases/wiring-testflight19.ipa` (24,2 МБ) подписана для `date.wiring.app`, Apple Team `G3T7684N3M`, и отправлена напрямую в App Store Connect. Apple подтвердила загрузку без ошибок, `processingState=VALID`, Beta App Review — `APPROVED`, внутреннее и внешнее состояния — `IN_BETA_TESTING`. Сборка подтверждена в группе **Friends** с Леной и остальными внешними тестировщиками; `autoNotifyEnabled=true`. Delivery/build ID: `e70593f5-b26e-4ca1-89de-9428dcb66798`.

Сборка 19 добавляет обязательный короткий экран имени, возраста и изображения без выдуманных «Участник/18». Черновики и загрузка картинки не публикуют анкету; публикация выполняется отдельной кнопкой. Галочка «только свои фото» убрана: можно использовать фото, рисунок или мем. Модерация изображений и отдельное согласие на выбранные особенности сохраняются. Общая W-иконка сайта, RU/EN и предыдущие исправления чата также входят в сборку.

**Каждый новый выпуск добавлять во внешнюю группу Friends**, отправлять на Beta App Review и проверять доступность внешним тестировщикам. Успешная загрузка IPA и внутренний TestFlight сами по себе не доставляют обновление Лене. Публикация в App Store — отдельный процесс.

## Повторная локальная сборка

Проект связан с `@wirings-team/wiring`, projectId `849a1504-0766-4b10-a065-bcd70d7dfd7e`. Профиль `testflight` фиксирует Xcode 26.6 для облака; локально используется выбранный Xcode. Удалённый buildNumber — 19, следующий запуск с autoIncrement получит 20; `ios.buildNumber` в app.json не определяет номер EAS-сборки.

```sh
git checkout main
npm ci --legacy-peer-deps --prefer-offline
npm run typecheck
npm run lint
npm test
mkdir -p releases
EXPO_NO_CAPABILITY_SYNC=1 npm_config_legacy_peer_deps=true npm_config_prefer_offline=true npx eas-cli@latest build --platform ios --profile testflight --local --output ./releases/wiring-testflight.ipa
```

Нужны доступ к команде Expo, Fastlane, CocoaPods, Xcode с установленной iOS-платформой и свободное место. При медленном интернете сохраняйте npm/ReactNative/CocoaPods-кэши. Вход, проверка signing credentials и отправка IPA требуют сети. Для отправки доступны EAS Submit либо прямая загрузка Apple `xcrun altool` с собственным ASC API key; прямая загрузка не передаёт IPA через сервер Expo. После загрузки выполнить внешнее распространение, описанное выше.

`EXPO_NO_CAPABILITY_SYNC=1` сохраняет существующие Apple capabilities: прежняя синхронизация EAS пыталась отключить `APPLE_ID_AUTH`. Сертификат и provisioning profile настроены в EAS. Секреты и сертификаты не хранить в Git. APNs в EAS-проекте пока не настроен; уведомления TestFlight от Apple не подтверждают работу push внутри приложения.

Профиль задаёт `https://wiring.date`; конфигурация нормализует прежний адрес к `https://wiring.club`. Не использовать локальный HTTP-профиль `preview` для TestFlight. Сервер с `needs_profile_setup` и отменённым требованием own-photo checkbox уже выложен перед сборкой 19.

История подготовки: Xcode 26.3 давал ошибку Swift/C++ в ExpoModulesJSI (попытка 15). Попытки 16–17 остановились из-за отсутствующей iOS-платформы; после установки через Xcode → Settings → Components сборки 18 и 19 прошли. Одного `xcodebuild -showsdks` недостаточно для проверки готовности — Release destination также должен быть доступен.

## Проверки и материалы

Перед выпуском прошли 199 серверных Python-тестов, web typecheck/build/router/i18n/profile autosave, браузерный сценарий первого заполнения на мобильной ширине, а также mobile typecheck/lint и 25 тестов. Production CI и deploy завершились успешно; публичные health, каталог и новый profile bundle проверены без production-аккаунтов.

Физический iPhone с новой сборкой в этой проверке не использовался. Проверка всех экранов, VoiceOver, разрешений, реальных OAuth/push и Universal Links остаётся отдельной приёмкой. Android-релиз отложен по просьбе владельца.

Скриншоты прошлой проверки: [iOS](screenshots/web-parity/ios/) и [сайт](screenshots/web-parity/web/). Синяя кнопка поверх iOS-экранов принадлежит Expo Go, а не приложению. [Матрица соответствия](web-parity.md).
