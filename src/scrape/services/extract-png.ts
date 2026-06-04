import { type SyncResponse, ValidationError } from "@decodo/sdk-ts";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function isPngBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= PNG_SIGNATURE.length &&
    buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  );
}

export function extractPngFromResponse(response: SyncResponse): Buffer {
  const entry = response.results[0];
  if (entry === undefined) {
    throw new ValidationError("Screenshot response has no results.");
  }

  const { content } = entry;
  if (typeof content !== "string" || content.length === 0) {
    throw new ValidationError("Screenshot response has no PNG content.");
  }

  const bytes = Buffer.from(content, "base64");
  if (bytes.length === 0 || !isPngBuffer(bytes)) {
    throw new ValidationError("Screenshot response content is not valid PNG.");
  }

  return bytes;
}
