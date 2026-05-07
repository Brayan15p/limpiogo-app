# LimpioGO — Documentación Técnica Completa

> Última actualización: 2026-05-06 · v1.0.0

---

## 1. Visión del producto

LimpioGO es un **marketplace de servicios de limpieza del hogar** para Colombia. Conecta a clientes que necesitan limpieza con limpiadores profesionales independientes mediante un modelo de subasta inversa: el cliente publica su necesidad y los pros hacen ofertas en pesos colombianos (COP).

**Plataformas objetivo:** iOS · Android · (Web en prototipo)

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Para qué |
|------|-----------|---------|----------|
| Framework | **Expo** | SDK 54 | Build iOS + Android desde un solo código |
| Lenguaje | **TypeScript** | 5.9 | Tipado estático |
| UI | **React Native** | 0.81.5 | Componentes nativos multiplataforma |
| Arquitectura RN | **New Architecture** | activada | Mejor rendimiento (JSI, Fabric) |
| Backend / DB | **Supabase** | v2 | DB, auth, realtime, storage |
| Base de datos | **PostgreSQL** | 17.6 | DB principal vía Supabase |
| Autenticación | **Supabase Auth** | — | Login, registro, sesión persistente |
| Almacenamiento sesión | **expo-secure-store** | 15.0 | Token JWT seguro en dispositivo |
| Navegación | **React Navigation** | v7 | Stack + Bottom Tabs |
| Animaciones | **Animated API + Spring** | nativa | Transiciones, parallax, corazón |
| Giroscopio | **expo-sensors (DeviceMotion)** | 15.0 | Parallax con movimiento del celular |
| Gradientes | **expo-linear-gradient** | 15.0 | Fondos degradados |
| Iconos | **@expo/vector-icons (Ionicons)** | 15.1 | Todos los íconos |
| Mapa | **react-native-maps** | — | MapPicker + ProTracking (excluido en web build) |
| Notificaciones push | **expo-notifications** | — | Push nativas iOS + Android |
| Fotos | **expo-image-picker** | SDK 54 | Galería para portafolio del pro |
| OTA Updates | **EAS Update** | 29.0 | Publicar cambios sin pasar por tiendas |

---

## 3. Infraestructura

```
┌─────────────────────────────────────────────────────┐
│                   DISPOSITIVO USUARIO               │
│  iOS / Android                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Expo Go (dev) / EAS Build (producción)      │  │
│  │  React Native New Architecture               │  │
│  └──────────────────┬───────────────────────────┘  │
└─────────────────────┼───────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────────┐
│                    SUPABASE CLOUD                   │
│  ┌────────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Auth JWT  │  │PostgREST │  │ Realtime WS    │   │
│  │  (sesión)  │  │  (REST)  │  │ (chat en vivo) │   │
│  └────────────┘  └────┬─────┘  └───────┬────────┘   │
│                       │                │             │
│              ┌────────▼────────────────▼──────────┐  │
│              │          PostgreSQL 17             │  │
│              │  profiles / jobs / addresses /    │  │
│              │  applications / messages /        │  │
│              │  reviews / pro_schedules /        │  │
│              │  portfolio_photos / favorites /   │  │
│              │  notifications                    │  │
│              └───────────────────────────────────┘  │
│              ┌───────────────────────────────────┐   │
│              │   Supabase Storage                │   │
│              │   bucket: portfolio (fotos pro)   │   │
│              └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  EXPO / EAS CLOUD                   │
│  EAS Update → OTA sin pasar por las tiendas         │
│  Proyecto: limpiogos-organization / limpio-go       │
│  ID: 3c6ac95e-4ba1-4ef5-b727-19f0602cd0dd           │
└─────────────────────────────────────────────────────┘
```

---

## 4. Arquitectura del código

