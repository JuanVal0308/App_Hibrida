# RentaGo — Aplicación híbrida de captura de arriendos

Aplicación híbrida (Capacitor + Android) 100% offline tipo Pokémon GO: escanea zonas (barrios) de Medellín con un radar simulado —sin mapas, tiles ni geolocalización real—, atrapa arriendos, gana puntos y gástalos en mejoras (más slots, radar, bonus). Incluye modo claro/oscuro.

## 📱 Plataforma

- **Web**: SPA moderna con soporte offline
- **Android**: Aplicación nativa usando Capacitor 8.5
- **Package ID**: `com.rentaya.app`
- **App Name**: RentaGo

**Autores del proyecto:**
Sara Valentina Ochoa
Juan Pablo Martinez
Pablo Hurtado

## Requisitos

- Node.js 18+ y npm
- Sin internet en runtime (tras instalar dependencias)
- Android Studio (para compilar la app Android con Capacitor)

## Comandos

### Desarrollo Web

```bash
npm install
npm run dev      # desarrollo con Vite
npm run build    # minifica Sass/JS → dist/
npm run preview  # previsualiza dist/
npm run sync     # sincroniza dist/ con Capacitor (Android)
```

## Capacitor / Android

La app está configurada como aplicación híbrida con **Capacitor**:

- **Package ID:** `com.rentago.app`
- **Display Name:** RentaGo
- **Configuración:** `capacitor.config.json`

Para compilar la app Android:

```bash
npm run build    # genera dist/ desde los fuentes
npm run sync     # copia dist/ a android/app/src/main/assets/public/
npx cap open android  # abre Android Studio
```

El **applicationId** `com.rentago.app` permite crear un nuevo listing en Google Play Store (el paquete anterior `com.rentaya.app` no está disponible).

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
- `sass/` — estilos con parciales (`_variables` con la paleta clara/oscura y la escala de spacing, `_mixins`, `partials/…`)
- `js/` — vanilla modular:
  - `app.js` / `router.js` — orquestación de la SPA y navegación entre vistas
  - `auth.js` / `formularios.js` — registro, login y sesión local
  - `radar.js` — radar de zonas: agrupa arriendos por barrio, animación de escaneo y captura (reemplaza el mapa GPS/Leaflet original)
  - `juego.js` — puntos, rotación de spawns, captura, mejoras
  - `inventario.js` / `tienda.js` / `detalle.js` / `perfil.js` — resto de vistas
  - `tema.js` — modo claro/oscuro (persistencia + aplicación en `<html data-tema>`)
  - `storage.js` / `ui.js` — wrappers de `localStorage` y avisos en pantalla
- `json/` — arriendos (con su `barrio`, usado para agrupar zonas) y catálogo de mejoras
- `vendor/animate.min.css` — Animate.css local
- `fonts/` — tipografías opcionales `.woff2` (si no hay, usa fuentes del sistema)

No hay dependencias de mapas, tiles ni geolocalización real: todo el "radar" es simulado con los datos locales de `json/arriendos.json`.

## Flujo

1. Onboarding → registro / login (`localStorage`)
2. Radar → elegir una zona (barrio) → "Escanear zona" (animación) → revela arriendos capturables → Atrapar → puntos
3. Inventario (límite de slots)
4. **Actualizar** → descarga paquetes de nuevas zonas cuando hay internet (opcional, funciona offline con zonas base)
5. Tienda → gastar puntos en mejoras (slots, radar, bonus de puntos)
6. Perfil → estadísticas, interruptor de **modo oscuro** (aplica a toda la app y se recuerda entre sesiones) y cerrar sesión

Claves en `localStorage` con prefijo `rentaya_` (incluye `rentaya_tema` para el modo oscuro, independiente de la sesión).

## Actualización de zonas (online)

La app funciona 100% offline con los datos base, pero puede descargar **paquetes de zonas** adicionales cuando tiene conexión:

### Desde la app móvil

1. Ve a la sección **Actualizar** en el nav inferior
2. La app detecta si tienes conexión a internet
3. Si hay conexión, puedes:
   - Ver zonas disponibles para descargar
   - Seleccionar las zonas que te interesan
   - Descargar e instalar los paquetes seleccionados
   - Eliminar zonas descargadas previamente
4. Los apartamentos de las zonas descargadas se mezclan automáticamente con los datos base

### Admin web (online-admin)

Para crear y publicar nuevas zonas:

1. Abre `online-admin/index.html` en tu navegador
2. Crea zonas (barrios/sectores)
3. Agrega apartamentos a cada zona
4. Exporta el catálogo y los paquetes de zona
5. Sube los archivos a `public/packages/` y haz commit
6. Los usuarios con la app podrán descargar las nuevas zonas

Ver `online-admin/README.md` para más detalles.

## Despliegue con GitHub Pages

Para que la app móvil pueda descargar paquetes de zonas:

1. **Habilita GitHub Pages** en tu repositorio:
   - Ve a `Settings` > `Pages`
   - Source: `Deploy from a branch`
   - Branch: `main` (o la que prefieras)
   - Folder: `/` (raíz)
   - Guarda los cambios

2. **Verifica la URL de Pages**:
   - Normalmente será: `https://TuUsuario.github.io/App_Hibrida/`
   - Los paquetes estarán en: `https://TuUsuario.github.io/App_Hibrida/packages/`

3. **Configura la URL base** (solo si es necesario):
   - Edita `js/actualizar.js`
   - Actualiza `BASE_URL` con tu URL de Pages si difiere de la predeterminada
   
4. **Genera un build de producción**:
   ```bash
   npm run build
   ```
   - Esto crea la carpeta `dist/` optimizada
   - Opcionalmente, configura Pages para servir desde `/dist`

### Formato de paquetes

**Catálogo** (`packages/catalogo.json`):
```json
[
  {
    "id": "zona-ejemplo",
    "nombre": "Zona Ejemplo",
    "descripcion": "Apartamentos de ejemplo",
    "cantidadApartamentos": 2
  }
]
```

**Paquete de zona** (`packages/zona-{id}.js`):
```javascript
exports.zonaId = "zona-ejemplo";
exports.zonaNombre = "Zona Ejemplo";
exports.apartamentos = [
  {
    "id": "ejemplo-1",
    "titulo": "Apto Ejemplo",
    "barrio": "Zona Ejemplo",
    // ... campos estándar de apartamento
  }
];
```

### Testing online/offline

**Modo offline** (sin conexión):
- La app funciona normalmente con los datos base
- Muestra mensaje en Actualizar indicando que se necesita internet
- Los apartamentos de zonas ya descargadas siguen disponibles

**Modo online** (con conexión):
- Detecta automáticamente la conexión (`navigator.onLine` + ping a Google)
- Carga el catálogo desde la URL de paquetes
- Permite descargar e instalar zonas seleccionadas
- Aplica los paquetes a la base de datos local (`localStorage`)
