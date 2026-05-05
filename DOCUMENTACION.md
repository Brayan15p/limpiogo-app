# LimpioGO — Documentación Técnica Completa

---

## 1. Visión del producto

LimpioGO es un **marketplace de servicios de limpieza del hogar** para Colombia. Conecta a clientes que necesitan limpieza con limpiadores profesionales independientes. Opera bajo un modelo de subasta inversa: el cliente publica su necesidad y los pros hacen ofertas en pesos colombianos (COP).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Para qué |
|------|-----------|---------|----------|
| Framework móvil | **Expo** | SDK 54 | Compilar iOS + Android desde un solo código |
| Lenguaje | **TypeScript** | 5.9 | Tipado estático, menos bugs |
| UI | **React Native** | 0.81.5 | Componentes nativos multiplataforma |
| Arquitectura RN | **New Architecture** | activada | Mejor rendimiento (JSI, Fabric) |
| Backend / DB | **Supabase** | v2 | Base de datos, auth, realtime, storage |
| Base de datos | **PostgreSQL** | 17.6 | DB principal vía Supabase |
| Autenticación | **Supabase Auth** | — | Login, registro, sesión persistente |
| Almacenamiento sesión | **expo-secure-store** | 15.0 | Guarda el token JWT de forma segura en el dispositivo |
| Navegación | **React Navigation** | v7 | Stack + Bottom Tabs |
| Animaciones | **React Native Animated API** | nativa | Parallax en login |
| Sensor giroscopio | **expo-sensors (DeviceMotion)** | 15.0 | Mueve los elementos con el movimiento del celular |
| Gradientes | **expo-linear-gradient** | 15.0 | Fondos degradados |
| Iconos | **@expo/vector-icons (Ionicons)** | 15.1 | Todos los íconos de la app |
| Fuente tipográfica | **Nunito** (Google Fonts) | — | Tipografía principal, amigable y moderna |
| OTA Updates | **EAS Update** | 29.0 | Publicar cambios sin pasar por las tiendas |

---

## 3. Infraestructura

```
┌─────────────────────────────────────────────────────┐
│                   DISPOSITIVO USUARIO                │
│  iOS / Android                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │            Expo Go / Build nativo            │   │
│  │         React Native + New Architecture      │   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────────┐
│                    SUPABASE CLOUD                    │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Auth JWT  │  │ PostgREST│  │  Realtime WS    │  │
│  │  (sesión)  │  │  (REST)  │  │  (chat en vivo) │  │
│  └────────────┘  └────┬─────┘  └────────┬────────┘  │
│                       │                 │            │
│              ┌────────▼─────────────────▼────────┐   │
│              │         PostgreSQL 17              │   │
│              │  profiles / jobs / addresses /    │   │
│              │  applications / messages          │   │
│              └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  EXPO / EAS CLOUD                    │
│  EAS Update → entrega actualizaciones OTA            │
│  Proyecto ID: 3c6ac95e-4ba1-4ef5-b727-19f0602cd0dd  │
│  Owner: limpiogos-organization                       │
└─────────────────────────────────────────────────────┘
```

---

## 4. Arquitectura de la app

```
limpiogo-app/
├── index.ts                 → Punto de entrada
├── App.tsx                  → Providers (AuthContext, fonts)
├── app.json                 → Config Expo (slug, EAS, versión)
├── .env                     → Variables SUPABASE_URL + ANON_KEY
└── src/
    ├── lib/
    │   └── supabase.ts      → Cliente Supabase (SecureStore en nativo, localStorage en web)
    ├── hooks/
    │   └── useAuth.tsx      → Context global: user, profile, signIn, signUp, signOut
    ├── navigation/
    │   └── index.tsx        → Router principal (Auth / Cliente / Pro)
    ├── components/
    │   ├── Button.tsx       → Botón reutilizable (primary / secondary / loading)
    │   └── Input.tsx        → Input con label, icono, error y modo contraseña
    ├── theme/
    │   └── index.ts         → Design tokens: Colors, Typography, Spacing, Radius, Shadow
    ├── types/
    │   └── index.ts         → Tipos TypeScript globales
    └── screens/
        ├── auth/            → Welcome, Login, Register
        ├── client/          → Home, Booking, BookingsList, Applications, Favorites
        ├── pro/             → Home, Jobs, Earnings
        └── shared/          → Chat, Profile
```

---

## 5. Modelo de datos (Supabase / PostgreSQL)

```
profiles          → usuarios (cliente o pro), rating, datos de contacto
jobs              → servicios solicitados, tipo, habitaciones, presupuesto COP, estado
addresses         → direcciones guardadas de los clientes
applications      → ofertas que los pros hacen a un job (precio COP + mensaje)
messages          → chat en tiempo real por job entre cliente y pro asignado
```

### Flujo completo de un servicio

