import fs from 'fs';
import { MongoClient } from 'mongodb';
import config from '../config';
import type { Db } from 'mongodb';
import type { ContextJSON } from '../gpt/Context';

interface ContextStorage {
  type: 'mongo' | 'file';
  loadContext(id: string): Promise<ContextJSON | null>;
  saveContext(id: string, context: ContextJSON): void;
  countContexts(): Promise<number>;
}

class MongoContextStorage implements ContextStorage {
  public readonly type = 'mongo';
  private readonly client: MongoClient;
  private readonly db: Db;

  constructor(uri: string, dbName: string) {
    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
  }

  async loadContext(_id: string): Promise<ContextJSON | null> {
    const doc = await this.db
      .collection('contexts')
      // @ts-expect-error
      .findOne({ _id }) as unknown;
    return (doc) ? doc as ContextJSON : null;
  }

  async saveContext(_id: string, context: ContextJSON) {
    await this.db
      .collection('contexts')
      // @ts-expect-error
      .updateOne({ _id }, { $set: context }, { upsert: true });
  }

  async countContexts(): Promise<number> {
    return this.db.collection('contexts').countDocuments();
  }
}

class FileContextStorage implements ContextStorage {
  public readonly type = 'file';
  private directoryPath: string;

  constructor(directoryPath: string) {
    this.directoryPath = directoryPath;
  }

  private getPath(id: string) {
    if (!fs.existsSync(this.directoryPath)) fs.mkdirSync(this.directoryPath);
    return `${this.directoryPath}/${id}.json`;
  }

  async loadContext(id: string): Promise<ContextJSON | null> {
    const path = this.getPath(id);
    if (!fs.existsSync(path)) return null;

    const raw = fs.readFileSync(path, { encoding: 'utf-8' });
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse context file '${path}'`);
      return null;
    }
  }

  async saveContext(id: string, context: ContextJSON) {
    fs.writeFileSync(
      this.getPath(id),
      JSON.stringify(context, null, 2),
      { encoding: 'utf-8' },
    );
  }

  async countContexts(): Promise<number> {
    return fs.readdirSync(this.directoryPath).length;
  }
}

export default function createContextStorage(): ContextStorage {
  if (config.mongo.uri && config.mongo.db) {
    return new MongoContextStorage(
      config.mongo.uri,
      config.mongo.db,
    );
  }
  return new FileContextStorage('./contexts');
}
