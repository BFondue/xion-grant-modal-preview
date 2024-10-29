export const Divider = ({ margin = 6 }: { margin?: number }) => {
  return (
    <div className={`ui-my-${margin} ui-h-[1px] ui-w-full ui-bg-white/20`} />
  );
};
