export function logError<T>(message: string, data: T) {
  console.error({ message, data });
}
