> Архив исходного согласованного плана. Текущий статус реализации — в README проекта и docs/STAGE-1-REPORT.md.

# Typing Arena AI — логическая схема PostgreSQL

**Статус:** проект структуры, не созданная база и не выполненные миграции. Физическая Prisma-схема будет вводиться по этапам после согласования.

## 1. Базовые правила

- Постоянная база — PostgreSQL. Источник миграций один: `packages/db/prisma`.
- Время событий хранится в UTC (`timestamptz`), локальные учебные даты — вместе с IANA timezone. Таймзона не определяется по IP без согласия.
- `Layout = RU | EN`. Поле обязательно для учебных результатов, прогресса, целей, рейтингов, матчей и турниров.
- Идентификаторы — UUID. Непредсказуемый ID не заменяет проверку доступа.
- Измеримые исходные счётчики — integers; длительность — миллисекунды; точность вычисляется из счётчиков. Рейтинг хранится с определённой точностью и единым правилом округления.
- Расход AI — целые micro-USD или другой фиксированный decimal, не floating-point деньги. Расчётная стоимость явно отличается от финального счёта провайдера.
- Крупные списки пагинируются. Основные запросы получают составные индексы; индексы и планы проверяются на репрезентативной тестовой БД.
- Содержимое уроков версионируется: изменение текста не изменяет историю старых попыток.
- Персональные данные не смешиваются с публичными представлениями. Ни один ORM User-объект не отдаётся клиенту целиком.

## 2. Аккаунты и доступ — этап 2

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `User` | id, email, emailVerified, name, createdAt, status, role | Auth-поля согласованы с Better Auth; нормализованный email уникален |
| `Account` | userId, providerId, providerAccountId, passwordHash/token fields | Схема адаптера Better Auth; уникальна пара provider + accountId; OAuth-секреты только серверу |
| `Session` | userId, token, expiresAt, session metadata | Управляется библиотекой; отозванные/истёкшие сессии невалидны |
| `Verification` | identifier, value, expiresAt | Одноразовые email/recovery challenges по схеме библиотеки |
| `TwoFactor` | userId, encryptedSecret, recovery material | Совместимо с плагином; недоступно публичным DTO |
| `AdminSessionAssurance` | sessionId, verifiedAt, method, expiresAt | Доказательство свежей 2FA текущей сессии, включая OAuth; уникальная sessionId |
| `Profile` | userId, nickname, nicknameNormalized, avatarRef, timezone, preferredLayout, learningGoalType | userId и нормализованный nickname уникальны; формат nickname ограничен |
| `PrivacySettings` | userId, showStats, showActivity, allowFriendRequests | Настройки проверяются сервером во всех публичных запросах |

Окончательные auth-поля импортируются из поддерживаемой схемы выбранной версии Better Auth, а не выдумываются по этой таблице. Роль не является редактируемым полем профиля. Стандартный аватар можно генерировать без файловых загрузок.

## 3. Обучение — этапы 2–4

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `Curriculum` | id, layout, title, version, status | Отдельные RU/EN; опубликованная версия неизменяема |
| `CourseLevel` | curriculumId, ordinal, title, unlockPolicyVersion | Уникальны curriculumId + ordinal; ordinal 1–10 |
| `Lesson` | levelId, ordinal, title, description | Уникальны levelId + ordinal |
| `Exercise` | lessonId, kind, targetKeys, difficulty | Каталог упражнения, не запись пользовательского результата |
| `ExerciseVersion` | exerciseId, revision, textVersionId, rulesJson, publishedAt | Уникальны exerciseId + revision; правила и targets валидируются |
| `TextVersion` | id, layout, content, normalizedHash, source, license, difficulty, kind | Неподвижный опубликованный текст; оригинальные/разрешённые источники |
| `LayoutProgress` | userId, layout, curriculumVersionId, unlockedLevel | Уникальны userId + layout + curriculumVersionId |
| `LessonProgress` | userId, lessonId, exerciseVersionId, bestResultId, passedAt, consecutivePasses | Прогресс не переносится автоматически между RU/EN |
| `Goal` | userId, layout, metric, target, deadline, baselineResultId, status | CPM-цель не сравнивается со статистикой другого языка/режима |

