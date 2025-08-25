import { DaoDaoTreasuryStrategy } from "../treasury-strategies/daodao-treasury-strategy";
import { DirectQueryTreasuryStrategy } from "../treasury-strategies/direct-query-treasury-strategy";
import { CompositeTreasuryStrategy } from "../treasury-strategies/composite-treasury-strategy";
import type { TreasuryStrategy } from "../treasury-strategies/types";

/**
 * Available treasury strategy options
 */
export enum TreasuryStrategyType {
  DAODAO = "daodao",
  DIRECT = "direct",
  COMPOSITE = "composite",
}

/**
 * Get the configured treasury strategy
 * Defaults to composite strategy (DaoDao with fallback to direct query)
 */
export function getTreasuryStrategy(): TreasuryStrategy {
  const strategyType = (import.meta.env.VITE_TREASURY_STRATEGY ||
    TreasuryStrategyType.COMPOSITE) as TreasuryStrategyType;

  switch (strategyType) {
    case TreasuryStrategyType.DAODAO:
      return new DaoDaoTreasuryStrategy();

    case TreasuryStrategyType.DIRECT:
      return new DirectQueryTreasuryStrategy();

    case TreasuryStrategyType.COMPOSITE:
    default:
      // Use DaoDao as primary, direct query as fallback
      return new CompositeTreasuryStrategy(
        new DaoDaoTreasuryStrategy(),
        new DirectQueryTreasuryStrategy(),
      );
  }
}

/**
 * React hook to get the treasury strategy
 * Can be extended in the future to support dynamic strategy switching
 */
export function useTreasuryStrategy(): TreasuryStrategy {
  // For now, just return the configured strategy
  // In the future, this could be context-based or dynamically switchable
  return getTreasuryStrategy();
}
