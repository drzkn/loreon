export const getDelay = (riskLevel: string) => {
  if (riskLevel === 'HIGH') {
    return 300
  };

  if (riskLevel === 'MEDIUM') {
    return 150
  };

  return 100;
}

export const getFullParallelStrategy = (pageCount: number) => ({
  strategy: 'FULL_PARALLEL',
  batchSize: pageCount,
  description: 'Paralelización total (todas las páginas simultáneamente)',
  riskLevel: 'LOW'
});

export const largeBatchesStrategy = {
  strategy: 'LARGE_BATCHES',
  batchSize: 15,
  description: 'Lotes grandes (15 páginas por lote)',
  riskLevel: 'MEDIUM'
};

export const mediumBatchesStrategy = {
  strategy: 'MEDIUM_BATCHES',
  batchSize: 10,
  description: 'Lotes medianos (10 páginas por lote)',
  riskLevel: 'MEDIUM'
};

export const safeBatchesStrategy = {
  strategy: 'SAFE_BATCHES',
  batchSize: 5,
  description: 'Lotes seguros (5 páginas por lote) + pausas largas',
  riskLevel: 'HIGH'
};