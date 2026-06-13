// api/src/lib/id.ts
export const nanoid = (size = 10): string =>
  crypto
    .getRandomValues(new Uint8Array(size))
    .reduce(
      (acc, x) => acc + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[x % 62],
      '',
    )
