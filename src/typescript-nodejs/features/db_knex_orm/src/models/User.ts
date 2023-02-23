import { Model } from "tiny-knex-orm";
import { db } from "../lib/db";

interface UserRecord {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

class UserModel extends Model<UserRecord> {
  constructor() {
    super({
      idField: "id",
      table: "users",
      createdField: "created_at",
      updatedField: "updated_at",
      deletedField: "deleted_at",
      db,
    });
  }
}

export const User = new UserModel();
