export async function readResponseJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) {
    throw new Error("Response body is empty");
  }
  return JSON.parse(text);
}