`rulesJson` — валидируемые настройки: порог точности, минимальная длина, число успешных попыток, допустимые режимы. Это не произвольный выполняемый код. При смене учебной программы старая история сохраняется; перенос прогресса — отдельная явная процедура.

## 4. Попытки и аналитика — этапы 3–4

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `TypingSession` | id, userId?, guestOwnerHash?, layout, mode, durationSec, exerciseVersionId?, textVersionId, rulesVersion, state, serverStartedAt, serverDeadline, createdAt | Ровно один владелец: пользователь или гостевая сессия; параметры после старта неизменны |
| `InputBatch` | sessionId, sequence, receivedAt, operationsJson, payloadHash | Уникальны sessionId + sequence; схема и размер операций ограничены; короткий retention |
| `TypingResult` | sessionId, correctFinalChars, attempts, correctAttempts, errors, backspaces, durationMs, validationStatus, metricsVersion, completedAt | Один результат на сессию; исходные счётчики сохраняются; финализация только сервером |
| `SessionKeyMetric` | resultId, expectedKey, attempts, errors, latencyCount, latencySum, latencySummary | Уникальны resultId + expectedKey; раскладка выводится из результата |
| `SessionNgramMetric` | resultId, ngram, sampleCount, errors, latencySummary | Уникальны resultId + ngram; недостаточные выборки явно отмечены |
| `DailyStat` | userId, layout, date, modeBucket, timezoneSnapshot, totalsJson | Материализованный агрегат, восстановимый из итогов и per-session метрик |
| `PersonalBest` | userId, layout, mode, durationSec, difficultyBucket, resultId | Рекорды только среди сопоставимых условий и допустимых результатов |
| `GuestClaim` | guestSessionId, userId, claimedAt | Гостевой результат присваивается однократно после проверки владения |

У `TypingResult` дополнительно сохраняются причины проверки, ограниченная динамика по временным отрезкам и признак достоверности измерений. Индекс истории: `(userId, layout, completedAt DESC)` через соответствующие связи/денормализованные поля с контролем согласованности.

Не хранить CPM как единственный источник истины. Умножение округлённых средних даёт ошибки; для агрегатов используются исходные суммы символов, времени и попыток. Подписи «средняя скорость» уточняют: взвешенная по длительности в выбранном режиме. Медиана тестов для AI считается отдельно.

Сырые пакеты предлагается удалять через 7 дней, спорные — через 30. После удаления возможно восстановление сводок из сохранённых счётчиков и per-session метрик, но не полное воспроизведение каждого старого нажатия. Это ограничение не скрывается.

## 5. AI и персональные планы — этап 5

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `CoachPlan` | userId, layout, date, timezone, goalId?, inputSnapshotHash, source, revision, status | source = algorithmic/openai; однозначная версия плана |
| `CoachPlanItem` | planId, ordinal, exerciseVersionId, durationSec, rationaleEvidenceIds, completedResultId? | Ссылки только на разрешённые упражнения и собственные результаты |
| `CoachConversation` | userId, layout?, createdAt | Изоляция по владельцу |
| `CoachMessage` | conversationId, role, content, createdAt, source, usageId? | Срок хранения и удаление; текст экранируется при отображении |
| `AiRequest` | userId, purpose, idempotencyKey, model, promptVersion, status, inputTokens, outputTokens, cachedTokens, estimatedCostMicroUsd, createdAt | Уникальность пользователь + назначение + idempotencyKey; без API-ключей |
| `AiBudgetBucket` | scope, scopeId, periodStart, periodEnd, limitMicroUsd, reservedMicroUsd, settledMicroUsd, requestCount | Уникальность scope + scopeId + период; атомарный лимит |
| `AiReservation` | requestId, bucketId, reservedAmount, settledAmount, status | Идемпотентное резервирование/сверка; осторожная обработка timeout |
| `AiSettingsVersion` | version, enabled, model, systemPrompt, durationLimits, requestLimits, createdBy, createdAt | Настройки доступны только уполномоченным; секрет хранится отдельно |

