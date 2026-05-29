module.exports = (input: { username: string; password: string; remember?: unknown }) => ({
  username: input.username,
  password: input.password,
  remember: !!input.remember
});