```
limpiogo-app/
├── index.ts                    → Punto de entrada
├── App.tsx                     → Providers (AuthContext, SafeArea, fonts)
├── app.json                    → Config Expo (slug, EAS, versión, permisos)
├── eas.json                    → Config EAS Build / Update
├── .env                        → EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
├── supabase_schema.sql         → Schema inicial (ejecutar en Supabase Dashboard)
├── supabase_migration_location.sql  → Agrega lat/lng/is_online a profiles
├── supabase_migration_reviews.sql   → Tabla reviews + RPC update_pro_rating
└── src/
    ├── lib/
    │   └── supabase.ts         → Cliente Supabase (SecureStore nativo / localStorage web)
    ├── hooks/
    │   ├── useAuth.tsx         → Context global: user, profile, signIn, signUp, signOut, updateProfile
    │   ├── useFavorites.ts     → Toggle favoritos, carga desde Supabase, optimista
    │   ├── useHeartAnim.ts     → Animación bounce del corazón (reutilizable)
    │   ├── useLocationTracking.ts → Compartir GPS del pro cada 8s a Supabase
    │   ├── useProStats.ts      → Stats del pro desde Supabase: activos, ganancias, barras
    │   └── usePushNotifications.ts → Expo Notifications, guarda token en profiles
    ├── navigation/
    │   └── index.tsx           → Router completo: Auth / Cliente / Pro
    ├── components/
    │   ├── Button.tsx          → Botón reutilizable (primary / secondary / loading)
    │   └── Input.tsx           → Input con label, icono, error, modo contraseña
    ├── theme/
    │   └── index.ts            → Design tokens: Colors, Typography, Spacing, Radius, Shadow
    ├── types/
    │   └── index.ts            → Tipos TypeScript globales
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.tsx
        │   ├── LoginScreen.tsx
        │   ├── RegisterScreen.tsx
        │   ├── OnboardingScreen.tsx
        │   └── ForgotPasswordScreen.tsx
        ├── client/
        │   ├── HomeScreen.tsx
        │   ├── SearchScreen.tsx          ← NUEVO
        │   ├── ServiceDetailScreen.tsx   ← NUEVO
        │   ├── ProPublicProfileScreen.tsx ← NUEVO
        │   ├── BookingScreen.tsx
        │   ├── BookingsListScreen.tsx
        │   ├── ApplicationsScreen.tsx
        │   ├── FavoritesScreen.tsx
        │   ├── MapPickerScreen.tsx
        │   └── ProTrackingScreen.tsx
        ├── pro/
        │   ├── HomeScreen.tsx
        │   ├── JobsScreen.tsx
        │   ├── EarningsScreen.tsx
        │   ├── AvailabilityScreen.tsx    ← NUEVO
        │   └── PortfolioScreen.tsx       ← NUEVO
        └── shared/
            ├── ChatScreen.tsx
            ├── ProfileScreen.tsx
            ├── NotificationsScreen.tsx   ← NUEVO
            ├── SettingsScreen.tsx        ← NUEVO
            └── SupportScreen.tsx         ← NUEVO
```

---

## 5. Sistema de diseño

### Paleta de colores

```
Primario:     #2563EB  (blue-600)     → CTAs principales
Cielo:        #0EA5E9  (sky-500)      → Accents, gradientes
Fondo app:    #EFF6FF  (blue-50)      → Background general
Surface:      #FFFFFF                 → Cards, modales
Pro accent:   #0C4A6E                 → Elementos del rol Pro

Semánticos:
  Verde:      #16A34A                 → Éxito, disponible
  Rojo:       #DC2626                 → Peligro, eliminar
  Amarillo:   #F59E0B                 → Rating, advertencias
```

### Tipografía (Nunito vía Google Fonts)

| Token | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| h1 | 30px | 800 | Títulos de pantalla |
| h2 | 24px | 700 | Secciones principales |
| h3 | 20px | 700 | Subtítulos |
| h4 | 16px | 700 | Etiquetas de sección |
| body | 15px | 400 | Texto normal |
| bodyMed | 15px | 600 | Texto enfatizado |
| small | 13px | 400 | Texto secundario |
| caption | 11px | 600 | Etiquetas, badges |

### Principios de UX

- **Sin fricción:** Cada flujo tiene máximo 4 pasos. Sin pop-ups innecesarios.
- **Feedback inmediato:** Animaciones optimistas en favoritos, chat, estados.
- **Confianza visual:** Badges verificados, rating con estrellas, reviews reales.
- **Moneda local:** Siempre COP con formato `$80.000`.

---

## 6. Modelo de datos (PostgreSQL vía Supabase)

### Tablas principales

