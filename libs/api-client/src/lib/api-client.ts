export interface ApiProblem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly correlationId?: string;
}

export const isApiProblem = (value: unknown): value is ApiProblem => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<ApiProblem>;
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.status === 'number'
  );
};
