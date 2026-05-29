// Entidad Token — wrapper liviano sobre el par access+refresh + metadata.

export interface TokenProps {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string | number;
  userId?: string | number;
}

class Token {
  accessToken: string;
  refreshToken: string;
  expiresIn: string | number;
  userId: string | number;

  constructor({ accessToken, refreshToken, expiresIn, userId }: TokenProps = {}) {
    this.accessToken = accessToken ?? '';
    this.refreshToken = refreshToken ?? '';
    this.expiresIn = expiresIn ?? 0;
    this.userId = userId ?? '';
  }
}

module.exports = Token;
module.exports.default = Token;
