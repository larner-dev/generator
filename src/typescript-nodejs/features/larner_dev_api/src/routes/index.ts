interface Result {
  success: boolean;
}

export default {
  "GET /": async (): Promise<Result> => {
    return { success: true };
  },
};
