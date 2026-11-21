# Panel de control 21st

Panel de gestión de la legión: registros de actividad mensuales tipo Excel, calendario, reglamento y miembros, con cuentas y rangos.

- **Frontend:** HTML + CSS + JavaScript puro (sin instalar nada). Se publica en **GitHub Pages**.
- **Base de datos y cuentas:** **Supabase** (gratis).

```
Base de datos 21/
├── index.html          ← la página
├── css/styles.css      ← diseño
├── js/config.js        ← ⚙ CONFIGURACIÓN (claves, columnas, rangos, menú)
├── js/api.js           ← conexión con Supabase / modo demo
├── js/app.js           ← funcionamiento de la interfaz
└── supabase/schema.sql ← tablas y permisos (se pega en Supabase)
```

---

## 1. Probarlo ya (modo demo)

Abrí `index.html` con doble clic. Sin claves de Supabase funciona en **modo demo**: todo se guarda solo en tu navegador y nadie más lo ve. Sirve para ver el diseño.

## 2. Crear la base de datos en Supabase (una sola vez)

1. Entrá a <https://supabase.com>, creá una cuenta y después **New project** (anotá la contraseña de la base, aunque no la vas a usar acá).
2. En el proyecto: **SQL Editor → New query**. Pegá todo el contenido de `supabase/schema.sql` y apretá **Run**.
3. **Project Settings → API**: copiá **Project URL** y la clave **anon public**.
4. Pegalas en `js/config.js`:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
   La clave *anon* es pública por diseño: lo que protege los datos son las reglas del `schema.sql`. **Nunca** pongas la clave `service_role`.
5. **Authentication → Sign In / Providers → Email**: por defecto Supabase pide confirmar el email al registrarse. Para un grupo cerrado de ~20 personas podés desactivar **Confirm email** y así entran directo.
6. **Registrate primero vos.** La primera cuenta creada queda como **Administrador** automáticamente; todas las demás nacen como **Usuario (rango 1)**.

## 3. Publicarlo en GitHub Pages

1. Con GitHub Desktop: **File → Add local repository** → elegí esta carpeta → *create a repository* → **Publish repository** (puede ser público o privado; Pages en repos privados requiere plan pago).
2. En github.com, en el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
3. En 1–2 minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. En Supabase → **Authentication → URL Configuration → Site URL**, poné esa misma dirección (sirve para los links de confirmación de email).

Cada vez que cambies algo: GitHub Desktop → **Commit** → **Push** y la página se actualiza sola.

---

## Cómo funciona

### Rangos y permisos
| Rango | Nombre | Puede |
|---|---|---|
| 1 | Usuario | Ver todo. Editar **solo si el Modo abierto está activo** |
| 2 | Administrador | Ver y editar todo, cambiar rangos, activar/desactivar Modo abierto |

- **Modo abierto** (activo al instalar): cualquier cuenta puede editar, como pediste para el arranque del proyecto. Se apaga desde **Usuarios y rangos**.
- Los rangos se cambian desde **Usuarios y rangos** (solo Administradores).
- Para que una sección solo la vea cierto rango, cambiá su `rangoMinimo` en `SECCIONES` dentro de `js/config.js`.
- Para agregar más rangos, sumalos en `RANGOS` (ej. `3: 'Comandante'`).
- Todo esto se valida **también en la base de datos**, no solo en la página: alguien que manipule la web no puede saltarse los permisos.

### Registros de actividad (Suboficiales, Oficiales y Comandantes, Élites, Tropas)
- Una hoja por mes (pestañas Enero → Diciembre) y selector de año.
- Las **filas** son los miembros cargados en *Miembros de la legión* con esa categoría. El nombre y el grado son datos fijos (no se editan desde la hoja).
- Las **columnas** están en `COLUMNAS_BASE` / `CATEGORIAS` de `js/config.js`. Cada registro puede tener su propia lista.
- Columna **Total** por miembro y fila de totales por actividad.
- **Bloquear celda / Bloquear mes:** una celda bloqueada 🔒 no se puede modificar hasta desbloquearla (útil para "cerrar" un mes ya revisado).
- **Exportar CSV** para abrir en Excel.
- Teclado como Excel: flechas, Enter, Tab, Supr, Esc, F2, Ctrl+B.
- Los cambios de otras personas aparecen solos (tiempo real).

### Miembros de la legión
Alta, edición y baja de miembros con categoría, grado, notas y estado. Un miembro **inactivo** desaparece de las tablas, salvo en los meses donde ya tenga datos. Borrar un miembro borra también sus registros (por eso conviene marcarlo inactivo).

### Calendario y Reglamento
- Calendario mensual: clic en un día para crear un evento; clic en un evento para verlo o editarlo. Tipos y colores en `TIPOS_EVENTO`.
- Reglamento: tabla editable con filas bloqueables. Columnas en `COLUMNAS_REGLAMENTO`.

### Hacer administrador a alguien a mano
Supabase → SQL Editor:
```sql
update public.perfiles set rango = 2 where email = 'persona@email.com';
```
