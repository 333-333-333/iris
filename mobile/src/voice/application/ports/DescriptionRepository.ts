export interface DescriptionRepository {
  saveLastDescription(description: string): Promise<void>;
  getLastDescription(): Promise<string | null>;
  clear(): Promise<void>;
}
