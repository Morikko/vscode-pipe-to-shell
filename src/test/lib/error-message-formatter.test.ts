import * as assert from "assert";
import { ErrorMessageFormatter } from "../../lib/error-message-formatter";

describe("ErrorMessageFormatter", () => {
  const formatter = new ErrorMessageFormatter();

  it("trim text", () => {
    const formattedText = formatter.format("  normal text  ");
    assert.deepStrictEqual(formattedText, "normal text");
  });
});
