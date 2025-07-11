import { NotionBlockResponse } from '../../../shared/types/notion.types';

export class Block {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly data: Record<string, unknown>,
    public readonly createdTime?: string,
    public readonly lastEditedTime?: string,
    public readonly hasChildren?: boolean,
    public readonly children?: Block[]
  ) { }

  static fromNotionResponse(data: NotionBlockResponse): Block {
    // Extraer las propiedades específicas del tipo de bloque
    const { id, type, created_time, last_edited_time, has_children, ...blockData } = data;

    return new Block(
      id,
      type,
      blockData,
      created_time as string | undefined,
      last_edited_time as string | undefined,
      has_children as boolean | undefined,
      []
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      createdTime: this.createdTime,
      lastEditedTime: this.lastEditedTime,
      hasChildren: this.hasChildren,
      children: this.children?.map(child => child.toJSON())
    };
  }

  // Método para convertir de vuelta al formato de NotionBlockResponse
  toNotionBlockResponse(): NotionBlockResponse {
    return {
      id: this.id,
      type: this.type,
      created_time: this.createdTime,
      last_edited_time: this.lastEditedTime,
      has_children: this.hasChildren,
      ...this.data
    } as NotionBlockResponse;
  }
} 