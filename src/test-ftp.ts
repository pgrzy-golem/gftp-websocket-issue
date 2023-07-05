// import * as flexbuffers from "https://esm.sh/flatbuffers/js/flexbuffers.js";
// import * as flexbuffers from "flatbuffers/ts/flexbuffers";
import * as flexbuffers from 'flatbuffers/js/flexbuffers.js';
import * as md5 from "md5";


// const RPC_URL = new URL("http://127.0.0.1:7465");
const RPC_URL = new URL("http://localhost:7465");
// const APPKEY = Deno.env.get("YAGNA_APPKEY");

const content = 'Hello world from websocket implementation of GFTP file transfer!';
console.log(md5(content, { encoding: 'hex' }));

class YagnaRpc {
  constructor(private baseUrl: URL, private appKey: string) {
  }

  public async get(path: string): Promise<any> {
    const url = new URL(path, this.baseUrl);

    const resp = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.appKey}`,
        "Accept": "application/json",
      },
    });
    if (resp.status === 200) {
      return await resp.json();
    }
    throw new Error(`Invalid response: ${resp.status}`);
  }

  public async create(path: string, data: object): Promise<URL> {
    const url = new URL(path, this.baseUrl);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.appKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (resp.status === 201) {
      // TODO json() returns Promise so either reutrn link through header
      // or fix accessing body
      const body = await resp.json();
      console.log(body);
      var messages_link =  `/gsb-api/v1/services/${body.servicesId}?authToken=${this.appKey}`;
      if (messages_link === null) {
        throw new Error(`Failed to create new ${path}`);
      }
      return new URL(messages_link, this.baseUrl);
    }
    throw new Error(`Invalid response: ${resp.status}`);
  }
}

type GsbRequest<T> = {
  id: string;
  component: string;
  payload: T;
};

type Handler = (b: any) => Promise<any>;

class FileServer {
  private ws: WebSocket;
  // private file: Deno.FsFile;
  private file: string;
  private handlers: { [key: string]: Handler };

  constructor(slotUrl: URL, file: string, private openCb: () => void) {
    this.file = file;
    console.log(`WebSocket URL: ${slotUrl}`);
    const ws = this.ws = new WebSocket(slotUrl, ["gsb+flexbuffers"]);
    ws.binaryType = "arraybuffer";
    ws.addEventListener("open", (event) => this.onOpen(event));
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("error", (event) => this.onError(event));
    ws.addEventListener("close", (event) => this.onClose(event));
    this.handlers = {
      "GetMetadata": (body) => this.getMetaData(),
      "GetChunk": (body) => this.getChunk(body),
    };
  }

  onOpen(event: Event) {
    this.openCb();
  }

  async onMessage(event: MessageEvent) {
    const request: GsbRequest<any> = flexbuffers.toObject(event.data) as any;
    console.log("request", request);

    const cb = this.handlers[request.component];
    if (cb == null) {
      console.log("cb", cb);
      console.error("unhandled request", request);
      return;
    }
    const resp = await cb(request.payload);
    this.ws.send(flexbuffers.encode({
      id: request.id,
      payload: resp,
    }));
  }

  onError(event: Event) {
    console.error("ws error", event);
  }

  onClose(event: Event) {
    console.info("ws close", event)
  }

  async getMetaData(): Promise<{ fileSize: number }> {
    // const stats = await this.file.stat();
    // const size = stats.size;
    const size = this.file.length;
    console.log("File size", size)
    return {
      fileSize: size,
    };
  }

  async getChunk(body: any): Promise<{ offset: number; content: Uint8Array }> {
    let { offset, size } = body;
    // const cursorPosition = await Deno.seek(
    //   this.file.rid,
    //   offset,
    //   Deno.SeekMode.Start,
    // );
    // const buf = new Uint8Array(size);
    // await this.file.read(buf);
    const buf = new TextEncoder().encode(this.file.slice(offset, offset + size));
    return {
      // offset: cursorPosition,
      offset,
      content: buf,
    };
  }
}

// await main();

async function main(APPKEY: string, key: string) {
  // const fileName = Deno.args[0];
  // const file = await Deno.open(fileName, { read: true });
  const file = content;

  // const hash = createHash("md5");
  // for await (const chunk of Deno.iter(file)) {
  //   hash.update(chunk);
  // }
  // const key = hash.toString()
  // const key = md5(content, { encoding: 'hex' });

  console.log("appkey", APPKEY);
  if (APPKEY === undefined) {
    throw new Error("Missing YAGNA_APPKEY");
  }

  const rpc = new YagnaRpc(RPC_URL, APPKEY);
  const me = await rpc.get("/me");
  console.log("me: %j", me);
  const nodeId: string = me.identity;
  const slotUrl = await rpc.create("/gsb-api/v1/services", {
    listen: {
      on: `/public/gftp/${key}`,
      components: ["GetMetadata", "GetChunk"],
    },
  });
  slotUrl.protocol = "ws:";


  const server = new FileServer(slotUrl, file, () => {
    console.log(`gftp://${nodeId}/${key}`);
  });
}

// @ts-ignore
window['gftpMain'] = main;