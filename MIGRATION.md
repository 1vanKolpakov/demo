# План внедрения роутинга

Отправная точка: в реальном приложении уже есть работающий роутинг и `AdminLayout`.  
Цель: внедрить систему привилегий, исключений, динамического редиректа и `AdminMenuItem`-совместимых табов.

---

## Шаг 1 — `UserPrivileges` enum

**Что сделать:** убедиться, что в проекте есть enum со всеми значениями привилегий.

```ts
export enum UserPrivileges {
  STANDS = 'stands',
  SOFTWARE = 'software',
  // ... все значения, которые приходят от API
}
```

**Проверка:** значения enum совпадают со строками, которые приходят в `user.privileges` от бэкенда.

---

## Шаг 2 — Redux-слайс для групп

Это отдельный API-запрос, независимый от загрузки юзера.

**Что создать:** `groupsSlice` с полями:

```ts
interface GroupsState {
  adminGroupIds: string[];
  loading: boolean;
  initialized: boolean; // ключевой флаг — предотвращает повторный запрос
  error: string | null;
}
```

**Thunk:** `loadUserAdminGroups` — вызывает эндпоинт, который возвращает массив ID групп где юзер является администратором.

**Подключить** редьюсер в `store`.

**Проверка:** вызвать `dispatch(loadUserAdminGroups())` вручную из DevTools или временного `useEffect`, убедиться что `state.groups.adminGroupIds` заполняется.

---

## Шаг 3 — `privilege-utils`

**Что создать:** файл с функцией `hasPrivilegeAccess` и реестром исключений.

```ts
type PrivilegeExceptionFn = (user: User, ctx: Record<string, unknown>) => boolean;

const PRIVILEGE_EXCEPTIONS: Partial<Record<UserPrivileges, PrivilegeExceptionFn>> = {
  [UserPrivileges.STANDS]: (_user, ctx) => Boolean(ctx['isGroupAdmin']),
};

function hasPrivilegeAccess(privileges, user, ctx = {}): boolean {
  if (privileges.length === 0) return true;
  return privileges.some(
    (p) => user.privileges.includes(p) || (PRIVILEGE_EXCEPTIONS[p]?.(user, ctx) ?? false)
  );
}
```

**Важно:** функция не знает ничего про Redux и конкретные поля юзера — только вызывает зарегистрированное исключение.

**Проверка:** покрыть unit-тестами три сценария:
- пустой `privileges` → `true`
- есть привилегия в `user.privileges` → `true`
- нет привилегии, но исключение возвращает `true` → `true`

---

## Шаг 4 — `useExceptionContext`

**Что создать:** хук, который единственный знает как данные из Redux превращаются в контекст исключений.

```ts
export function useExceptionContext() {
  const adminGroupIds = useAppSelector((s) => s.groups.adminGroupIds);
  return useMemo(() => ({ isGroupAdmin: adminGroupIds.length > 0 }), [adminGroupIds]);
}
```

**Правило:** при добавлении нового исключения, которому нужны данные из стора — расширять только этот файл.

---

## Шаг 5 — `useRouteAccess`

**Что создать:** хук, комбинирующий юзера, контекст и флаг готовности.

```ts
export function useRouteAccess() {
  const user = useAppSelector((s) => s.user.data);
  const groupsInitialized = useAppSelector((s) => s.groups.initialized);
  const ctx = useExceptionContext();

  const isReady = user !== null && groupsInitialized;

  const canAccess = useCallback(
    (privileges: UserPrivileges[]) => {
      if (!user) return false;
      return hasPrivilegeAccess(privileges, user, ctx);
    },
    [user, ctx]
  );

  return { canAccess, isReady };
}
```

**Проверка:** временно вызвать в любом компоненте, `console.log({ isReady, canAccess([UserPrivileges.STANDS]) })`.

---

## Шаг 6 — `AdminRouteConfigWithPrivileges` и `adminRouteConfig`

Это самый трудоёмкий шаг — перевести существующий конфиг роутов в новый формат.

**Интерфейс:**

```ts
interface AdminRouteConfigWithPrivileges {
  id: string;
  path: string;       // абсолютный путь: '/administration/role-model/stands'
  label: string;      // заголовок таба
  privileges?: UserPrivileges[];  // [] = доступен всем
  element?: JSX.Element;
  children?: AdminRouteConfigWithPrivileges[];
}
```

**Правила при переводе:**
- Верхний уровень (`role-model`, `software`) — группы, `children` содержат конкретные страницы
- `privileges: []` — роут доступен всем аутентифицированным пользователям
- `privileges` у верхнего уровня с `children` не используются — видимость родителя выводится из детей
- `element` — компонент страницы, не JSX-разметка. Если страница ещё не готова, можно оставить `undefined`

**Проверка:** убедиться что все существующие страницы администрирования покрыты конфигом, ничего не пропущено.

---

## Шаг 7 — `RequireAuth`

**Что создать:** компонент-обёртка, который проверяет доступ при рендере.

