import { Block } from '../entities/Block/Block';
import { INotionRepository } from '../../ports/output/repositories/INotionRepository';

export interface RecursiveBlockOptions {
  maxDepth?: number;
  includeEmptyBlocks?: boolean;
  delayBetweenRequests?: number;
}

export interface RecursiveBlockResult {
  blocks: Block[];
  totalBlocks: number;
  maxDepthReached: number;
  apiCallsCount: number;
}

export class GetBlockChildrenRecursiveUseCase {
  constructor(private notionRepository: INotionRepository) { }

  async execute(
    blockId: string,
    options: RecursiveBlockOptions = {}
  ): Promise<RecursiveBlockResult> {
    if (!blockId) {
      throw new Error('Block ID es requerido');
    }

    const {
      maxDepth = 10,
      includeEmptyBlocks = true,
      delayBetweenRequests = 200
    } = options;

    let apiCallsCount = 0;
    let maxDepthReached = 0;

    const fetchBlocksRecursively = async (
      parentId: string,
      currentDepth: number = 0
    ): Promise<Block[]> => {
      // Verificar límite de profundidad
      if (currentDepth >= maxDepth) {
        console.warn(`Límite de profundidad alcanzado (${maxDepth}) para bloque ${parentId}`);
        return [];
      }

      try {
        // Obtener bloques hijos
        apiCallsCount++;
        const children = await this.notionRepository.getBlockChildren(parentId);

        // Actualizar profundidad máxima alcanzada
        maxDepthReached = Math.max(maxDepthReached, currentDepth);

        // Filtrar bloques vacíos si está configurado
        const filteredChildren = includeEmptyBlocks
          ? children
          : children.filter(this.isNonEmptyBlock);

        // Procesar cada bloque hijo
        const processedBlocks: Block[] = [];

        for (const child of filteredChildren) {
          // Si el bloque tiene hijos, obtenerlos recursivamente
          if (child.hasChildren) {
            try {
              // Pausa para no sobrecargar la API
              if (delayBetweenRequests > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
              }

              const grandchildren = await fetchBlocksRecursively(child.id, currentDepth + 1);

              // Crear nuevo bloque con los hijos incluidos
              const blockWithChildren = new Block(
                child.id,
                child.type,
                child.data,
                child.createdTime,
                child.lastEditedTime,
                child.hasChildren,
                grandchildren
              );

              processedBlocks.push(blockWithChildren);
            } catch (error) {
              console.error(`Error al obtener hijos del bloque ${child.id}:`, error);
              // Agregar el bloque sin hijos en caso de error
              processedBlocks.push(child);
            }
          } else {
            processedBlocks.push(child);
          }
        }

        return processedBlocks;

      } catch (error) {
        console.error(`Error al obtener bloques hijos de ${parentId}:`, error);
        throw error;
      }
    };

    try {
      const blocks = await fetchBlocksRecursively(blockId);
      const totalBlocks = this.countTotalBlocks(blocks);

      return {
        blocks,
        totalBlocks,
        maxDepthReached,
        apiCallsCount
      };

    } catch (error) {
      throw new Error(`Error en obtención recursiva: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Cuenta el total de bloques incluyendo los anidados
   */
  private countTotalBlocks(blocks: Block[]): number {
    let count = blocks.length;

    for (const block of blocks) {
      if (block.children && block.children.length > 0) {
        count += this.countTotalBlocks(block.children);
      }
    }

    return count;
  }

  /**
   * Determina si un bloque no está vacío
   */
  private isNonEmptyBlock(block: Block): boolean {
    // Si tiene hijos, no está vacío
    if (block.hasChildren) {
      return true;
    }

    // Verificar contenido según el tipo de bloque
    switch (block.type) {
      case 'paragraph': {
        const paragraphData = block.data.paragraph as { rich_text?: Array<{ plain_text?: string }> };
        const paragraphText = paragraphData?.rich_text?.map(rt => rt.plain_text).join('').trim() || '';
        return paragraphText.length > 0;
      }

      case 'heading_1':
      case 'heading_2':
      case 'heading_3': {
        const headingData = block.data[block.type] as { rich_text?: Array<{ plain_text?: string }> };
        const headingText = headingData?.rich_text?.map(rt => rt.plain_text).join('').trim() || '';
        return headingText.length > 0;
      }

      case 'bulleted_list_item':
      case 'numbered_list_item': {
        const listData = block.data[block.type] as { rich_text?: Array<{ plain_text?: string }> };
        const listText = listData?.rich_text?.map(rt => rt.plain_text).join('').trim() || '';
        return listText.length > 0;
      }

      case 'image':
      case 'file':
      case 'video':
      case 'bookmark':
      case 'embed':
        // Estos tipos se consideran no vacíos por defecto
        return true;

      case 'divider':
        // Los divisores se consideran no vacíos
        return true;

      default:
        // Para tipos desconocidos, asumimos que no están vacíos
        return true;
    }
  }

  /**
   * Obtiene todos los bloques en una estructura plana (sin jerarquía)
   */
  async executeFlat(
    blockId: string,
    options: RecursiveBlockOptions = {}
  ): Promise<Block[]> {
    const result = await this.execute(blockId, options);
    return this.flattenBlocks(result.blocks);
  }

  /**
   * Convierte una estructura jerárquica de bloques en una lista plana
   */
  private flattenBlocks(blocks: Block[]): Block[] {
    const flattened: Block[] = [];

    for (const block of blocks) {
      flattened.push(block);
      if (block.children && block.children.length > 0) {
        flattened.push(...this.flattenBlocks(block.children));
      }
    }

    return flattened;
  }
} 