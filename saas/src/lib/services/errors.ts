import { NextResponse } from 'next/server'

/** Thrown by service functions to signal an HTTP-status-bearing failure (bad input, not found,
 * forbidden, conflict, ...). Route handlers catch this and turn it into a JSON error response. */
export class ServiceError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ServiceError'
    this.status = status
  }
}

/** Shared catch-all for route handlers: turns a ServiceError into its intended status code,
 * a Mongoose CastError (e.g. a malformed ObjectId in the URL) into a 404, and anything else
 * into a logged 500. */
export function errorResponse(err: unknown) {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'CastError') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  console.error(err)
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}
