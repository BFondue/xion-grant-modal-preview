import { xionGasValues } from "@burnt-labs/constants";
import { calculateFee, GasPrice, StdFee } from "@cosmjs/stargate";

export function getGasCalculation(simmedGas: number, chainId: string): StdFee {
  const gasPriceString =
    import.meta.env.VITE_GAS_PRICE || xionGasValues.gasPrice;
  const gasAdjustment = import.meta.env.VITE_GAS_ADJUSTMENT
    ? parseFloat(import.meta.env.VITE_GAS_ADJUSTMENT)
    : xionGasValues.gasAdjustment;
  const gasAdjustmentMargin = import.meta.env.VITE_GAS_MARGIN
    ? parseInt(import.meta.env.VITE_GAS_MARGIN, 10)
    : xionGasValues.gasAdjustmentMargin;

  const gasPrice = GasPrice.fromString(gasPriceString);
  const calculatedFee: StdFee = calculateFee(simmedGas, gasPrice);

  let fee: StdFee;
  const gas = Math.ceil(
    parseInt(calculatedFee.gas) * gasAdjustment + gasAdjustmentMargin,
  ).toString();

  if (/testnet/.test(chainId)) {
    fee = { amount: [{ amount: "0", denom: "uxion" }], gas };
  } else {
    fee = { amount: calculatedFee.amount, gas };
  }

  return fee;
}
