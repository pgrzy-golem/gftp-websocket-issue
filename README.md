
To test gftp demo, run `npx parcel src/index.html --open` in the root directory of this project. This will start the HTTP server and open the app in a browser.
From there you can test the connection to standalone websocket server as well as running the GFTP demo code.
GFTP part works in Firefox but fails on websocket connection in Chromium.

To make sure it isn't related to Chromium security, there is also a websocket server that runs on a different port.
Run the server with the following command `npx ts-node src/ws-standalone`. This will start a websocket server on port 3213

Relevant files:
- src/index.html demo - frontend app
- src/ws-standalone.ts - standalone websocket server
- src/test-ftp.ts - ported deno GFTP file upload