```tsx
const RequireAuth: React.FC<{ privileges: UserPrivileges[]; children: ReactNode }> = ({
  privileges,
  children,
}) => {
  const user = useAppSelector((s) => s.user.data);
  const ctx = useExceptionContext();

  if (!user) return null;
  if (!hasPrivilegeAccess(privileges, user, ctx)) return <ForbiddenPage />;
  return <>{children}</>;
};
```

**Назначение:** защита от прямого ввода URL. Роутер статичный — все роуты зарегистрированы, `RequireAuth` решает что показать.

---

## Шаг 8 — `buildRoutes`

Скорее всего этот шаг уже начат. Привести к виду:

```ts
export function buildRoutes(): RouteObject[] {
  return adminRouteConfig.flatMap((topItem) =>
    topItem.children?.length
      ? topItem.children.map(buildRouteObject)
      : [buildRouteObject(topItem)]
  );
}

function buildRouteObject(route): RouteObject {
  return {
    path: route.path,
    element: route.element ? (
      <RequireAuth privileges={route.privileges ?? []}>
        {route.element}
      </RequireAuth>
    ) : undefined,
  };
}
```

**Что проверить:**
- пути в `adminRouteConfig` абсолютные (`/administration/role-model/stands`) — React Router в дочернем роуте с абсолютным путём матчит правильно
- у роутов без `element` нет fallback-обёртки

---

## Шаг 9 — `DynamicIndexRedirect`

**Что создать:** компонент для индексного роута `/administration`.

```tsx
const DynamicIndexRedirect = () => {
  const { canAccess, isReady } = useRouteAccess();

  if (!isReady) return null;

  for (const topItem of adminRouteConfig) {
    const children = topItem.children ?? [];
    if (children.length) {
      const child = children.find((c) => canAccess(c.privileges ?? []));
      if (child) return <Navigate to={child.path} replace />;
    } else if (canAccess(topItem.privileges ?? [])) {
      return <Navigate to={topItem.path} replace />;
    }
  }

  return <ForbiddenPage />;
};
```

**Проверка:** зайти на `/administration` под каждым типом пользователя, убедиться что редирект ведёт на правильную страницу.

---

## Шаг 10 — `AdminLayout` и `useAdminLayout`

### 10a — `AdminMenuItem`

```ts
// Временно определить локально, потом заменить импортом из UI-библиотеки
interface AdminMenuItem {
  value: string;  // path
  header: string; // label
}
```

### 10b — `useAdminLayout`

Вынести из компонента в отдельный файл (`model/useAdminLayout.ts`):

- Ленивый запрос групп через `useEffect` (только если `!initialized && !loading`)
- Вычисление `topMenuItems` и `subMenuItems` как `AdminMenuItem[]`
- Определение `activeTopValue` и `activeSubValue`
- `handleTopSelect` — найти элемент конфига, навигироваться на первый доступный дочерний
- `handleSubSelect` — навигироваться напрямую по `value`

### 10c — Сам `AdminLayout`

```tsx
const AdminLayout = () => {
  const { groupsInitialized, topMenuItems, subMenuItems,
          activeTopValue, activeSubValue,
          handleTopSelect, handleSubSelect } = useAdminLayout();

  if (!groupsInitialized) return null;

  return (
    <>
      <UITabs items={topMenuItems} value={activeTopValue} onSelect={handleTopSelect} />
      <UITabs items={subMenuItems} value={activeSubValue} onSelect={handleSubSelect} />
      <Outlet />
    </>
  );
};
```

**Что проверить:**
- табы первого уровня показывают только секции, где хотя бы один дочерний роут доступен
- табы второго уровня обновляются при смене активной секции
- активный таб подсвечивается правильно при прямом заходе по URL

---

## Шаг 11 — Подключение в роутер

```tsx
{
  path: 'administration',
  element: <AdminLayout />,
  children: [
    { index: true, element: <DynamicIndexRedirect /> },
    ...buildRoutes(),
  ],
}
```

**Что проверить после подключения:**
- `buildRoutes()` не генерирует конфликты путей с существующими роутами
- индексный роут `/administration` редиректит корректно
- обновление страницы (F5) на любом admin-роуте не ломает состояние

---

## Шаг 12 — Проверочный чеклист

Пройти по каждому сценарию:

| Сценарий | Ожидаемое поведение |
|---|---|
| Полный админ | Все секции и подтабы видны |
| Пользователь с частичными привилегиями | Видны только доступные табы |
| Нет привилегий, есть admin-группы | Stands через исключение + публичные табы |
| Нет ничего | Только публичные табы (`privileges: []`) |
| Прямой URL без доступа | `RequireAuth` показывает 403 |
| `/administration` без привилегий | `DynamicIndexRedirect` ведёт на первый доступный роут |
| `/administration` без доступа вообще | `DynamicIndexRedirect` показывает 403 |

---

## Порядок, если нужно делать постепенно

Если нельзя сделать всё сразу, безопасный порядок:

1. Шаги 1–5 — не трогают UI, только логика и стор
2. Шаг 6 — параллельно с существующим конфигом, `adminRouteConfig` можно не подключать до готовности
3. Шаги 7–9 — подключить рядом со старым `buildRoutes`, переключить когда готово
4. Шаг 10 — заменить `AdminLayout` целиком
5. Шаг 11 — финальное подключение
