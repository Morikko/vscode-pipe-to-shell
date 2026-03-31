export class ErrorMessageFormatter {
  format(message: string) {
    return (message || "").trim();
  }
}
