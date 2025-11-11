import "@testing-library/jest-dom";
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  // @ts-expect-error intentional assignment
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  // @ts-expect-error intentional assignment
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

const nodeCrypto = require("crypto");

if (typeof global.crypto === "undefined" || typeof global.crypto.randomUUID !== "function") {
  const { webcrypto } = nodeCrypto;
  const randomUUID =
    typeof nodeCrypto.randomUUID === "function"
      ? nodeCrypto.randomUUID.bind(nodeCrypto)
      : webcrypto.randomUUID.bind(webcrypto);

  const merged = {
    ...webcrypto,
    randomUUID,
  };

  Object.defineProperty(globalThis, "crypto", {
    value: merged,
    writable: false,
  });
}

const webStream = require("stream/web");

if (typeof global.TransformStream === "undefined" && typeof webStream.TransformStream === "function") {
  // @ts-expect-error Node stream polyfill
  global.TransformStream = webStream.TransformStream;
}
if (typeof global.ReadableStream === "undefined" && typeof webStream.ReadableStream === "function") {
  // @ts-expect-error Node stream polyfill
  global.ReadableStream = webStream.ReadableStream;
}
if (typeof global.WritableStream === "undefined" && typeof webStream.WritableStream === "function") {
  // @ts-expect-error Node stream polyfill
  global.WritableStream = webStream.WritableStream;
}

const { server } = require("@/tests/mocks/server") as typeof import("@/tests/mocks/server");

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const { Response: EdgeResponse } = require("next/dist/compiled/@edge-runtime/primitives/fetch");
if (typeof EdgeResponse === "function") {
  global.Response = EdgeResponse;
}
