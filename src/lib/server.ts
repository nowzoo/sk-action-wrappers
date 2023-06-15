import {
  type RequestEvent,
  type Action,
  redirect,
  error,
  fail,
  ActionFailure
} from '@sveltejs/kit';
export class Redirect {
  constructor(
    public readonly location: string,
    public readonly status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308
  ) {}
}
export class ExpectedError {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {}
}
export class FormValidationError<
  T extends Record<string, unknown> = Record<string, unknown>,
  E extends Record<string, unknown> = { [K in keyof T]?: string }
> {
  constructor(
    public readonly formData: T,
    public readonly formErrors: E,
    public readonly status = 400
  ) {}
}

export const wrapAction = <
  Success extends Record<string, unknown> | void = Record<
    string,
    unknown
  > | void,
  Params extends Partial<Record<string, string>> = Partial<
    Record<string, string>
  >,
  RouteId extends string | null = string | null
>(
  fn: (event: RequestEvent) => Promise<Success | Redirect>
): Action<
  Params,
  | Success
  | ActionFailure<{
      formData: Record<string, unknown>;
      formErrors: Record<string, unknown>;
    }>,
  RouteId
> => {
  const action: Action<
    Params,
    | Success
    | ActionFailure<{
        formData: Record<string, unknown>;
        formErrors: Record<string, unknown>;
      }>,
    RouteId
  > = async (event: RequestEvent) => {
    try {
      const result = await fn(event);
      if (result instanceof Redirect) {
        // caught below
        throw result;
      }
      return result;
    } catch (e) {
      if (e instanceof Redirect) {
        throw redirect(e.status, e.location);
      }
      if (e instanceof ExpectedError) {
        throw error(e.status, e.message);
      }
      if (e instanceof FormValidationError) {
        return fail(e.status, {
          formData: e.formData,
          formErrors: e.formErrors
        });
      }
      throw e;
    }
  };
  return action;
};
