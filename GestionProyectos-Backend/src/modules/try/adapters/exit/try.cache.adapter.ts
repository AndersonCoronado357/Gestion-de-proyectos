// Caché in-memory simple para try. Reemplazable por Redis sin cambiar
// los use-cases (ese es justo el punto de tenerlo como adapter).

class TryCacheAdapter<V = unknown> {
  private store: Map<string, V>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<V | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: V, ttlMs = 60_000): Promise<void> {
    this.store.set(key, value);
    const t = setTimeout(() => this.store.delete(key), ttlMs);
    if (typeof (t as NodeJS.Timeout).unref === 'function') {
      (t as NodeJS.Timeout).unref();
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

module.exports = TryCacheAdapter;
module.exports.default = TryCacheAdapter;
