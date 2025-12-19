export function cleanUndefinedDeep<T>(value: T): T {
  const helper = (val: any): any => {
    if (val === undefined) return undefined;
    if (Array.isArray(val)) {
      return val
        .map((item) => helper(item))
        .filter((item) => item !== undefined);
    }
    if (val && typeof val === "object") {
      const result: Record<string, any> = {};
      for (const [key, v] of Object.entries(val)) {
        const cleaned = helper(v);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }
      return result;
    }
    return val;
  };

  return helper(value);
}
