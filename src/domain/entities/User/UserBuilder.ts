import { User } from './User';
import { UserType } from '@/shared/types/notion.types';

export class UserBuilder {
  private id: string = 'test-user-id';
  private name?: string;
  private avatarUrl?: string;
  private type: UserType = 'person';
  private email?: string;

  withId(id: string): UserBuilder {
    this.id = id;
    return this;
  }

  withName(name: string): UserBuilder {
    this.name = name;
    return this;
  }

  withAvatarUrl(avatarUrl: string): UserBuilder {
    this.avatarUrl = avatarUrl;
    return this;
  }

  withType(type: UserType): UserBuilder {
    this.type = type;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.email = email;
    return this;
  }

  asPerson(): UserBuilder {
    this.type = 'person';
    return this;
  }

  asBot(): UserBuilder {
    this.type = 'bot';
    return this;
  }

  withTestAvatar(): UserBuilder {
    this.avatarUrl = `https://avatar.url/${this.id}.jpg`;
    return this;
  }

  withTestEmail(): UserBuilder {
    const domain = this.type === 'bot' ? 'notion.so' : 'example.com';
    this.email = `${this.id}@${domain}`;
    return this;
  }

  withFullProfile(name: string, email?: string): UserBuilder {
    this.name = name;
    this.withTestAvatar();
    if (email) {
      this.email = email;
    } else {
      this.withTestEmail();
    }
    return this;
  }

  build(): User {
    return new User(
      this.id,
      this.name,
      this.avatarUrl,
      this.type,
      this.email
    );
  }
}
