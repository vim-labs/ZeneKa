const { assert } = require("chai");
const ZeneKaG16 = artifacts.require("ZeneKaG16");
const ZeneKaGM17 = artifacts.require("ZeneKaGM17");
const ZeneKaPGHR13 = artifacts.require("ZeneKaPGHR13");
const vk = require("../example_vk.json");
const id = require("../example_vk_id.json");
const proof = require("../example_proof.json");
const proofHash = require("../example_proofHash.json");

contract("ZeneKaG16", accounts => {
  const [k0, k1] = accounts;
  let zeneKaG16;

  it("should initialize", async () => {
    zeneKaG16 = await ZeneKaG16.deployed();
    console.log("ZeneKaG16 Address:", zeneKaG16.address);
  });

  it("should register a new verifier", async () => {
    const registrant = (
      await zeneKaG16.registerG16(...vk["vkG16"], {
        from: k0
      })
    ).receipt.logs[0].args._registrant;
    assert(registrant == k0);
  });

  it("should not register a duplicate verifier", async () => {
    const noRegistrant = (
      await zeneKaG16.registerG16(...vk["vkG16"], {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(noRegistrant);
  });

  it("should commit a proofHash", async () => {
    await zeneKaG16.commitG16(id["vkG16Id"], proofHash["proofHashG16"], {
      from: k0
    });
  });

  it("should return a commit prover", async () => {
    const commitProver = await zeneKaG16.prover(proofHash["proofHashG16"], {
      from: k0
    });
    assert(commitProver == k0);
  });

  it("should throw if adding a duplicate proofHash", async () => {
    try {
      await zeneKaG16.commitG16(id["vkG16Id"], proofHash["proofHashG16"], {
        from: k1
      });
    } catch (err) {
      return 1;
    }
  });

  it("should verify a falsey prover", async () => {
    const isVerified = await zeneKaG16.verify(id["vkG16Id"], k0);
    assert.isFalse(isVerified);
  });

  it("should not validate a bad proof", async () => {
    const badProof = JSON.parse(JSON.stringify(proof["proofG16"]));
    badProof[badProof.length - 1][0] = 0;
    const badProver = (
      await zeneKaG16.proveG16(id["vkG16Id"], ...badProof, {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(badProver);
  });

  it("should only validate own proof", async () => {
    const unauthorizedProof = (
      await zeneKaG16.proveG16(id["vkG16Id"], ...proof["proofG16"], {
        from: k1
      })
    ).receipt.logs;

    assert.isEmpty(unauthorizedProof);
  });

  it("should throw on unverified proof input requests", async () => {
    try {
      await zeneKaG16.input(id["vkG16Id"], k0);
    } catch (err) {
      return 1;
    }
  });

  it("should validate a proof", async () => {
    const prover = (
      await zeneKaG16.proveG16(id["vkG16Id"], ...proof["proofG16"], {
        from: k0
      })
    ).receipt.logs[0].args._prover;

    assert(prover == k0);
  });

  it("should verify a prover", async () => {
    const isVerified = await zeneKaG16.verify(id["vkG16Id"], k0);
    assert(isVerified);
  });

  it("should return validated proof input requests", async () => {
    const proofG16Inputs = proof["proofG16"][proof["proofG16"].length - 1];
    const proofInput = (
      await zeneKaG16.input(id["vkG16Id"], k0)
    ).map(inputValue => inputValue.toString());
    for (let i = 0; i < proofG16Inputs.length; i++) {
      assert(proofInput[i] == proofG16Inputs[i]);
    }
  });
});

contract("ZeneKaGM17", accounts => {
  const [k0, k1] = accounts;
  let zeneKaGM17;

  it("should initialize", async () => {
    zeneKaGM17 = await ZeneKaGM17.deployed();
    console.log("ZeneKaGM17 Address:", zeneKaGM17.address);
  });

  it("should register a new verifier", async () => {
    const registrant = (
      await zeneKaGM17.registerGM17(...vk["vkGM17"], {
        from: k0
      })
    ).receipt.logs[0].args._registrant;
    assert(registrant == k0);
  });

  it("should not register a duplicate verifier", async () => {
    const noRegistrant = (
      await zeneKaGM17.registerGM17(...vk["vkGM17"], {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(noRegistrant);
  });

  it("should commit a proofHash", async () => {
    await zeneKaGM17.commitGM17(id["vkGM17Id"], proofHash["proofHashGM17"], {
      from: k0
    });
  });

  it("should return a commit prover", async () => {
    const commitProver = await zeneKaGM17.prover(proofHash["proofHashGM17"], {
      from: k0
    });
    assert(commitProver == k0);
  });

  it("should throw if adding a duplicate proofHash", async () => {
    try {
      await zeneKaGM17.commitGM17(id["vkGM17Id"], proofHash["proofHashGM17"], {
        from: k1
      });
    } catch (err) {
      return 1;
    }
  });

  it("should verify a falsey prover", async () => {
    const isVerified = await zeneKaGM17.verify(id["vkGM17Id"], k0);
    assert.isFalse(isVerified);
  });

  it("should not validate a bad proof", async () => {
    const badProof = JSON.parse(JSON.stringify(proof["proofGM17"]));
    badProof[badProof.length - 1][0] = 0;
    const badProver = (
      await zeneKaGM17.proveGM17(id["vkGM17Id"], ...badProof, {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(badProver);
  });

  it("should only validate own proof", async () => {
    const unauthorizedProof = (
      await zeneKaGM17.proveGM17(id["vkGM17Id"], ...proof["proofGM17"], {
        from: k1
      })
    ).receipt.logs;

    assert.isEmpty(unauthorizedProof);
  });

  it("should throw on unverified proof input requests", async () => {
    try {
      await zeneKaGM17.input(id["vkGM17Id"], k0);
    } catch (err) {
      return 1;
    }
  });

  it("should validate a proof", async () => {
    const prover = (
      await zeneKaGM17.proveGM17(id["vkGM17Id"], ...proof["proofGM17"], {
        from: k0
      })
    ).receipt.logs[0].args._prover;

    assert(prover == k0);
  });

  it("should verify a prover", async () => {
    const isVerified = await zeneKaGM17.verify(id["vkGM17Id"], k0);
    assert(isVerified);
  });

  it("should return validated proof input requests", async () => {
    const proofGM17Inputs = proof["proofGM17"][proof["proofGM17"].length - 1];
    const proofInput = (
      await zeneKaGM17.input(id["vkGM17Id"], k0)
    ).map(inputValue => inputValue.toString());
    for (let i = 0; i < proofGM17Inputs.length; i++) {
      assert(proofInput[i] == proofGM17Inputs[i]);
    }
  });
});

contract("ZeneKaPGHR13", accounts => {
  const [k0, k1] = accounts;
  let zeneKaPGHR13;

  it("should initialize", async () => {
    zeneKaPGHR13 = await ZeneKaPGHR13.deployed();
    console.log("ZeneKaPGHR13 Address:", zeneKaPGHR13.address);
  });

  it("should register a new verifier", async () => {
    const registrant = (
      await zeneKaPGHR13.registerPGHR13(...vk["vkPGHR13"], {
        from: k0
      })
    ).receipt.logs[0].args._registrant;
    assert(registrant == k0);
  });

  it("should not register a duplicate verifier", async () => {
    const noRegistrant = (
      await zeneKaPGHR13.registerPGHR13(...vk["vkPGHR13"], {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(noRegistrant);
  });

  it("should commit a proofHash", async () => {
    await zeneKaPGHR13.commitPGHR13(
      id["vkPGHR13Id"],
      proofHash["proofHashPGHR13"],
      {
        from: k0
      }
    );
  });

  it("should return a commit prover", async () => {
    const commitProver = await zeneKaPGHR13.prover(
      proofHash["proofHashPGHR13"],
      {
        from: k0
      }
    );
    assert(commitProver == k0);
  });

  it("should throw if adding a duplicate proofHash", async () => {
    try {
      await zeneKaPGHR13.commitPGHR13(
        id["vkPGHR13Id"],
        proofHash["proofHashPGHR13"],
        {
          from: k1
        }
      );
    } catch (err) {
      return 1;
    }
  });

  it("should verify a falsey prover", async () => {
    const isVerified = await zeneKaPGHR13.verify(id["vkPGHR13Id"], k0);
    assert.isFalse(isVerified);
  });

  it("should not validate a bad proof", async () => {
    const badProof = JSON.parse(JSON.stringify(proof["proofPGHR13"]));
    badProof[badProof.length - 1][0] = 0;
    const badProver = (
      await zeneKaPGHR13.provePGHR13(id["vkPGHR13Id"], ...badProof, {
        from: k0
      })
    ).receipt.logs;
    assert.isEmpty(badProver);
  });

  it("should only validate own proof", async () => {
    const unauthorizedProof = (
      await zeneKaPGHR13.provePGHR13(
        id["vkPGHR13Id"],
        ...proof["proofPGHR13"],
        {
          from: k1
        }
      )
    ).receipt.logs;

    assert.isEmpty(unauthorizedProof);
  });

  it("should throw on unverified proof input requests", async () => {
    try {
      await zeneKaPGHR13.input(id["vkPGHR13Id"], k0);
    } catch (err) {
      return 1;
    }
  });

  it("should validate a proof", async () => {
    const prover = (
      await zeneKaPGHR13.provePGHR13(
        id["vkPGHR13Id"],
        ...proof["proofPGHR13"],
        {
          from: k0
        }
      )
    ).receipt.logs[0].args._prover;

    assert(prover == k0);
  });

  it("should verify a prover", async () => {
    const isVerified = await zeneKaPGHR13.verify(id["vkPGHR13Id"], k0);
    assert(isVerified);
  });

  it("should return validated proof input requests", async () => {
    const proofPGHR13Inputs =
      proof["proofPGHR13"][proof["proofPGHR13"].length - 1];
    const proofInput = (
      await zeneKaPGHR13.input(id["vkPGHR13Id"], k0)
    ).map(inputValue => inputValue.toString());
    for (let i = 0; i < proofPGHR13Inputs.length; i++) {
      assert(proofInput[i] == proofPGHR13Inputs[i]);
    }
  });
});
