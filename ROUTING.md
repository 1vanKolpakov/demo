# Как работает роутинг

## Структура файлов (FSD)

```
src/
├── app/
│   ├── store.ts                       Redux store, RootState, AppDispatch
│   ├── router.tsx                     createBrowserRouter — сборка всех роутов
│   └── App.tsx                        провайдеры, запуск loadUser при старте
│
├── pages/
│   ├── administration/
│   │   ├── config.tsx                 adminRouteConfig + тип AdminRouteConfigWithPrivileges
│   │   ├── routes.tsx                 buildRoutes()
│   │   └── index.ts                   публичный API страницы
│   ├── vm-order/index.tsx
│   ├── forbidden/index.tsx            403
│   └── not-found/index.tsx            404
│
├── widgets/
│   ├── layout/ui/Layout.tsx           основная навигация + <Outlet>
│   └── admin-layout/ui/AdminLayout.tsx  двухуровневые табы + <Outlet>
│
├── features/
│   └── access-control/
│       ├── model/
│       │   ├── privilege-utils.ts     hasPrivilegeAccess, реестр исключений
│       │   ├── useExceptionContext.ts Redux → контекст исключений
│       │   └── useRouteAccess.ts      canAccess, isReady
│       ├── ui/
│       │   ├── RequireAuth.tsx        guard-компонент (403 при отказе)
│       │   └── DynamicIndexRedirect.tsx  редирект на первый доступный роут
│       └── index.ts
│
├── entities/
│   ├── user/
│   │   ├── model/types.ts             интерфейс User
│   │   ├── model/privileges.ts        enum UserPrivileges
│   │   ├── model/slice.ts             userSlice, loadUser
│   │   ├── api/index.ts               fetchCurrentUser + моки юзеров
│   │   └── index.ts
│   └── group/
│       ├── model/slice.ts             groupsSlice, loadUserAdminGroups
│       ├── api/index.ts               fetchUserAdminGroups + моки групп
│       └── index.ts
│
└── shared/
    ├── api/mockConfig.ts              ACTIVE_SCENARIO — переключение сценария
    └── store/hooks.ts                 useAppSelector, useAppDispatch
```

---

## Структура URL-роутов

```
/                          → widgets/layout/ui/Layout.tsx
├── /                      → pages/vm-order/index.tsx
├── /administration        → widgets/admin-layout/ui/AdminLayout.tsx
│   ├── (index)            → features/access-control/ui/DynamicIndexRedirect.tsx
│   ├── role-model/stands
│   ├── role-model/stand-categories
│   ├── role-model/groups
│   ├── role-model/roles
│   ├── role-model/users
│   ├── software/ssw
│   ├── software/playbooks
│   ├── software/vmprofiles
│   └── software/clusters
└── *                      → pages/not-found/index.tsx
```

Все роуты под `/administration` плоские — вложенность визуальная (через табы), а не роутерная.

---

## Шаг 1 — Конфигурация роутов

**Файл:** `pages/administration/config.tsx`

Единственный источник правды об админских роутах. Каждый элемент описывает:

- `id` — уникальный идентификатор
- `path` — абсолютный путь (`/administration/role-model/stands`)
- `label` — заголовок таба
- `privileges` — массив из `UserPrivileges`. Пустой массив (`[]`) — доступен всем.
- `element` — React-компонент страницы
- `children` — вложенные роуты (второй уровень табов)

Структура двухуровневая: верхний уровень (`role-model`, `software`) — группы-табы, нижний уровень — конкретные страницы.

---

## Шаг 2 — Сборка роутов

**Файл:** `pages/administration/routes.tsx`  
**Используется в:** `app/router.tsx`

`buildRoutes()` вызывается один раз при создании роутера. Возвращает `RouteObject[]` для React Router.

Что делает:
1. Проходит по `adminRouteConfig`
2. Если у элемента есть `children` — итерирует по детям, иначе берёт сам элемент
3. Каждый роут оборачивает в `<RequireAuth privileges={...}>`

Роутер статичный — все страницы зарегистрированы всегда. Контроль доступа — на уровне компонентов.

---

## Шаг 3 — Проверка доступа

**Файл:** `features/access-control/model/privilege-utils.ts`

Ядро системы прав. Не знает ни о Redux, ни о конкретных полях пользователя.

### `hasPrivilegeAccess(privileges, user, ctx)`

```
privileges = []         → true  (нет ограничений)
privileges = ['stands'] → user.privileges.includes('stands')
                        → или PRIVILEGE_EXCEPTIONS['stands'](user, ctx)
```

### Реестр исключений `PRIVILEGE_EXCEPTIONS`

```ts
const PRIVILEGE_EXCEPTIONS = {
  [UserPrivileges.STANDS]: (_user, ctx) => Boolean(ctx['isGroupAdmin']),
};
```

Каждое исключение — функция `(user, ctx) => boolean`. Добавить новое исключение = добавить запись в реестр. Ядро (`hasPrivilegeAccess`) при этом не меняется.

### Контекст исключений

**Файл:** `features/access-control/model/useExceptionContext.ts`

Единственное место, которое знает как данные из Redux-слайсов превращаются в контекст исключений:

```ts
export function useExceptionContext() {
  const adminGroupIds = useAppSelector((s) => s.groups.adminGroupIds);
  return { isGroupAdmin: adminGroupIds.length > 0 };
}
```

