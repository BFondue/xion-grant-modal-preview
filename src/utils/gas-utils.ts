import { xionGasValues, type ChainInfo } from "@burnt-labs/constants";
import { calculateFee, GasPrice, StdFee } from "@cosmjs/stargate";
import { GAS_ADJUSTMENT, GAS_MARGIN } from "../config";

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
  const gasAdjustment = GAS_ADJUSTMENT || xionGasValues.gasAdjustment;
  const gasAdjustmentMargin = GAS_MARGIN || xionGasValues.gasAdjustmentMargin;

  const adjustedGas = Math.ceil(
    simmedGas * gasAdjustment + gasAdjustmentMargin,
  );

  return calculateFee(adjustedGas, gasPrice);
}
