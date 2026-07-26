import { app } from "./app"
const PORT = Number(process.env.PORT ?? 8000)
app.listen(PORT)
console.log(`🦊 Kreatur API running at ${app.server?.hostname}:${app.server?.port}`)