---

## Шаг 4 — Загрузка данных

**Старт приложения** (`app/App.tsx`) — загружается только пользователь (`loadUser` из `entities/user`).

**Данные о группах** (`loadUserAdminGroups` из `entities/group`) загружаются лениво — только когда пользователь впервые открывает `/administration`. Это делается в `widgets/admin-layout/ui/AdminLayout.tsx` через `useEffect`:

```ts
useEffect(() => {
  if (!groupsInitialized && !groupsLoading) {
    dispatch(loadUserAdminGroups());
  }
}, [groupsInitialized, groupsLoading]);
```

Флаг `groups.initialized` предотвращает повторный запрос при повторном заходе.  
Пока `initialized === false`, `AdminLayout` рендерит `null`.

---

## Шаг 5 — RequireAuth

**Файл:** `features/access-control/ui/RequireAuth.tsx`

Оборачивает каждый конечный роут. Срабатывает при рендере, читает стор напрямую.

```
user не загружен  → null (ждём)
нет доступа       → <ForbiddenPage />  (pages/forbidden)
есть доступ       → рендерим children
```

Защита от прямого ввода URL. Например, пользователь с `privileges: ['software']` вводит `/administration/role-model/roles` — `RequireAuth` показывает 403.

---

## Шаг 6 — DynamicIndexRedirect

**Файл:** `features/access-control/ui/DynamicIndexRedirect.tsx`

Рендерится при заходе на `/administration` (индексный роут). Ждёт `isReady`, потом:

1. Итерирует `adminRouteConfig` (из `pages/administration`) сверху вниз
2. Первый доступный роут → `<Navigate to={path} replace />`
3. Если доступных роутов нет → `<ForbiddenPage />`

Пример для пользователя с `privileges: ['software']`:
- `stands` — нет привилегии, нет групп → пропуск
- `stand-categories` → пропуск
- `groups` — `privileges: []` → **доступен**, редирект на `/administration/role-model/groups`

---

## Шаг 7 — AdminLayout и табы

**Файл:** `widgets/admin-layout/ui/AdminLayout.tsx`

После `initialized === true` рендерит двухуровневую навигацию.

**Первый уровень** — группы (`role-model`, `software`). Видна если хотя бы один дочерний роут доступен:
```ts
adminRouteConfig.filter(item =>
  item.children.some(c => canAccess(c.privileges))
)
```

Клик по группе ведёт на первый доступный дочерний роут.

**Второй уровень** — страницы внутри активной группы. Активная группа — по `pathname.startsWith(item.path)`.

Ниже табов — `<Outlet />`, который рендерит текущую страницу.

---

## Хук useRouteAccess

**Файл:** `features/access-control/model/useRouteAccess.ts`  
**Используется в:** `AdminLayout`, `DynamicIndexRedirect`

```ts
const { canAccess, isReady } = useRouteAccess();
```

- `isReady` — `true` когда оба запроса (пользователь и группы) завершены
- `canAccess(privileges)` — вызывает `hasPrivilegeAccess` с пользователем и контекстом исключений

---

## Пример: пользователь без привилегий, но с группами

Сценарий `groupAdminOnly` в `shared/api/mockConfig.ts`:  
`privileges: []`, `fetchUserAdminGroups` → `['group-devops', 'group-backend']`

| Этап | Состояние |
|------|-----------|
| Старт | `user: null`, `groups.initialized: false` |
| После `loadUser` | `user: { privileges: [] }` |
| Переход на `/administration` | `AdminLayout` монтируется, диспатчит `loadUserAdminGroups` |
| После запроса групп | `adminGroupIds: ['group-devops', ...]`, `initialized: true` |
| `useExceptionContext` | `{ isGroupAdmin: true }` |
| `DynamicIndexRedirect` | `stands` — нет привилегии, но `isGroupAdmin: true` → исключение → редирект |
| Таб `Role model` виден | `stands` доступен через исключение |
| Таб `Software` не виден | нет ни одного доступного дочернего роута |
| Прямой URL `/administration/role-model/roles` | `RequireAuth` → 403 |

---

## Как добавить новый раздел

1. Добавить значение в `UserPrivileges` — `entities/user/model/privileges.ts`
2. Добавить элемент в `adminRouteConfig` — `pages/administration/config.tsx`
3. Если нужно исключение — добавить запись в `PRIVILEGE_EXCEPTIONS` в `features/access-control/model/privilege-utils.ts`; если нужны новые данные из API — расширить `useExceptionContext.ts`

Роутер пересоберётся автоматически через `buildRoutes()`.

---

## Переключение мок-сценария

**Файл:** `shared/api/mockConfig.ts` — одна строка:

```ts
export const ACTIVE_SCENARIO: MockScenarioKey = 'groupAdminOnly';
```

| Сценарий | Привилегии | Группы | Результат |
|---|---|---|---|
| `fullAdmin` | все | нет | все табы |
| `softwareFull` | SOFTWARE, VMPROFILES, CLUSTERS | нет | весь software |
| `softwarePartial` | SOFTWARE | нет | только ssw и playbooks |
| `roleModelFull` | STANDS, STAND_CATEGORIES, ROLES, USERS | нет | весь role-model |
| `groupAdminOnly` | нет | есть | stands (исключение) + groups (public) |
| `noAccess` | нет | нет | только groups (public) |
