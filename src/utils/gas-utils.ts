import { xionGasValues } from "@burnt-labs/constants";
import { calculateFee, GasPrice, StdFee } from "@cosmjs/stargate";

export function getGasCalculation(simmedGas: number): StdFee {
  const gasPriceString =
    import.meta.env.VITE_GAS_PRICE || xionGasValues.gasPrice;
  const gasAdjustment = import.meta.env.VITE_GAS_ADJUSTMENT
    ? parseFloat(import.meta.env.VITE_GAS_ADJUSTMENT)
    : xionGasValues.gasAdjustment;
  const gasAdjustmentMargin = import.meta.env.VITE_GAS_MARGIN
    ? parseInt(import.meta.env.VITE_GAS_MARGIN, 10)
    : xionGasValues.gasAdjustmentMargin;

  const adjustedGas = Math.ceil(
    simmedGas * gasAdjustment + gasAdjustmentMargin,
  );

  const gasPrice = GasPrice.fromString(gasPriceString);
  return calculateFee(adjustedGas, gasPrice);
}