Ответ AI не может менять `TypingResult`, `Rating`, `role` или XP. Модель читает подготовленную статистику и возвращает валидируемое предложение. Подтверждённый пользовательский план хранится сервером по проверенным правилам.

## 6. Матчи, комнаты и рейтинг — этапы 6–7

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `Room` | id, hostId, layout, durationSec, visibility, capacity, state, inviteHash?, inviteExpiresAt | capacity 2–10; invite хранится как hash; язык/условия блокируются перед стартом |
| `RoomMember` | roomId, userId, role, joinedAt, ready | Уникальны roomId + userId; host не получает административную роль |
| `Match` | id, roomId?, layout, durationSec, textVersionId, rulesVersion, state, startsAt, endsAt, ranked, finalizedAt | Неизменяемые условия; один финальный переход |
| `MatchParticipant` | matchId, userId, typingSessionId, finalPlace?, outcome, disconnectedAt?, surrenderAt? | Уникальны matchId + userId; typingSessionId уникальна |
| `MatchFinalization` | matchId, resultVersion, decision, createdAt | matchId уникален для применённой финализации; review и исправления версионируются отдельно |
| `Rating` | userId, layout, value, wins, losses, draws, provisionalCount, leagueConfigVersion | Уникальны userId + layout |
| `RatingEvent` | matchId?, userId, layout, before, delta, after, reason, rulesVersion, createdAt | Уникален эффект matchId + userId + eventType; журнал вместо тихого reset |
| `ResultReview` | matchId/resultId, status, reasonsJson, assignedTo?, decisionBy?, decisionAt?, appeal | Решение и обоснование доступны только уполномоченным |

Матч-пул поиска и online presence находятся в Redis с TTL; они не заменяют постоянные `Match` и `RatingEvent`. Один пользователь не участвует одновременно в двух рейтинговых матчах: транзакционная проверка и отдельное уникальное активное членство/partial index.

Согласованность языка: матч, текст, участники и связанные попытки обязаны иметь одинаковый layout. Где возможно — составные внешние ключи; иначе явная транзакционная проверка и интеграционный тест. Просто совпадающий текстовый enum в нескольких таблицах не гарантирует целостность.

Применение рейтинга блокирует записи участников в стабильном порядке и выполняется вместе с финализацией. Deadlock/retry не повторяет начисление. Reset рейтинга — аудируемая операция с новой базой/компенсирующими событиями и сохранением истории.

## 7. Турниры — этап 7

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `TournamentSeries` | title, kind, recurrence, timezone, layout, templateRules, active | Ежедневная/недельная/месячная серия; локальное время и DST учитываются |
| `Tournament` | seriesId?, title, visibility, layout, startsAt, registrationClosesAt, maxPlayers, rulesVersion, state, createdBy, winnerId? | rules snapshot замораживается до начала; один layout |
| `TournamentEntry` | tournamentId, userId, seed?, checkedInAt?, status | Уникальны tournamentId + userId; нет повторной регистрации |
| `TournamentRoundMatch` | tournamentId, round, slot, matchId?, nextSlot?, status, winnerEntryId? | Уникальны tournamentId + round + slot; сетка воспроизводима |
| `TournamentInvitation` | tournamentId, inviteHash, expiresAt, usesRemaining | Для приватного участия; не раскрывает email |

Завершённые турниры не удаляются из-за выхода участника: имя может быть анонимизировано. Автоматическое создание экземпляров серии использует unique `(seriesId, startsAt)`, чтобы повтор worker job не создал два турнира. Сетка использует тот же match engine; проход без соперника не считается набранной победой для награды «Чемпион».

## 8. Друзья и публичные профили — этапы 6–7

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `Friendship` | userLowId, userHighId, requestedBy, status, createdAt, acceptedAt? | Канонически упорядоченная пара уникальна; нельзя добавить себя |
| `UserBlock` | blockerId, blockedId, createdAt | Уникальна направленная пара; блокировка сильнее приглашений |
| `MatchInvitation` | senderId, recipientId, roomId, expiresAt, status | Только допустимые получатели; принятие проверяет текущую вместимость и условия |