```sql
profiles          → usuarios (cliente o pro)
  id, full_name, email, phone, role, bio,
  rating, total_reviews, is_verified,
  push_token, lat, lng, is_online

jobs              → servicios solicitados
  id, client_id, type, rooms, budget_cop,
  status (open|in_progress|completed|cancelled),
  scheduled_at, address_id, notes

addresses         → direcciones del cliente
  id, user_id, label, street, city, lat, lng

applications      → ofertas de pros a un job
  id, job_id, pro_id, price_cop, message, status

messages          → chat en tiempo real
  id, job_id, sender_id, content, read, created_at

reviews           → calificaciones post-servicio
  id, job_id, pro_id, reviewer_id, rating, comment

favorites         → pros guardados por clientes
  id, client_id, pro_id

pro_schedules     → disponibilidad del pro por día
  pro_id, schedule (JSONB: {Lun: {enabled, start, end}, ...})

portfolio_photos  → galería de trabajos del pro
  id, pro_id, url, storage_path, caption, created_at

notifications     → centro de notificaciones
  id, user_id, type, title, body, read, booking_id, chat_id
```

### Flujo completo de un servicio

```
1. Cliente crea job → estado: open
2. Pros ven el job en su HomeScreen
3. Pro envía application (precio COP + mensaje)
4. Cliente ve todas las aplicaciones ordenadas por precio
5. Cliente acepta una → job: in_progress + chat se abre
6. Pro va al trabajo, cliente ve tracking en mapa en tiempo real
7. Pro marca "listo" → job: completed
8. Cliente recibe prompt para dejar review (1-5 estrellas)
9. RPC update_pro_rating recalcula rating del pro
```

---

## 7. Navegación completa

```
USUARIO NO AUTENTICADO
  ├── OnboardingScreen (solo primera vez, guardado en SecureStore)
  ├── WelcomeScreen
  ├── LoginScreen
  ├── RegisterScreen
  └── ForgotPasswordScreen

AUTENTICADO COMO CLIENTE
  Bottom Tabs:
  ├── Inicio (HomeScreen)
  ├── Favoritos (FavoritesScreen)
  ├── Mis servicios (BookingsListScreen)
  └── Perfil (ProfileScreen)

  Stack adicional:
  ├── Search → SearchScreen (buscador con filtros)
  ├── ServiceDetail → ServiceDetailScreen (detalle por tipo)
  ├── ProPublicProfile → ProPublicProfileScreen (perfil del pro)
  ├── Booking → BookingScreen (flujo 4 pasos)
  ├── Applications → ApplicationsScreen (ofertas de pros)
  ├── Chat → ChatScreen
  ├── MapPicker → MapPickerScreen
  ├── ProTracking → ProTrackingScreen
  ├── Notifications → NotificationsScreen
  ├── Settings → SettingsScreen
  ├── Support → SupportScreen
  └── ForgotPassword → ForgotPasswordScreen

AUTENTICADO COMO PRO
  Bottom Tabs:
  ├── Trabajos (ProHomeScreen)
  ├── Historial (ProJobsScreen)
  ├── Ganancias (EarningsScreen)
  └── Perfil (ProfileScreen)

  Stack adicional:
  ├── Chat → ChatScreen
  ├── ProAvailability → ProAvailabilityScreen
  ├── ProPortfolio → ProPortfolioScreen
  ├── Notifications → NotificationsScreen
  ├── Settings → SettingsScreen
  └── Support → SupportScreen
```

---

## 8. Catálogo de pantallas

### Autenticación

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Onboarding | `auth/OnboardingScreen.tsx` | 3 slides animados (valor/confianza/velocidad), se muestra solo 1 vez, guardado en SecureStore |
| Welcome | `auth/WelcomeScreen.tsx` | Hero oscuro con animaciones, selección rol Cliente/Pro |
| Login | `auth/LoginScreen.tsx` | Email + contraseña, parallax giroscopio, validación |
| Register | `auth/RegisterScreen.tsx` | 2 pasos, toggle cliente/pro, validación completa |
| ForgotPassword | `auth/ForgotPasswordScreen.tsx` | Envío de email de recuperación vía Supabase |

