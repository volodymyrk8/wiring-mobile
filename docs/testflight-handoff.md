# Передача Мише: iOS → TestFlight

Мобильный репозиторий: https://github.com/volodymyrk8/wiring-mobile, ветка `codex/web-parity`, PR https://github.com/volodymyrk8/wiring-mobile/pull/1.
Сервер: https://github.com/volodymyrk8/wiring, ветка `codex/native-parity-api`, PR https://github.com/volodymyrk8/wiring/pull/6. PR 6 включает документацию из PR 5; отдельно повторно применять её не нужно.

## Сборка

Expo SDK 57 / React Native 0.86.3. Требуются iOS 16.4+ и Xcode 26.4+; профиль EAS `testflight` фиксирует Xcode 26.6. Локально установлен Xcode 26.3, поэтому новая IPA здесь не собрана и в TestFlight не загружена.

Bundle ID: `date.wiring.app`, Apple Team: `G3T7684N3M`, версия: `1.0.0`. В app.json buildNumber `4`; EAS использует удалённую нумерацию и autoIncrement. Перед загрузкой проверить, что следующий номер выше уже загруженных сборок App Store Connect.

```sh
git clone https://github.com/volodymyrk8/wiring-mobile.git
cd wiring-mobile
git checkout codex/web-parity
npm ci --legacy-peer-deps
npm run typecheck
npm run lint
npm test
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile testflight
npx eas-cli@latest submit --platform ios --profile testflight --latest
```

При `eas init` связать репозиторий с проектом команды, сохранить полученный `extra.eas.projectId` в app.json. Нужны доступ к Expo-проекту, Apple Developer и приложению в App Store Connect; EAS предложит выбрать сертификат и provisioning profile. Секреты и сертификаты в Git не коммитить. Для push настроить APNs в этом EAS-проекте.

Профиль `testflight` обращается к `https://wiring.date`. До проверки новых OAuth, подтверждения почты, поддержки с bearer-токеном и Universal Links необходимо выложить серверный PR 6. Использовать обычную процедуру развёртывания сервера с резервной копией и обновлением схемы по его инструкциям. Провайдерские OAuth-настройки и HTTPS должны быть рабочими. Не использовать локальный HTTP-профиль `preview` для TestFlight.

После обработки сборки в App Store Connect добавить её в нужную группу TestFlight. Для внешних тестировщиков может потребоваться Beta App Review. Это передача для тестирования; публикация в App Store отдельная.

## Проверка и материалы

TypeScript, lint и 24 модульных теста проверяются перед пушем. Ранее выполнены экспорты Hermes для обеих платформ и серверные тесты. На iOS в Expo Go проверены вход локальным аккаунтом, лента, повторный показ, список чатов, поиск и открытие переписки. Исправлена ошибка обращения к уже освобождённому аудио-рекордеру при закрытии экрана.

Скриншоты: [iOS](screenshots/web-parity/ios/) и [сайт](screenshots/web-parity/web/). Синяя кнопка поверх iOS-экранов принадлежит Expo Go и не входит в интерфейс приложения. Полная матрица: [web-parity.md](web-parity.md). Android отложен по просьбе владельца.

В подписанной сборке на iPhone проверить вход и восстановление сессии, like → match → чат, отправку текста/фото/голоса, разрешения камеры/микрофона, фон/возврат, OAuth, push и Universal Links. Полная проверка всех страниц и физических устройств пока не завершена.
