import { randomBytes } from "node:crypto";
import { SHORT_CODE_LENGTH } from "@/lib/constants";

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateShortCode(length = SHORT_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += BASE62[bytes[index] % BASE62.length];
  }

  return output;
}
