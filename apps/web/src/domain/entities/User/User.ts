import { NotionUserResponse, UserType } from "@/shared/types/notion.types";

export class User {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly avatarUrl?: string,
    public readonly type: UserType = 'person',
    public readonly email?: string
  ) { }

  static fromNotionResponse(data: NotionUserResponse): User {
    return new User(
      data.id,
      data.name,
      data.avatar_url,
      data.type,
      data.person?.email
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatarUrl: this.avatarUrl,
      type: this.type,
      email: this.email
    };
  }
} 