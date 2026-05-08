/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, sizes, ...rest } = props;
    return <img {...rest} data-fill={fill ? "true" : undefined} data-sizes={sizes as string} />;
  },
}));
