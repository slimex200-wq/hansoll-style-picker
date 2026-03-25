import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { fill, sizes, ...rest } = props;
    return <img {...rest} data-fill={fill ? "true" : undefined} data-sizes={sizes as string} />;
  },
}));
