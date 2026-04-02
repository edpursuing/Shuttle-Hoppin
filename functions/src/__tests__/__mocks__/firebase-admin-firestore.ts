export const getFirestore = jest.fn()

export const Timestamp = {
  now:       jest.fn(() => ({ seconds: 9000, toMillis: () => 9_000_000 })),
  fromMillis: jest.fn((ms: number) => ({ seconds: ms / 1000, toMillis: () => ms })),
  fromDate:  jest.fn((d: Date)   => ({ seconds: d.getTime() / 1000, toMillis: () => d.getTime() })),
}

export const FieldValue = {
  arrayUnion:  jest.fn((...args: any[]) => ({ _type: 'arrayUnion',  args })),
  arrayRemove: jest.fn((...args: any[]) => ({ _type: 'arrayRemove', args })),
  increment:   jest.fn((n: number)      => ({ _type: 'increment', n })),
}
