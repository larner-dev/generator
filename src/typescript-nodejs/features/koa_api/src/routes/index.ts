interface Result {
  success: boolean;
}

export const routes = {
  "GET /": async (): Promise<Result> => {
    return { success: true };
  },
};
