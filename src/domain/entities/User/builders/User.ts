import { User as UserEntity } from '../User';
import { UserType } from '@/shared/types/notion.types';

export class User {
  private id: string = 'test-user-id';
  private name?: string;
  private avatarUrl?: string;
  private type: UserType = 'person';
  private email?: string;

  withId(id: string): User {
    this.id = id;
    return this;
  }

  withName(name: string): User {
    this.name = name;
    return this;
  }

  withAvatarUrl(avatarUrl: string): User {
    this.avatarUrl = avatarUrl;
    return this;
  }

  withType(type: UserType): User {
    this.type = type;
    return this;
  }

  withEmail(email: string): User {
    this.email = email;
    return this;
  }

  asPerson(): User {
    this.type = 'person';
    return this;
  }

  asBot(): User {
    this.type = 'bot';
    return this;
  }

  withTestAvatar(): User {
    this.avatarUrl = `https://avatar.url/${this.id}.jpg`;
    return this;
  }

  withTestEmail(): User {
    const domain = this.type === 'bot' ? 'notion.so' : 'example.com';
    this.email = `${this.id}@${domain}`;
    return this;
  }

  withFullProfile(name: string, email?: string): User {
    this.name = name;
    this.withTestAvatar();
    if (email) {
      this.email = email;
    } else {
      this.withTestEmail();
    }
    return this;
  }

  build(): UserEntity {
    return new UserEntity(
      this.id,
      this.name,
      this.avatarUrl,
      this.type,
      this.email
    );
  }
}