### Cliente

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Home | `client/HomeScreen.tsx` | Saludo personalizado, buscador (→ Search), grid 4 servicios (→ ServiceDetail), pros mejor calificados con favoritos, banner CTA. Campana → Notificaciones, Avatar → Settings |
| **Search** | `client/SearchScreen.tsx` | Buscador en tiempo real con debounce 350ms, filtros de categoría (chips), ordenamiento (rating/precio/reseñas), resultados en FlatList, empty state |
| **ServiceDetail** | `client/ServiceDetailScreen.tsx` | Detalle por tipo (básica/profunda/mudanza/oficinas): hero con color propio, lista "qué incluye", flujo paso a paso, card de confianza, CTA "Agendar ahora" |
| **ProPublicProfile** | `client/ProPublicProfileScreen.tsx` | Perfil público del pro: avatar grande, stats row, gráfica de barras de rating, últimas 5 reseñas, botón favorito animado, CTA fijo "Contratar". Header flotante en scroll |
| Booking | `client/BookingScreen.tsx` | Flujo 4 pasos: tipo → habitaciones → fecha/hora → dirección. No avanza sin fecha+hora. Redirige a tab Bookings al éxito |
| BookingsList | `client/BookingsListScreen.tsx` | Lista servicios con estado, precio, botón "Ver ofertas" en open y "Marcar listo" en activos |
| Applications | `client/ApplicationsScreen.tsx` | Ofertas de pros ordenadas por precio. Acepta con modal de confirmación (rechaza resto automáticamente). Abre chat |
| Favorites | `client/FavoritesScreen.tsx` | Pros favoritos con datos reales Supabase, remove con animación, badge verificado, empty state con CTA |
| MapPicker | `client/MapPickerScreen.tsx` | Mapa para elegir dirección de servicio |
| ProTracking | `client/ProTrackingScreen.tsx` | Ubicación del pro en tiempo real vía Supabase Realtime |

### Limpiador (Pro)

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| ProHome | `pro/HomeScreen.tsx` | Ve trabajos disponibles (open), modal oferta con precio personalizado + mensaje. Stats activos/completados reales |
| ProJobs | `pro/JobsScreen.tsx` | Historial de trabajos. Botón "Marcar listo" con Alert, badge "Activo ahora" en borde azul |
| Earnings | `pro/EarningsScreen.tsx` | Gráfica de barras real, transacciones reales, ganancias semana/mes/año, nota Wompi |
| **ProAvailability** | `pro/AvailabilityScreen.tsx` | Configura horarios por día (Lun–Dom). Chips rápidos de día, picker de hora inicio/fin. Guardado en `pro_schedules` vía Supabase upsert |
| **ProPortfolio** | `pro/PortfolioScreen.tsx` | Galería 3 columnas de fotos de trabajos. Subida a Supabase Storage (bucket: portfolio). Long press → eliminar. Requiere `expo-image-picker` (ya instalado) |

### Compartido

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Chat | `shared/ChatScreen.tsx` | Chat en tiempo real (Supabase Realtime), mensajes optimistas, leído/no leído, notificación local |
| Profile | `shared/ProfileScreen.tsx` | Editar nombre/teléfono (modal), cambiar contraseña. Pro: accesos a Disponibilidad, Portafolio, Reseñas. Accesos a Settings y Support |
| **Notifications** | `shared/NotificationsScreen.tsx` | Centro de notificaciones agrupado Hoy/Ayer/Antiguas. Animación "marcar leído". Funciona con mock data si la tabla `notifications` no existe aún |
| **Settings** | `shared/SettingsScreen.tsx` | Toggles: notificaciones push, email, sonidos chat, ubicación, modo oscuro (próximamente). Card de usuario con rol. Accesos a perfil, contraseña, soporte, términos. Cerrar sesión y eliminar cuenta |
| **Support** | `shared/SupportScreen.tsx` | FAQ accordion animado (8 preguntas), 3 canales de contacto (chat en vivo / email / WhatsApp), footer de versión |

---

## 9. Variables de entorno

```bash
# .env (en la raíz del proyecto — NO subir a git)
EXPO_PUBLIC_SUPABASE_URL=https://aruvnrxxblleralfmamp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
```

El prefijo `EXPO_PUBLIC_` expone las variables al bundle de JavaScript de React Native. El `anon key` es seguro de exponer en cliente — las políticas RLS de Supabase protegen los datos.

---

## 10. Migraciones SQL pendientes de ejecutar

Ejecutar en **Supabase Dashboard → SQL Editor** en este orden:

```
1. supabase_schema.sql              → Schema completo inicial
2. supabase_migration_location.sql  → lat, lng, is_online en profiles
3. supabase_migration_reviews.sql   → tabla reviews + función RPC
```

### Tablas adicionales requeridas por las nuevas pantallas

```sql
-- Disponibilidad del pro
CREATE TABLE pro_schedules (
  pro_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pro_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro gestiona su horario" ON pro_schedules
  USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- Portafolio de fotos del pro
CREATE TABLE portfolio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro gestiona sus fotos" ON portfolio_photos
  USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);
CREATE POLICY "Todos pueden ver fotos" ON portfolio_photos
  FOR SELECT USING (true);

-- Bucket de Storage para portafolio
-- En Supabase Dashboard → Storage → New bucket → Nombre: "portfolio" → Public: true

-- Notificaciones (opcional — NotificationsScreen usa mock si no existe)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  booking_id UUID,
  chat_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve sus notificaciones" ON notifications
  USING (auth.uid() = user_id);
```

