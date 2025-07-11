import { NotionBlockResponse } from "../notion.types";

export const mockNotionBlockResponse: NotionBlockResponse = {
  id: 'block-123',
  type: 'paragraph',
  created_time: '2023-01-01T00:00:00.000Z',
  last_edited_time: '2023-01-02T00:00:00.000Z',
  has_children: false,
  paragraph: {
    rich_text: [
      {
        type: 'text',
        text: { content: 'Hello World' },
        plain_text: 'Hello World'
      }
    ]
  }
};

export const mockNotionBlockWithChildren: NotionBlockResponse = {
  id: 'block-456',
  type: 'heading_1',
  created_time: '2023-01-01T00:00:00.000Z',
  last_edited_time: '2023-01-02T00:00:00.000Z',
  has_children: true,
  heading_1: {
    rich_text: [
      {
        type: 'text',
        text: { content: 'Main Title' },
        plain_text: 'Main Title'
      }
    ]
  },
  children: [
    {
      id: 'child-789',
      type: 'paragraph',
      created_time: '2023-01-01T00:00:00.000Z',
      last_edited_time: '2023-01-02T00:00:00.000Z',
      has_children: false,
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Child content' },
            plain_text: 'Child content'
          }
        ]
      }
    }
  ]
};