# Renta Ya — Taller 2 (UPB Aplicaciones móviles)

Aplicación híbrida 100% offline de exploración y captura de arriendos en Medellín. Navega una lista de propiedades, filtra por tipo y barrio, atrapa arriendos para ganar puntos y gástalos en mejoras (más slots, alcance ampliado, bonus de puntos). Incluye modo claro/oscuro.

**Fork del proyecto original:** [SaraDiaz2011/App_Hibrida](https://github.com/SaraDiaz2011/App_Hibrida)

**Autor del fork (Taller 2):** Juan Pablo Martinez ([JuanVal0308](https://github.com/JuanVal0308))  
**Contacto:** juanpa.martinezro@gmail.com

**Diseño (Figma):** [Renta Ya - Wireframes](https://www.figma.com/design/qJRjrs1c1ZDXd6cFP3noYA/Renta-Ya---Wireframes)

## Cambios en Taller 2

### 1. Lista de propiedades (sin radar/GPS/mapa)
- ✅ Navegación directa: las propiedades se muestran en una **lista** filtrable y buscable
- ✅ Sin escaneo de zonas ni cooldowns: acceso inmediato a todas las propiedades del ciclo
- ✅ Búsqueda por título o barrio
- ✅ Filtros por tipo (Aptos, Casas, Celdas)
- ✅ Vista previa al tocar una propiedad
- ✅ Rotación automática cada 20 minutos (sin intervención manual)

### 2. Actualización de terminología
- ✅ "Radar" → "Explorar" en navegación
- ✅ "Radar extendido" → "Búsqueda ampliada" (mejora)
- ✅ Estadísticas: "Radar" → "Alcance"
- ✅ Todos los strings actualizados para reflejar la lista (no GPS/mapa)

### 3. Capacitor para Android
- ✅ Configurado con `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- ✅ Scripts npm para sincronizar y abrir Android Studio
- ✅ Instrucciones completas para empaquetar APK/AAB

**Autores originales del proyecto base:**  
Sara Valentina Ochoa, Juan Pablo Martinez, Pablo Hurtado

## Requisitos

- Node.js 18+ y npm
- Sin internet en runtime (tras instalar dependencias)
- **Para Android:** Android Studio Hedgehog+ con SDK 33+ y Gradle 8+

## Comandos (Web)

```bash
npm install
npm run dev      # desarrollo con Vite (localhost)
npm run build    # minifica Sass/JS → dist/
npm run preview  # previsualiza dist/
```

## Empaquetado para Android

### 0. Instalación inicial (REQUERIDO)
```bash
npm install
```

Esto instala todas las dependencias, incluyendo Capacitor CLI.

### 1. Build web (requerido primero)
```bash
npm run build
```

### 2. Agregar plataforma Android (solo la primera vez)
```bash
npm run cap:add:android
```

Esto crea la carpeta `android/` con el proyecto de Android Studio. **Nota:** `android/` está en `.gitignore` y debe generarse localmente por cada desarrollador.

### 3. Sincronizar cambios
Cada vez que modifiques código web, ejecuta:
```bash
npm run cap:sync
```

Esto copia `dist/` a los assets nativos de Android.

### 4. Abrir en Android Studio
```bash
npm run cap:open:android
```

O todo en uno (build + sync + open):
```bash
npm run android:dev
```

**Importante:** Si es tu primera vez, ejecuta `npm run cap:add:android` antes de `android:dev`.

### 5. Firmar y empaquetar
En Android Studio:
1. **APK de prueba:** Build → Build Bundle(s) / APK(s) → Build APK(s)
2. **AAB para Play Store:** Build → Generate Signed Bundle / APK → Android App Bundle
   - Crea un keystore si no tienes uno (guárdalo en un lugar seguro)
   - Completa alias, contraseñas y datos del keystore
   - El AAB firmado queda en `android/app/release/`

**Nota sobre keystores:** Este repo NO incluye keystores por seguridad. Cada desarrollador/equipo debe generar el suyo localmente y **no** subirlo a git. La configuración en `capacitor.config.js` tiene los campos de keystore en `undefined` intencionalmente.

### Troubleshooting Android

- Si `npx cap add android` falla con error de SDK, asegúrate de tener Android Studio instalado y configurado con SDK 33+
- Si no tienes Android SDK en tu VM local, aún puedes preparar el proyecto: haz commit de `capacitor.config.js` y sigue los pasos de sincronización en tu máquina de desarrollo con Android Studio
- Para depurar en dispositivo físico: Habilita "Opciones de desarrollador" y "Depuración USB" en tu Android
- **Error "Could not find web assets"**: Asegúrate de ejecutar `npm run build` antes de `cap sync`

## Si `npm install` falla

1. Este repo incluye `.npmrc` con `strict-ssl=false` (redes escolares / antivirus suelen romper el certificado de npm).
2. Usa **Vite 6** (no Vite 8): Vite 8 + npm 11 puede dar `Invalid Version` por dependencias opcionales de Rolldown.
3. Borra `node_modules` y vuelve a instalar:

```bash
Remove-Item -Recurse -Force node_modules
npm install
```

## Estructura activa (SPA)

- `index.html` — shell único con secciones ocultas (incluye el script inline que aplica el tema guardado antes del primer render)
- `capacitor.config.ts` — configuración de Capacitor (appId, webDir, etc.)
- `sass/` — estilos con parciales (`_variables` con la paleta clara/oscura y la escala de spacing, `_mixins`, `partials/…`)
- `js/` — vanilla modular:
  - `app.js` / `router.js` — orquestación de la SPA y navegación entre vistas
  - `auth.js` / `formularios.js` — registro, login y sesión local
  - `radar.js` — lista de propiedades: muestra arriendos activos con filtros y búsqueda, sin escaneo ni zonas
  - `juego.js` — puntos, rotación de spawns, captura, mejoras
  - `inventario.js` / `tienda.js` / `detalle.js` / `perfil.js` — resto de vistas
  - `tema.js` — modo claro/oscuro (persistencia + aplicación en `<html data-tema>`)
  - `storage.js` / `ui.js` — wrappers de `localStorage` y avisos en pantalla
- `json/` — arriendos (con su `barrio` y características) y catálogo de mejoras
- `vendor/animate.min.css` — Animate.css local
- `fonts/` — tipografías opcionales `.woff2` (si no hay, usa fuentes del sistema)

La app NO usa mapas, tiles ni geolocalización real: todo funciona offline con los datos locales de `json/arriendos.json`.

## Flujo

1. **Onboarding** → registro / login (`localStorage`)
2. **Explorar** → navegar lista de propiedades con filtros (tipo, búsqueda por barrio) → tocar una propiedad para ver detalles → Atrapar → gana puntos
3. **Inventario** → tus capturas (límite de slots)
4. **Tienda** → gastar puntos en mejoras (slots, búsqueda ampliada, bonus de puntos)
5. **Perfil** → estadísticas, interruptor de **modo oscuro** (aplica a toda la app y se recuerda entre sesiones) y cerrar sesión

Claves en `localStorage` con prefijo `rentaya_` (incluye `rentaya_tema` para el modo oscuro, independiente de la sesión).

Las propiedades rotan automáticamente cada 20 minutos para mantener la experiencia dinámica.