---

## 11. Despliegue (EAS Update)

```bash
# Publicar actualización OTA (sin pasar por App Store / Google Play)
export EXPO_TOKEN=<tu_token>

# Android
npx eas-cli@latest update --branch main --platform android --message "descripción"

# iOS
npx eas-cli@latest update --branch main --platform ios --message "descripción"

# IMPORTANTE: no usar --platform all si react-native-maps está instalado
# (rompe el bundle web — publicar por separado)
```

### IDs de publicación más recientes

| Plataforma | Update ID | Grupo |
|-----------|-----------|-------|
| Android | `019dfb14-0938-7c25-bfde-4e556c9b103d` | `7ef17c65-547b-44c8-a72a-a69fcb8a8185` |
| iOS | `019dfb14-dc6f-77d5-b5be-2378b68bedf4` | `3adf1a08-9ad9-466c-af47-733e3f593899` |

- **GitHub:** https://github.com/Brayan15p/limpiogo-app
- **Expo:** https://expo.dev/accounts/limpiogos-organization/projects/limpio-go

---

## 12. Estado del proyecto (2026-05-06)

### Completado ✅

**Infraestructura**
- Proyecto Expo SDK 54 + TypeScript sin errores
- Supabase conectado (auth, DB, Realtime, Storage)
- Design system completo (tokens de color, tipografía, spacing, sombras)
- Navegación completa cliente + pro + auth
- EAS Update configurado y publicado en iOS + Android

**Funcionalidades**
- Onboarding (3 slides, se muestra 1 vez)
- Auth completo: registro, login, logout, recuperar contraseña
- Roles: cliente / pro con navegación separada
- HomeScreen con pros reales desde Supabase
- SearchScreen con búsqueda en tiempo real y filtros
- ServiceDetailScreen por tipo de servicio
- ProPublicProfileScreen con rating breakdown y reseñas
- Booking flow completo (4 pasos, validación fecha/hora)
- Favoritos con animación y datos reales
- Chat en tiempo real (Supabase Realtime), mensajes optimistas
- Tracking del pro en tiempo real (GPS cada 8s vía Supabase)
- Notificaciones push (expo-notifications, token guardado en profiles)
- Reviews con estrellas animadas, RPC recalcula rating del pro
- EarningsScreen con datos reales (barras, transacciones)
- ProAvailabilityScreen (horarios por día, guardado en DB)
- ProPortfolioScreen (galería + subida a Supabase Storage)
- NotificationsScreen (centro de notificaciones con mock fallback)
- SettingsScreen (configuración completa)
- SupportScreen (FAQ + canales de contacto)
- ProfileScreen funcional (editar nombre/teléfono, reset password)
- Corrección de bugs rondas 1 y 2 (rollback optimista, Realtime deps)

### Pendiente ⏳

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Pasarela de pagos Wompi | 🔴 Alta | Requiere credenciales de sandbox Wompi |
| Ejecutar SQL nuevas tablas | 🔴 Alta | `pro_schedules`, `portfolio_photos`, `notifications` |
| Crear bucket "portfolio" en Supabase Storage | 🔴 Alta | Para que PortfolioScreen funcione |
| Foto de perfil de usuario | 🟡 Media | expo-image-picker ya instalado |
| ProPortfolio: foto real (conectar ImagePicker) | 🟡 Media | Stub listo, solo conectar lógica |
| Filtros avanzados en SearchScreen (precio, zona) | 🟡 Media | Base ya construida |
| Publicar update OTA con los nuevos cambios | 🟡 Media | `npx eas-cli update ...` |
| SMTP propio con Resend | 🟢 Baja | Para correos sin límite |
| Modo oscuro | 🟢 Baja | Toggle en SettingsScreen ya existe |

---

## 13. Comandos útiles

```bash
# Desarrollo local
npx expo start

# Verificar TypeScript
npx tsc --noEmit

# Instalar dependencia compatible con el SDK
npx expo install <paquete>

# Publicar OTA (Android)
npx eas-cli@latest update --branch main --platform android --message "..."

# Publicar OTA (iOS)
npx eas-cli@latest update --branch main --platform ios --message "..."

# Ver logs en tiempo real
npx expo start --tunnel
```
