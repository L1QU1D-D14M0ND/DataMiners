/**
 * Generic base class for singleton game registries.
 *
 * Shared by BuildingRegistry, TileRegistry, and any future registries that
 * follow the same register → lookup → mutate → notify pattern.
 */
export abstract class GameRegistry<K extends string, V> {
  protected items: Map<K, V> = new Map()
  private listeners: Set<() => void> = new Set()

  constructor(private readonly eventName: string) {}

  protected abstract cloneItem(item: V): V

  register(item: V, key: K): void {
    this.items.set(key, this.cloneItem(item))
  }

  get(id: K): V | undefined {
    return this.items.get(id)
  }

  getAll(): V[] {
    return Array.from(this.items.values())
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  protected emitChange(): void {
    this.listeners.forEach((listener) => listener())
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(this.eventName))
    }
  }
}