```
Cliente crea job (open)
  → Pros ven el job disponible
  → Pro envía application (precio COP + mensaje)
  → Cliente ve todas las aplicaciones ordenadas por precio
  → Cliente acepta una → Job pasa a in_progress
  → Chat se abre entre cliente y pro
  → Servicio completado → job completed
  → (Calificación pendiente de implementar)
```

---

## 6. Sistema de roles y navegación

```
Usuario no autenticado → Welcome → Login / Register

Autenticado como CLIENTE:
  Tabs: Inicio | Favoritos | Mis servicios | Perfil
  Stack extra: Booking → Applications → Chat

Autenticado como PRO:
  Tabs: Trabajos | Historial | Ganancias | Perfil
  Stack extra: Chat
```

La detección de rol es automática al iniciar sesión — React Navigation muestra el stack correcto según `profile.role`.

---

## 7. Sistema de diseño

- **Paleta:** Azul cielo (`#2563EB` principal) + blanco + verde semántico
- **Tipografía:** Nunito (Google Fonts) — pesos 800/700/600/400
- **Principios:** Clean, fresco, confiable — orientado a servicio doméstico premium colombiano
- **Moneda:** Pesos colombianos (COP) con formato `$80.000 COP`
- **Efectos:** Parallax con giroscopio en Login, gradientes sky, sombras suaves

---

## 8. Pantallas implementadas

### Autenticación
| Pantalla | Archivo | Qué hace | Limitación actual |
|----------|---------|----------|-------------------|
| Welcome | `auth/WelcomeScreen.tsx` | Selección de rol Cliente / Pro | Solo visual |
| Login | `auth/LoginScreen.tsx` | Login email+contraseña, parallax giroscopio | Recuperar contraseña no conectado |
| Register | `auth/RegisterScreen.tsx` | Registro con nombre, email, teléfono, rol | Confirmación email pendiente desactivar |

### Cliente
| Pantalla | Archivo | Qué hace | Limitación actual |
|----------|---------|----------|-------------------|
| Home | `client/HomeScreen.tsx` | Catálogo 4 servicios COP, pros destacados | Pros son mock |
| Booking | `client/BookingScreen.tsx` | Flujo 4 pasos para solicitar servicio | Sin fotos, sin validar duplicados |
| BookingsList | `client/BookingsListScreen.tsx` | Lista servicios con estado y presupuesto COP | Sin filtros |
| Applications | `client/ApplicationsScreen.tsx` | Ofertas de pros ordenadas por precio COP | Sin ver perfil detallado |
| Favorites | `client/FavoritesScreen.tsx` | Lista pros favoritos con precios COP | Solo mock, no conectado a DB |

### Limpiador (Pro)
| Pantalla | Archivo | Qué hace | Limitación actual |
|----------|---------|----------|-------------------|
| ProHome | `pro/HomeScreen.tsx` | Ve trabajos disponibles, envía ofertas | Sin filtros por zona |
| ProJobs | `pro/JobsScreen.tsx` | Historial de trabajos aplicados | Sin separar activos/históricos |
| Earnings | `pro/EarningsScreen.tsx` | Pantalla de ganancias | 100% mock, no conectada a DB |

### Compartido
| Pantalla | Archivo | Qué hace | Limitación actual |
|----------|---------|----------|-------------------|
| Chat | `shared/ChatScreen.tsx` | Chat en tiempo real por trabajo | Sin adjuntos, sin notificaciones push |
| Profile | `shared/ProfileScreen.tsx` | Ver y editar perfil | Sin foto real |

---

## 9. Cómo publicar actualizaciones (OTA)

Cada vez que se hacen cambios en el código, publicar sin pasar por las tiendas:

```bash
export EXPO_TOKEN=<tu_token>
npx eas-cli@latest update --branch main --message "descripcion del cambio"
```

Los usuarios con Expo Go reciben la actualización automáticamente al abrir la app.

---

## 10. Plan de avance priorizado

| # | Feature | Prioridad | Estado |
|---|---------|-----------|--------|
| 1 | Desactivar confirmación de email (Supabase dashboard) | Urgente | Pendiente |
| 2 | SMTP propio con Resend (sin límite de correos) | Alta | Pendiente |
| 3 | Notificaciones push (Expo Notifications) | Alta | ✓ Implementado |
| 4 | Pasarela de pagos Wompi (Colombia) | Alta | Pendiente |
| 5 | Recuperar contraseña | Alta | ✓ Implementado |
| 6 | EarningsScreen con datos reales de Supabase | Media | Pendiente |
| 7 | FavoritesScreen con datos reales de Supabase | Media | Pendiente |
| 8 | Calificaciones post-servicio | Media | Pendiente |
| 9 | Fotos antes/después del servicio | Media | Pendiente |
| 10 | Mapa con ubicación del pro en tiempo real | Media | Pendiente |
| 11 | Foto de perfil (Supabase Storage) | Baja | Pendiente |
| 12 | Filtros en ProHome por zona/tipo de servicio | Baja | Pendiente |
| 13 | Onboarding guiado primera vez | Baja | Pendiente |
