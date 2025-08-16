import { Block as BlockEntity } from '../Block';

export class Block {
  private id: string = 'test-block-id';
  private type: string = 'paragraph';
  private data: Record<string, unknown> = {};
  private createdTime?: string;
  private lastEditedTime?: string;
  private hasChildren?: boolean;
  private children?: BlockEntity[];

  withId(id: string): Block {
    this.id = id;
    return this;
  }

  withType(type: string): Block {
    this.type = type;
    return this;
  }

  withData(data: Record<string, unknown>): Block {
    this.data = data;
    return this;
  }

  withCreatedTime(createdTime: string): Block {
    this.createdTime = createdTime;
    return this;
  }

  withLastEditedTime(lastEditedTime: string): Block {
    this.lastEditedTime = lastEditedTime;
    return this;
  }

  withHasChildren(hasChildren: boolean): Block {
    this.hasChildren = hasChildren;
    return this;
  }

  withChildren(children: BlockEntity[]): Block {
    this.children = children;
    return this;
  }

  withParagraphContent(content: string): Block {
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

  withHeading1Content(content: string): Block {
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

  withCodeContent(content: string, language: string = 'javascript'): Block {
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

  withTimestamps(): Block {
    this.createdTime = '2023-01-01T00:00:00.000Z';
    this.lastEditedTime = '2023-01-02T00:00:00.000Z';
    return this;
  }

  asParent(): Block {
    this.hasChildren = true;
    this.children = [];
    return this;
  }

  asDivider(): Block {
    this.type = 'divider';
    this.data = {};
    return this;
  }

  build(): BlockEntity {
    return new BlockEntity(
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
