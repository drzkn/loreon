import { Block } from './Block';

export class BlockBuilder {
  private id: string = 'test-block-id';
  private type: string = 'paragraph';
  private data: Record<string, unknown> = {};
  private createdTime?: string;
  private lastEditedTime?: string;
  private hasChildren?: boolean;
  private children?: Block[];

  withId(id: string): BlockBuilder {
    this.id = id;
    return this;
  }

  withType(type: string): BlockBuilder {
    this.type = type;
    return this;
  }

  withData(data: Record<string, unknown>): BlockBuilder {
    this.data = data;
    return this;
  }

  withCreatedTime(createdTime: string): BlockBuilder {
    this.createdTime = createdTime;
    return this;
  }

  withLastEditedTime(lastEditedTime: string): BlockBuilder {
    this.lastEditedTime = lastEditedTime;
    return this;
  }

  withHasChildren(hasChildren: boolean): BlockBuilder {
    this.hasChildren = hasChildren;
    return this;
  }

  withChildren(children: Block[]): BlockBuilder {
    this.children = children;
    return this;
  }

  withParagraphContent(content: string): BlockBuilder {
    this.type = 'paragraph';
    this.data = {
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content },
            plain_text: content
          }
        ]
      }
    };
    return this;
  }

  withHeading1Content(content: string): BlockBuilder {
    this.type = 'heading_1';
    this.data = {
      heading_1: {
        rich_text: [
          {
            type: 'text',
            text: { content },
            plain_text: content
          }
        ]
      }
    };
    return this;
  }

  withCodeContent(content: string, language: string = 'javascript'): BlockBuilder {
    this.type = 'code';
    this.data = {
      code: {
        caption: [],
        rich_text: [
          {
            type: 'text',
            text: { content },
            plain_text: content
          }
        ],
        language
      }
    };
    return this;
  }

  withTimestamps(): BlockBuilder {
    this.createdTime = '2023-01-01T00:00:00.000Z';
    this.lastEditedTime = '2023-01-02T00:00:00.000Z';
    return this;
  }

  asParent(): BlockBuilder {
    this.hasChildren = true;
    this.children = [];
    return this;
  }

  asDivider(): BlockBuilder {
    this.type = 'divider';
    this.data = {};
    return this;
  }

  build(): Block {
    return new Block(
      this.id,
      this.type,
      this.data,
      this.createdTime,
      this.lastEditedTime,
      this.hasChildren,
      this.children
    );
  }
}
