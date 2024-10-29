import { FormattedAssetAmount } from "../../types/assets";

export const OverviewBalanceRow = ({
  label = "",
  asset,
}: {
  label: string;
  asset: FormattedAssetAmount;
}) => {
  const userLocales = navigator.languages || [navigator.language];
  const userLocale = userLocales[0];

  return (
    <div className="ui-flex ui-items-center ui-justify-between ui-mb-3">
      <p className="ui-font-akkuratLL ui-text-base ui-font-normal ui-leading-normal ui-text-white">
        {label}
      </p>
      <div className="ui-flex ui-w-2/5 ui-justify-end">
        <p className="ui-font-akkuratLL ui-text-base ui-font-normal ui-leading-normal ui-text-white ui-w-1/2 ui-text-right">
          {asset.value} {asset.symbol}
        </p>
        <p className="ui-font-akkuratLL ui-ml-6 ui-text-right ui-text-base ui-font-normal ui-leading-normal ui-text-white/70">
          ${asset.dollarValue.toFixed(2)} USD
        </p>
      </div>
    </div>
  );
};
