import { Page as PageEntity } from '../Page';

export class Page {
  private id: string = 'test-page-id';
  private properties: Record<string, unknown> = {};
  private createdTime?: string;
  private lastEditedTime?: string;
  private url?: string;

  withId(id: string): Page {
    this.id = id;
    return this;
  }

  withProperties(properties: Record<string, unknown>): Page {
    this.properties = properties;
    return this;
  }

  withCreatedTime(createdTime: string): Page {
    this.createdTime = createdTime;
    return this;
  }

  withLastEditedTime(lastEditedTime: string): Page {
    this.lastEditedTime = lastEditedTime;
    return this;
  }

  withUrl(url: string): Page {
    this.url = url;
    return this;
  }

  withTitle(title: string): Page {
    this.properties = {
      ...this.properties,
      title: {
        title: [{ plain_text: title }]
      }
    };
    return this;
  }

  withStatus(status: string): Page {
    this.properties = {
      ...this.properties,
      status: {
        select: { name: status }
      }
    };
    return this;
  }

  withRelation(relationIds: string[]): Page {
    this.properties = {
      ...this.properties,
      relation: {
        relation: relationIds.map(id => ({ id }))
      }
    };
    return this;
  }

  withFormula(formulaValue: string): Page {
    this.properties = {
      ...this.properties,
      formula: {
        formula: { type: 'string', string: formulaValue }
      }
    };
    return this;
  }

  withTimestamps(): Page {
    this.createdTime = '2023-01-01T00:00:00.000Z';
    this.lastEditedTime = '2023-01-02T00:00:00.000Z';
    return this;
  }

  withNotionUrl(): Page {
    this.url = `https://notion.so/${this.id}`;
    return this;
  }

  build(): PageEntity {
    return new PageEntity(
      this.id,
      this.properties,
      this.createdTime,
      this.lastEditedTime,
      this.url
    );
  }
}
