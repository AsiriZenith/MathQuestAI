import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FixedField } from "@/app/_components/fixed-field";

describe("FixedField", () => {
  it("renders the label, value, and a Fixed badge", () => {
    render(<FixedField label="Subject" value="Mathematics" />);

    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
  });
});
