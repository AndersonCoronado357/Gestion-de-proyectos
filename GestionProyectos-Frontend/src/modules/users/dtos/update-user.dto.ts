export interface UpdateUserInput {
  id?: string;
  name?: string;
  sapUser?: string;
  email?: string;
  roles?: string[];
  status?: string;
}

export interface UpdateUserDto {
  id: string | undefined;
  name: string | undefined;
  sapUser: string;
  email: string | undefined;
  roles: string[];
  status: string;
}

export const toUpdateDto = ({
  id,
  name,
  sapUser,
  email,
  roles,
  status
}: UpdateUserInput = {}): UpdateUserDto => ({
  id,
  name,
  sapUser: (sapUser ?? '').toUpperCase(),
  email,
  roles: roles ?? [],
  status: status ?? 'active'
});
