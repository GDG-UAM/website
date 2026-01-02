// // server/index.ts
// import { createServer } from 'node:http'
// import { parse } from 'node:url'
// import next from 'next'
// import { app } from './elysia/index'

// const dev = process.env.NODE_ENV !== 'production'
// const nextApp = next({ dev, dir: process.cwd() })
// const handle = nextApp.getRequestHandler()

// nextApp.prepare().then(() => {
//   const server = createServer(async (nodeReq, nodeRes) => {
//     const parsedUrl = parse(nodeReq.url!, true)
//     const { pathname } = parsedUrl

//     // 1. Identify Elysia routes
//     if (pathname?.startsWith('/api')) {
//       // The @elysiajs/node adapter adds a .fetch method
//       // that handles the IncomingMessage -> Request conversion internally.
//       const response = await app.fetch(nodeReq)

//       // Transfer Elysia's Response back to Node's ServerResponse
//       nodeRes.statusCode = response.status
//       response.headers.forEach((value, key) => {
//         nodeRes.setHeader(key, value)
//       })

//       const body = await response.text()
//       return nodeRes.end(body)
//     }

//     // 2. Fallback to Next.js
//     await handle(nodeReq, nodeRes, parsedUrl)
//   })

//   // Handle WebSocket Upgrades
//   server.on('upgrade', (req, socket, head) => {
//     const { pathname } = parse(req.url!, true)
//     if (pathname === '/ws') {
//       // app.fetch also handles the 'upgrade' event in the Node adapter
//       app.fetch(req, socket, head)
//     } else {
//       socket.destroy()
//     }
//   })

//   server.listen(3000)
// })
