import { en, type MessageKey } from "./en";

/** True when `value` names an interface message, so it is safe to translate. */
export function isMessageKey(value: string): value is MessageKey {
  return Object.hasOwn(en, value);
}
