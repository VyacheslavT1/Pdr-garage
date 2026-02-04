import "@testing-library/jest-dom";
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";

type GlobalWithPolyfills = typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  TransformStream?: typeof TransformStream;
  ReadableStream?: typeof ReadableStream;
  WritableStream?: typeof WritableStream;
};

const globalWithPolyfills = global as GlobalWithPolyfills;

if (typeof globalWithPolyfills.TextEncoder === "undefined") {
  globalWithPolyfills.TextEncoder = TextEncoder;
}

if (typeof globalWithPolyfills.TextDecoder === "undefined") {
  globalWithPolyfills.TextDecoder =
    TextDecoder as unknown as GlobalWithPolyfills["TextDecoder"];
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

if (
  typeof globalWithPolyfills.TransformStream === "undefined" &&
  typeof webStream.TransformStream === "function"
) {
  globalWithPolyfills.TransformStream = webStream.TransformStream;
}
if (
  typeof globalWithPolyfills.ReadableStream === "undefined" &&
  typeof webStream.ReadableStream === "function"
) {
  globalWithPolyfills.ReadableStream = webStream.ReadableStream;
}
if (
  typeof globalWithPolyfills.WritableStream === "undefined" &&
  typeof webStream.WritableStream === "function"
) {
  globalWithPolyfills.WritableStream = webStream.WritableStream;
}

const { server } = require("@/tests/mocks/server") as typeof import("@/tests/mocks/server");

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const { Response: EdgeResponse } = require("next/dist/compiled/@edge-runtime/primitives/fetch");
if (typeof EdgeResponse === "function") {
  global.Response = EdgeResponse;
}
