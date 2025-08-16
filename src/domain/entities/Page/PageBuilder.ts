import { Page } from './Page';

export class PageBuilder {
  private id: string = 'test-page-id';
  private properties: Record<string, unknown> = {};
  private createdTime?: string;
  private lastEditedTime?: string;
  private url?: string;

  withId(id: string): PageBuilder {
    this.id = id;
    return this;
  }

  withProperties(properties: Record<string, unknown>): PageBuilder {
    this.properties = properties;
    return this;
  }

  withCreatedTime(createdTime: string): PageBuilder {
    this.createdTime = createdTime;
    return this;
  }

  withLastEditedTime(lastEditedTime: string): PageBuilder {
    this.lastEditedTime = lastEditedTime;
    return this;
  }

  withUrl(url: string): PageBuilder {
    this.url = url;
    return this;
  }

  withTitle(title: string): PageBuilder {
    this.properties = {
      ...this.properties,
      title: { 
        title: [{ plain_text: title }] 
      }
    };
    return this;
  }

  withStatus(status: string): PageBuilder {
    this.properties = {
      ...this.properties,
      status: { 
        select: { name: status } 
      }
    };
    return this;
  }

  withRelation(relationIds: string[]): PageBuilder {
    this.properties = {
      ...this.properties,
      relation: {
        relation: relationIds.map(id => ({ id }))
      }
    };
    return this;
  }

  withFormula(formulaValue: string): PageBuilder {
    this.properties = {
      ...this.properties,
      formula: {
        formula: { type: 'string', string: formulaValue }
      }
    };
    return this;
  }

  withTimestamps(): PageBuilder {
    this.createdTime = '2023-01-01T00:00:00.000Z';
    this.lastEditedTime = '2023-01-02T00:00:00.000Z';
    return this;
  }

  withNotionUrl(): PageBuilder {
    this.url = `https://notion.so/${this.id}`;
    return this;
  }

  build(): Page {
    return new Page(
      this.id,
      this.properties,
      this.createdTime,
      this.lastEditedTime,
      this.url
    );
  }
}
