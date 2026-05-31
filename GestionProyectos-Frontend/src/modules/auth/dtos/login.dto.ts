export interface LoginInput {
  username: string;
  password: string;
  // Si true, la sesión persiste (cookie con maxAge + cache en
  // localStorage).  Si false, la sesión es por-pestaña (cookie de
  // sesión + cache en sessionStorage) y se cierra al cerrar el browser.
  remember?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
  remember: boolean;
}

export const toLoginDto = (input: LoginInput): LoginDto => ({
  username: input.username,
  password: input.password,
  remember: !!input.remember
});
