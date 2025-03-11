import { xionGasValues, type ChainInfo } from "@burnt-labs/constants";
import { calculateFee, GasPrice, StdFee } from "@cosmjs/stargate";

export function formatGasPrice(chainInfo: ChainInfo): GasPrice {
  const feeCurrency = chainInfo.feeCurrencies[0];
  const gasPrice = feeCurrency.gasPriceStep.low;
  return GasPrice.fromString(`${gasPrice}${feeCurrency.coinMinimalDenom}`);
}

export function getGasCalculation(
  simmedGas: number,
  chainInfo: ChainInfo,
): StdFee {
  const gasPrice = formatGasPrice(chainInfo);
  const gasAdjustment = import.meta.env.VITE_GAS_ADJUSTMENT
    ? parseFloat(import.meta.env.VITE_GAS_ADJUSTMENT)
    : xionGasValues.gasAdjustment;
  const gasAdjustmentMargin = import.meta.env.VITE_GAS_MARGIN
    ? parseInt(import.meta.env.VITE_GAS_MARGIN, 10)
    : xionGasValues.gasAdjustmentMargin;

  const adjustedGas = Math.ceil(
    simmedGas * gasAdjustment + gasAdjustmentMargin,
  );

  return calculateFee(adjustedGas, gasPrice);
}
