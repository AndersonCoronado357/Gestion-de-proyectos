// Almacena los tokens de OAuth de Google POR USUARIO — separado del
// login. El login con Google da un ID token (identidad); el "Conectar
// Google" del tester de APIs requiere consentimiento adicional para los
// scopes de Sheets/Drive, y a cambio Google entrega un refresh token
// que conservamos cifrado acá.
//
// El access token es de corta duración (~1h) y se recalcula on-demand
// desde el refresh, por eso no se persiste — sólo el refresh, la fecha
// del último uso y los scopes concedidos.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_google_tokens', (t) => {
    t.increments('id').primary();
    // Un único registro por usuario — un usuario "conecta Google" una
    // sola vez; reconectar reemplaza el refresh token anterior.
    t.integer('user_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    // Refresh token cifrado con APP_ENCRYPTION_KEY (AES-256-GCM).
    // nvarchar(MAX) porque cifrado puede crecer y por si Google rota
    // el formato.
    t.specificType('refresh_token_encrypted', 'NVARCHAR(MAX)').notNullable();
    // Scopes concedidos (string separado por espacios, tal como llega
    // de Google).  Si el user reconecta con scopes distintos, se
    // sobrescribe — la app puede comparar antes de llamar a una API
    // para decidir si necesita re-consent.
    t.specificType('scopes', 'NVARCHAR(2000)').notNullable();
    // Email de la cuenta de Google con la que consintió — informativo,
    // útil para que el frontend muestre "Conectado como x@gmail.com".
    t.string('google_email', 320).nullable();
    // Última vez que la app usó este refresh para sacar un access
    // token. Sirve para mostrar "Última actividad" en la UI y para
    // diagnosticar si el refresh quedó stale/revocado.
    t.dateTime('last_used_at').nullable();
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());
    t.dateTime('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_google_tokens');
}
