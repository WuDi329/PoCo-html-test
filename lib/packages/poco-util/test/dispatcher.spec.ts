import { describe, it } from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { EventDispatcher } from "../src/index";

const { expect } = chai.use(chaiAsPromised);

type Events = {
  hello: (this: ThisType<EventDispatcher<Events>>, message: string) => void;
  say: (
    this: ThisType<EventDispatcher<Events>>,
    message: string,
    to: string
  ) => void;
};

describe("dispatcher", () => {
  let dispatcher: EventDispatcher<Events>;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
  });

  describe("basic cases", () => {
    let message = Math.random().toString();

    it("#on() #emit()", async () => {
      dispatcher.on("say", (d1, d2) => {
        expect(d1).to.be.equal(message);
        expect(d2).to.be.equal(message);
      });

      dispatcher.emit("say", message, message);
    });

    it("#on() #off()", async () => {
      const callback = () => {};

      expect(dispatcher.on("hello", callback)).to.be.true;
      expect(dispatcher.off("hello", callback)).to.be.true;
      expect(dispatcher.listeners("hello").length).to.be.equal(0);
    });

    it("#once() #emit()", async () => {
      setImmediate(() => {
        dispatcher.emit("hello", message);
      });

      const [d1] = await dispatcher.once("hello");

      expect(d1).equal(message);
    });

    it("#once() #emit()", async () => {
      setImmediate(() => {
        dispatcher.emit("say", message, "world");
      });

      const [d1, d2] = await dispatcher.once("say");

      expect(d1).equal(message);
      expect(d2).equal("world");
    });

    it("#once() #emit() timeout", async () => {
      setTimeout(() => {
        dispatcher.emit("say", message, message);
      }, 50);

      expect(
        dispatcher.once("say", { timeout: 10 })
      ).to.be.eventually.rejectedWith("timeout");
    });

    it("#once() #emit() abort", async () => {
      const controller = new AbortController();

      setImmediate(() => {
        controller.abort();
      });

      expect(
        dispatcher.once("say", { signal: controller.signal })
      ).to.be.eventually.rejectedWith("abort");
    });

    it("#once() #emit() abort instead of timeout", async () => {
      setTimeout(() => {
        dispatcher.emit("say", message, message);
      }, 50);

      const controller = new AbortController();

      setImmediate(() => {
        controller.abort();
      });

      expect(
        dispatcher.once("say", { signal: controller.signal })
      ).to.be.eventually.rejectedWith("abort");
    });
  });

  describe("trigger order", () => {
    it("async after sync", async () => {
      let index = 0;

      dispatcher.on("hello", () => {
        expect(index).to.be.equal(0);

        index++;
      });

      dispatcher.on("hello", () => {
        expect(index).to.be.equal(1);

        index++;
      });

      dispatcher.on(
        "hello",
        () => {
          expect(index).to.be.equal(3);

          index++;
        },
        { async: true }
      );

      dispatcher.on("hello", () => {
        expect(index).to.be.equal(2);

        index++;
      });

      dispatcher.emit("hello", "world");
    });
  });
});
