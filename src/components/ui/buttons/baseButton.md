# Base Button Component Examples

## Basic Usage

```tsx
<BaseButton>LOGIN / SIGNUP</BaseButton>
```

## Destructive Variant

```tsx
<BaseButton variant="destructive">DENY ACCESS</BaseButton>
```

## With Back Arrow

```tsx
<BaseButton backArrow>GO BACK</BaseButton>
```

## Text Variant

```tsx
<BaseButton variant="text" size="text">
  SWITCH ACCOUNTS
</BaseButton>
```

## Icon with Metamask

```tsx
<BaseButton variant="secondary" size="icon-large">
  <MetamaskLogo className="ui-min-w-7 ui-min-h-7" />
</BaseButton>
```

## Double Chevron Icon

```tsx
<BaseButton variant="secondary" size="icon" className="ui-group/basebutton">
  <div className="ui-flex ui-items-center ui-justify-center">
    <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
    <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
  </div>
</BaseButton>
```

## Small Size

```tsx
<BaseButton size="small">LOG IN</BaseButton>
```
