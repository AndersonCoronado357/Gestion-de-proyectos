export interface CreateUserInput {
  name?: string;
  sapUser?: string;
  email?: string;
  roles?: string[];
  status?: string;
}

export interface CreateUserDto {
  name: string | undefined;
  sapUser: string;
  email: string | undefined;
  roles: string[];
  status: string;
}

export const toCreateDto = ({
  name,
  sapUser,
  email,
  roles,
  status
}: CreateUserInput = {}): CreateUserDto => ({
  name,
  sapUser: (sapUser ?? '').toUpperCase(),
  email,
  roles: roles ?? [],
  status: status ?? 'invited'
});
