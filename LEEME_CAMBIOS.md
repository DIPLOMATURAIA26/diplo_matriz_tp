# Qué hacer en tu repo de GitHub

No hace falta reemplazar todo el proyecto. Solo estos archivos cambiaron:

## Reemplazar (ya existían, se corrigieron)
- `.env.example`
- `DEPLOYMENT.md`
- `README.md`
- `scripts/init-supabase.sql`
- `src/App.tsx`  ← el más importante: acá estaba el error de sintaxis que rompía el build, más toda la lógica de carga de Excel real
- `src/lib/supabase.ts`

## Agregar (archivo nuevo)
- `src/lib/excelParser.ts`

## Eliminar (ya no se usa, quedó duplicado y sin uso)
- `src/lib/supabase-client.ts`

## Pasos en GitHub
1. En tu repo, subí/reemplazá cada uno de estos archivos en la misma ruta que tienen acá (respetá las carpetas `src/`, `src/lib/`, `scripts/`).
2. Borrá `src/lib/supabase-client.ts` si existe en tu repo.
3. Hacé commit y push a `main`. Vercel va a redeployar solo.
4. En Supabase, corré `scripts/init-supabase.sql` y después el `seed_risk_datasets_2023.sql` (te lo pasé en el mensaje anterior) para cargar los 20 bancos de 2023.
