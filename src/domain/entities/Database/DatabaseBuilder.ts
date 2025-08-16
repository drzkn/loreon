import { Database } from './Database';

export class DatabaseBuilder {
  private id: string = 'test-database-id';
  private title: string = 'Test Database';
  private properties: Record<string, unknown> = {};
  private createdTime?: string;
  private lastEditedTime?: string;
  private url?: string;

  withId(id: string): DatabaseBuilder {
    this.id = id;
    return this;
  }

  withTitle(title: string): DatabaseBuilder {
    this.title = title;
    return this;
  }

  withProperties(properties: Record<string, unknown>): DatabaseBuilder {
    this.properties = properties;
    return this;
  }

  withCreatedTime(createdTime: string): DatabaseBuilder {
    this.createdTime = createdTime;
    return this;
  }

  withLastEditedTime(lastEditedTime: string): DatabaseBuilder {
    this.lastEditedTime = lastEditedTime;
    return this;
  }

  withUrl(url: string): DatabaseBuilder {
    this.url = url;
    return this;
  }

  withTitleProperty(): DatabaseBuilder {
    this.properties = {
      ...this.properties,
      Name: {
        id: 'title',
        name: 'Name',
        type: 'title',
        title: {}
      }
    };
    return this;
  }

  withStatusProperty(): DatabaseBuilder {
    this.properties = {
      ...this.properties,
      Status: {
        id: 'status',
        name: 'Status',
        type: 'select',
        select: {
          options: [
            { id: '1', name: 'Active', color: 'green' },
            { id: '2', name: 'Inactive', color: 'red' }
          ]
        }
      }
    };
    return this;
  }

  withDateProperty(): DatabaseBuilder {
    this.properties = {
      ...this.properties,
      'Created Date': {
        id: 'created',
        name: 'Created Date',
        type: 'created_time',
        created_time: {}
      }
    };
    return this;
  }

  withTextProperty(name: string): DatabaseBuilder {
    this.properties = {
      ...this.properties,
      [name]: {
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        type: 'rich_text',
        rich_text: {}
      }
    };
    return this;
  }

  withNumberProperty(name: string): DatabaseBuilder {
    this.properties = {
      ...this.properties,
      [name]: {
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        type: 'number',
        number: { format: 'number' }
      }
    };
    return this;
  }

  withTimestamps(): DatabaseBuilder {
    this.createdTime = '2023-01-01T00:00:00.000Z';
    this.lastEditedTime = '2023-01-02T00:00:00.000Z';
    return this;
  }

  withNotionUrl(): DatabaseBuilder {
    this.url = `https://notion.so/${this.id}`;
    return this;
  }

  withBasicProperties(): DatabaseBuilder {
    return this
      .withTitleProperty()
      .withStatusProperty()
      .withDateProperty();
  }

  build(): Database {
    return new Database(
      this.id,
      this.title,
      this.properties,
      this.createdTime,
      this.lastEditedTime,
      this.url
    );
  }
}