Публичный профиль — безопасное представление `Profile + разрешённые агрегаты`, не отдельная копия всех данных. Пользовательский block не равен административной блокировке. Спам заявками ограничивается rate limit. В поиске только nickname; нельзя получить email через фильтры или сообщения об ошибке.

## 9. Мотивация — этап 8

| Сущность | Основные поля | Ограничения / назначение |
|---|---|---|
| `XpEvent` | userId, sourceType, sourceId, reason, amount, rulesVersion, createdAt | Уникальный источник и тип награды; повтор запроса не даёт XP |
| `AchievementDefinition` | code, title, description, conditionVersion, xpReward | Условия вычисляются сервером по проверяемым событиям |
| `UserAchievement` | userId, achievementCode, earnedAt, evidenceId? | Уникальны userId + achievementCode |
| `DailyQuestSet` | userId, date, timezoneSnapshot, rulesVersion | Три задания, сгенерированные один раз на локальный день |
| `DailyQuestProgress` | questSetId, ordinal, type, target, current, rewardClaimedAt? | Уникален набор + ordinal; reward связан с XP ledger |
| `ActivityDay` | userId, localDate, timezoneSnapshot, activeSeconds, qualified | Стрик по последовательным учебным датам без требования долгих занятий |

Уровень 1–100 выводится из суммы валидных XP по версионируемой формуле. Кэш суммы не является единственным источником истины. Смена timezone действует на будущие дни по опубликованному правилу и не создаёт дополнительные награды за уже засчитанную дату.

## 10. Управление и эксплуатация — с этапа 2, расширение 9–10

- `AuditEvent`: actorId, action, targetType/Id, sanitizedChanges, reason, createdAt, correlationId. Append-only на уровне прикладных разрешений; приложение не обещает защиту от суперпользователя БД.
- `PlatformSettingsVersion`: безопасные настройки правил/тарифов/порогов, changedBy и аудит. API-ключей здесь нет.
- `OutboxEvent`: уникальный eventId, type, payload без секретов, createdAt, deliveredAt. Для надёжных фоновых эффектов при появлении worker.
- `JobExecution`: уникальный business key, статус, попытки, техническая ошибка без PII. Полезен для турниров и retention jobs.

Определения аналитики: DAU/MAU — уникальные пользователи с завершённым занятием или матчем за соответствующее окно; online — активный heartbeat в последнем согласованном интервале, не количество открытых сессий; retention — доля регистрационной когорты, вернувшаяся к обучению на D1/D7/D30. Эти определения показываются владельцу рядом с графиками.

## 11. Порядок миграций и транзакций

- Этап 2: auth, profile, privacy, admin assurance, audit, goals.
- Этап 3: каталог, версии текстов, сессии и базовые результаты.
- Этап 4: персистентная аналитика, per-session метрики, история и рекорды.
- Этап 5: планы, чат, AI usage и бюджеты.
- Этап 6: комнаты, матчи, review, рейтинг и приглашения.
- Этап 7: турниры, серии, друзья, расширенные рейтинговые представления.
- Этап 8: XP, достижения, задания, календарь.
- Этап 9: расширенные безопасные настройки и индексы админ-аналитики.

Миграции запускаются на чистой БД и на БД предыдущей версии. Production: `migrate deploy`, а не бесконтрольный `db push`. Перед необратимым изменением — бэкап и проверенный rollback/forward-fix. Контент seed создаёт настоящие учебные упражнения, но не вымышленных пользователей, матчи или результаты в production.

Критические транзакции: (1) финализация попытки и прогресса, (2) результат матча и рейтинг, (3) начисление XP, (4) резерв AI бюджета, (5) одноразовое присвоение гостевого результата, (6) смена роли/блокировка с записью аудита, (7) заполнение последнего места турнира. Для всех — конкурентные интеграционные тесты.
