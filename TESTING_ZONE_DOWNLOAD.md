# Testing Zone Download Fix (v1.0.4)

## Causa Raíz del Problema

**Problema reportado:** "No es posible descargar las nuevas zonas o descargar más apartamentos en las zonas ya existentes."

**Causa raíz identificada:**
- Capacitor con `androidScheme: "https"` (configurado en `capacitor.config.json`) no resuelve correctamente rutas absolutas como `/packages/zona-*.js` al intentar acceder a assets empaquetados
- Los archivos de zona referenciaban imágenes inexistentes (`/img/inmuebles/*.jpg`) en lugar de las imágenes SVG reales en `/fotos/`
- El directorio `json/` no estaba en `public/`, por lo que no se incluía en el build de distribución

## Soluciones Implementadas

### 1. **Rutas Relativas para Capacitor** (`js/actualizar.js`)
- Cambio de rutas absolutas (`/packages/`) a rutas relativas (`./packages/`)
- Implementación de fallback con múltiples rutas a intentar:
  ```javascript
  const rutasAIntentar = [
    './packages/zona-${zonaId}.js',
    '/packages/zona-${zonaId}.js',
    'packages/zona-${zonaId}.js'
  ];
  ```
- La función intenta cada ruta hasta encontrar una que funcione

### 2. **Corrección de Rutas de Imágenes**
- Todas las zonas ahora usan rutas correctas a `/fotos/*.svg`
- Reemplazo de referencias inexistentes:
  - `/img/inmuebles/apto*.jpg` → `/fotos/apto-salon.svg`
  - `/img/inmuebles/casa*.jpg` → `/fotos/casa-exterior.svg`
  - `/img/inmuebles/parking*.jpg` → `/fotos/fachada-moderna.svg`

### 3. **Empaquetado Correcto de Assets**
- Movido `json/` a `public/json/` para incluirlo en el build
- Actualización de imports en `juego.js` para referenciar la nueva ubicación

### 4. **Versión Actualizada**
- versionCode: 4 → 5
- versionName: "1.0.3" → "1.0.4"

## Cómo Verificar la Corrección

### Método 1: Build y Test en Android Studio

1. **Build del proyecto:**
   ```bash
   npm install
   npm run build
   npm run sync
   ```

2. **Abrir en Android Studio:**
   ```bash
   cd android
   # Abrir el proyecto en Android Studio
   ```

3. **Verificar assets empaquetados:**
   - En Android Studio, navegar a: `app/src/main/assets/public/`
   - Confirmar que existen:
     - `packages/` con todos los archivos `zona-*.js` y `catalogo.json`
     - `json/` con `arriendos.json` y `mejoras.json`
     - `fotos/` con todos los archivos SVG

4. **Build APK y probar:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Instalar en dispositivo Android o emulador
   - Probar flujo de actualización:
     a. Abrir app
     b. Ir a sección "Actualizar"
     c. Verificar que se muestra el catálogo de zonas
     d. Seleccionar una o más zonas
     e. Hacer clic en "Descargar seleccionadas"
     f. Confirmar mensaje de éxito
     g. Verificar en "Zonas descargadas" que aparecen las zonas
     h. Ir a "Radar" y confirmar que aparecen nuevos apartamentos

### Método 2: Inspección de Logs

Al probar en dispositivo/emulador, conectar via ADB y ver logs:

```bash
adb logcat | grep -E "(✓|✗|Zona|catalogo)"
```

Deberías ver mensajes como:
- `✓ Catálogo cargado desde: ./packages/catalogo.json`
- `✓ Zona zona-el-poblado descargada desde: ./packages/zona-el-poblado.js`

### Método 3: Test de Catálogo Base

Verificar que el catálogo base tiene suficientes propiedades:
- Antes de descargar zonas, el radar debe mostrar ~52 propiedades del `arriendos.json` base
- Cada barrio principal debe tener 2-5 propiedades con imágenes SVG

## Zonas Disponibles para Descargar

Todas estas zonas están empaquetadas y deben descargarse correctamente offline:

1. **Zona Ejemplo** (2 apartamentos) - Para testing
2. **La Mota** (3 propiedades)
3. **Itagüí** (4 propiedades)
4. **La América** (4 propiedades)
5. **El Poblado** (5 propiedades) - Premium
6. **Laureles** (5 propiedades)
7. **Envigado** (4 propiedades)
8. **Sabaneta** (4 propiedades)
9. **Belén** (3 propiedades)
10. **Robledo** (4 propiedades)
11. **Castilla** (3 propiedades)
12. **Buenos Aires** (4 propiedades)

## Resultados Esperados

✅ **Funciona correctamente:**
- Se puede acceder a la sección "Actualizar" sin conexión
- El catálogo de zonas se carga desde assets locales
- Se pueden descargar todas las zonas sin conexión a internet
- Las imágenes de las propiedades descargadas se visualizan correctamente
- Las zonas descargadas persisten entre sesiones
- Se puede descargar la misma zona múltiples veces para "actualizar"

❌ **No debería ocurrir:**
- Error "No es posible descargar la zona"
- Catálogo vacío en sección "Actualizar"
- Imágenes rotas en propiedades descargadas
- Pérdida de zonas descargadas al cerrar la app

## Notas Técnicas

- **Offline-first:** Todo el sistema de zonas funciona completamente offline usando assets empaquetados
- **Fallback robusto:** Múltiples rutas intentadas para máxima compatibilidad
- **Storage local:** Las zonas descargadas se guardan en localStorage del dispositivo
- **Merge on download:** Descargar una zona múltiples veces reemplaza la versión anterior
