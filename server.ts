import { app } from './app.ts'
import { env } from './env/index.ts'
import { getRoutes } from './routes/routes.ts'

app.listen({ port: env.PORT }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})

app.register(getRoutes)
