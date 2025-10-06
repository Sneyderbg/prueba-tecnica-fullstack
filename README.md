# Gestión de Ingresos y Egresos

Aplicación fullstack para la gestión de transacciones financieras con autenticación de usuarios.
Incluye roles de administrador, reportes gráficos, gestión de usuarios y documentación completa de API.

## Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd prueba-tecnica-fullstack
   ```

2. Instala las dependencias:

   ```bash
   bun install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

   ```
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="..."
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. Configura la base de datos:
   ```bash
   bun run db:seed
   ```

## Ejecutar y Construir

### Desarrollo

Para ejecutar el servidor de desarrollo:

```bash
bun run dev
```

### Construcción

Para construir la aplicación para producción:

```bash
bun run build
```

Nota: Para generar la documentación Swagger, ejecuta:

```bash
bun run generate-swagger
```

### Producción

Para ejecutar en modo producción:

```bash
bun run start
```

## Despliegue con Vercel

### Usando la Interfaz Web de Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión.
2. Haz clic en "New Project" y conecta tu repositorio de GitHub.
3. Configura el proyecto:
   - **Build Command**: `prisma generate && bun run generate-swagger && next build`
   - **Output Directory**: `.next`
   - Agrega las variables de entorno en la sección "Environment Variables".
4. Haz clic en "Deploy".

### Usando Vercel CLI

1. Instala Vercel CLI si no lo tienes:

   ```bash
   npm install -g vercel
   ```

2. Inicia sesión en Vercel:

   ```bash
   vercel login
   ```

3. Despliega el proyecto (asegúrate de que el build command incluya la generación de Swagger):

   ```bash
   vercel --prod
   ```

   O configura el build command en el dashboard de Vercel.

4. Configura las variables de entorno durante el despliegue o en el dashboard de Vercel.

Nota: Asegúrate de que `prisma generate` se ejecute antes del build configurando el comando de build como `prisma generate && next build`.
