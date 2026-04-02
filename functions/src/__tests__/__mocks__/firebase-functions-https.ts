export class HttpsError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'HttpsError'
  }
}

// onCall: unwrap the handler so tests can call it directly
export const onCall = (handler: Function) => handler
