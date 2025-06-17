import React, { useState } from "react";
import { ChevronDownIcon } from "./icons/ChevronDown";
import { cn } from "../../utils/classname-util";

interface AccordionItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, "title"> {
  title: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  expandable?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  icon,
  expandable = false,
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <li
      className={cn(
        `ui-flex ui-items-baseline ui-text-base ui-overflow-x-none`,
        className,
      )}
      {...props}
    >
      {icon && <span className="ui-mr-2">{icon}</span>}
      <div className="ui-flex ui-flex-col ui-w-full">
        <div
          className={cn(
            "ui-flex ui-items-center ui-justify-between ui-w-full",
            { "ui-cursor-pointer": expandable },
          )}
          onClick={expandable ? toggleOpen : undefined}
        >
          <span
            className="ui-text-primary-text"
            style={{
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </span>
          {expandable && (
            <ChevronDownIcon isUp={isOpen} className="ui-min-w-5 ui-min-h-5" />
          )}
        </div>
        {isOpen && children && (
          <div className="ui-mt-2 ui-pl-4 ui-max-h-96 ui-overflow-y-auto ui-text-sm">
            {children}
          </div>
        )}
      </div>
    </li>
  );
};

interface AccordionProps {
  items: AccordionItemProps[];
}

export const Accordion: React.FC<AccordionProps> = ({ items }) => {
  return (
    <ul className="ui-list-none ui-p-4 ui-bg-black/50 ui-rounded-lg ui-flex ui-flex-col ui-gap-4">
      {items.map((item, index) => (
        <AccordionItem key={index} {...item} />
      ))}
    </ul>
  );
};
