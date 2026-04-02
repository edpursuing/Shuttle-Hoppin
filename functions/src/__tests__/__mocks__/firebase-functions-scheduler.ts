// onSchedule: unwrap the handler so tests can call it directly
export const onSchedule = (_schedule: string, handler: Function) => handler
