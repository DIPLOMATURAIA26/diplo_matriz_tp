# Qué hacer en tu repo de GitHub

Archivos que cambiaron respecto a tu repo actual:

## Reemplazar
- .env.example
- DEPLOYMENT.md
- README.md
- scripts/init-supabase.sql   (idéntico a tu SUPABASE_TABLAS.txt + agrega risk_calculations, que faltaba)
- src/App.tsx                  (el más importante: fix del error de sintaxis + carga real de Excel + usa el maestro banks)
- src/lib/supabase.ts

## Agregar (archivo nuevo)
- src/lib/excelParser.ts

## Eliminar (ya no se usa)
- src/lib/supabase-client.ts

## En Supabase
Tu esquema (banks + risk_datasets sin code/name) ya estaba bien pensado. No hace falta tocar nada ahí:
correr scripts/init-supabase.sql es seguro y no borra ni duplica lo que ya tenés (CREATE TABLE IF NOT EXISTS
+ ON CONFLICT DO NOTHING). Solo agrega risk_calculations si no la tenías.

Después corré seed_risk_datasets_2023.sql (aparte, te lo paso en el chat) para cargar los 20 bancos de 2023.
