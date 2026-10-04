# WIRING Mobile

Expo (React Native + TypeScript) клиент для существующего Flask API https://github.com/volodymyrk8/wiring. Сайт и backend: [volodymyrk8/wiring](https://github.com/volodymyrk8/wiring). Контракт API: [docs/mobile-api.md](https://github.com/volodymyrk8/wiring/blob/main/docs/mobile-api.md).

## Запуск

```sh
npm ci --legacy-peer-deps
# сервер по умолчанию https://wiring.date; локально:
EXPO_PUBLIC_API_URL=http://127.0.0.1:5070 npx expo start   # iOS simulator (dev-клиент цепляет любой Metro на 8081, лучше Release-сборка, см. ниже)
EXPO_PUBLIC_API_URL=http://10.0.2.2:5070 npx expo start    # Android emulator
npm run typecheck
```

Локальный бэкенд и тестовые аккаунты (`dev@wiring.test` / `wiring-dev`) описаны в README репозитория wiring.

## Что есть
Вход и регистрация (токены в Keychain/Keystore, автообновление), лента со свайпом, лайки, чаты (история постранично, оптимистичная отправка с повтором без дублей, фото), профиль человека с жалобой и блокировкой, редактор анкеты с фото, настройки уведомлений и push, светлая и тёмная темы, экран «нужно обновление» по `426` от сервера.

## Push
Клиент получает Expo push-токен и регистрирует его на `POST /api/push/device`. Нужен EAS-проект: `npx eas-cli init` (запишет `extra.eas.projectId` в `app.json`) и ключи APNs/FCM в аккаунте Expo. Без `projectId` переключатель push покажет понятное сообщение. Пока проверено только на сервере (моки). На симуляторе push не работает.

## Проверки
```sh
npx tsc --noEmit && npx expo lint && npx expo-doctor
npm test        # node --test: транспорт (bearer, refresh, 426, ошибки), 9 тестов
```

## Сборка и релиз (EAS)
`eas.json`: профиль `preview` (внутренний APK/IPA, API `http://192.168.2.101:5070`, cleartext включён) и `production` (AAB, `https://wiring.date`, cleartext выключен). `app.config.js` включает cleartext только при `WIRING_CLEARTEXT=1`. Перед первой сборкой: `npx eas-cli login`, `npx eas-cli init` (projectId), Apple Developer и Google Play аккаунты, ключи push.

## Чего нет (следующие шаги)
- SSE/WebSocket (сейчас опрос раз в 8 с), голосовые в чате, фильтры ленты, покупка WIRING+.
- Тесты экранов (Maestro), Sentry (нужен DSN), EAS Build/Submit (нужны аккаунты).

## Сборка iOS (проверено на Xcode 27, iPhone 17 Simulator)
```sh
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # иначе CocoaPods падает на юникоде в пути
EXPO_PUBLIC_API_URL=http://127.0.0.1:5070 npx expo run:ios --configuration Release --device "iPhone 17" --no-bundler
xcrun simctl launch booted date.wiring.app
```
Release-сборка встраивает JS и не требует Metro. Debug-клиент подхватывает любой Metro на порту 8081 (у меня там оказался чужой проект), поэтому для скриншотов использовался Release.
Ошибка `osascript ... System Events` в конце `expo run:ios` безвредна: приложение уже установлено, запускать вручную командой выше.

## Известные ограничения по итогам запуска
- Лента: если тестовый аккаунт уже лайкнул всех, покажется «Пока всё». Для проверки используйте другой локальный тестовый аккаунт; не очищайте таблицы базы.
- Не проверялись: регистрация, жалоба и блокировка (кроме отрисовки), отправка сообщений, удаление аккаунта, тёмная тема, Dynamic Type/VoiceOver.

## Сборка Android (WSL, проверено)
Собрано на `mike@192.168.2.81` (WSL2 Ubuntu 22.04): JDK 17 (Temurin), Android SDK (platform 36, build-tools 36.0.0, cmake 3.22.1, NDK подтянул Gradle), Node 26. Всё в `~/dev/{tools,android-sdk,wiring-mobile}`.
```sh
export JAVA_HOME=$HOME/dev/tools/jdk17 ANDROID_HOME=$HOME/dev/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH
export EXPO_PUBLIC_API_URL=http://192.168.2.101:5070 WIRING_CLEARTEXT=1 CI=1
npm ci --legacy-peer-deps && npx expo prebuild --platform android --no-install
cd android && echo "sdk.dir=$ANDROID_HOME" > local.properties && ./gradlew assembleRelease --no-daemon
```
Результат: `android/app/build/outputs/apk/release/app-release.apk` (104 МБ, все архитектуры, 22 мин с холодным кэшем). На Mac: `build/wiring-android-release.apk`.
Подводные камни:
- При копировании проекта с Mac через tar появляются файлы `._*`; Metro падает на них. Удалять: `find . -name '._*' -not -path './node_modules/*' -delete` (или `COPYFILE_DISABLE=1 tar`).
- Баннер WSL печатается в stdout любой ssh-команды, поэтому scp и бинарный `cat` через ssh ломаются. Файлы забирать через `base64` с маркерами.
- `npm install` требует `--legacy-peer-deps` (конфликт peer-зависимостей react-dom).
- Cleartext-трафик включается только `WIRING_CLEARTEXT=1` (нужен для API по http). Без переменной сборка безопасна для production.
- APK подписан debug-ключом. Для Google Play нужен release keystore и AAB (`./gradlew bundleRelease`).

## Репозитории и общая разработка

- `wiring` — Flask, PostgreSQL, сайт и общий контракт `/api/*`.
- `wiring-mobile` — один Expo/React Native проект для iOS и Android. Рабочая ветка — `main`; платформенные сборки и релизы независимы.

Исходники из `wiring/mobile` теперь находятся в корне этого репозитория. История мобильного кода сохранена через `git subtree split` из `wiring` на коммите `a9f573a116169756d33387405c226787379546b2`; дерево `mobile/` Android-коммита `7dc70b2fbb586130f4814922737811e9947384bc` совпадало с ним. Старые ветки `mobile/ios` и `mobile/android` в `wiring` остаются историческими; новые изменения приложений делаем здесь.

[Архитектура](docs/architecture.md) · [Навигация](docs/router.md) · [Материалы App Store](docs/app-store-ios.md) · [Сборка Android](docs/android-build.md).

Сайт и приложения остаются одним продуктом: общие экраны, тексты и пять тем. Существующие задачи на синхронизацию описаны в [мобильном API](https://github.com/volodymyrk8/wiring/blob/main/docs/mobile-api.md) и [OAuth](https://github.com/volodymyrk8/wiring/blob/main/docs/social-login.md). Разделение репозиториев само по себе не реализует эти функции.
