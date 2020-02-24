const util = require("util");
const fs = require("fs");
const exec = util.promisify(require("child_process").exec);
const web3 = require("web3");
const crypto = require("crypto");

// Pad left with zeros if odd length
const zpad = x => (x.length % 2 == 0 ? x : "0" + x);

// Takes a buffer and returns a sha2-256 hash buffer.
const sha256 = b =>
  crypto
    .createHash("sha256")
    .update(b)
    .digest();

// Splits an array into chunks
const chunk = (arr, size) =>
  arr.reduce((all, one, i) => {
    const ch = Math.floor(i / size);
    all[ch] = [].concat(all[ch] || [], one);
    return all;
  }, []);

// Reads a verification key and returns Object values.
const readVk = (vkRaw, provingvkObj = "G16", valsOnly = true) => {
  const vkObj = {};

  const vals1d = vkRaw
    .match(/[^\r\n]+/g)
    .map(line => line.split(" = ")[1])
    .map(v => v.split(",").map(v => v.replace(/\W/g, "")))
    .flat(2);

  switch (provingvkObj) {
    case "G16": {
      vkObj.a = [vals1d[0], vals1d[1]];
      vkObj.b = [
        [vals1d[2], vals1d[3]],
        [vals1d[4], vals1d[5]]
      ];
      vkObj.gamma = [
        [vals1d[6], vals1d[7]],
        [vals1d[8], vals1d[9]]
      ];
      vkObj.delta = [
        [vals1d[10], vals1d[11]],
        [vals1d[12], vals1d[13]]
      ];
      vkObj.gamma_abc_len = vals1d[14];
      vkObj.gamma_abc = chunk(vals1d.slice(15), 2);
      break;
    }

    case "GM17": {
      vkObj.h = [
        [vals1d[0], vals1d[1]],
        [vals1d[2], vals1d[3]]
      ];
      vkObj.g_alpha = [vals1d[4], vals1d[5]];
      vkObj.h_beta = [
        [vals1d[6], vals1d[7]],
        [vals1d[8], vals1d[9]]
      ];
      vkObj.g_gamma = [vals1d[10], vals1d[11]];
      vkObj.h_gamma = [
        [vals1d[12], vals1d[13]],
        [vals1d[14], vals1d[15]]
      ];
      vkObj.query_len = vals1d[16];
      vkObj.query = chunk(vals1d.slice(17), 2);
      break;
    }

    case "PGHR13": {
      vkObj.a = [
        [vals1d[0], vals1d[1]],
        [vals1d[2], vals1d[3]]
      ];
      vkObj.b = [vals1d[4], vals1d[5]];
      vkObj.c = [
        [vals1d[6], vals1d[7]],
        [vals1d[8], vals1d[9]]
      ];
      vkObj.gamma = [
        [vals1d[10], vals1d[11]],
        [vals1d[12], vals1d[13]]
      ];
      vkObj.gamma_beta_1 = [vals1d[14], vals1d[15]];
      vkObj.gamma_beta_2 = [
        [vals1d[16], vals1d[17]],
        [vals1d[18], vals1d[19]]
      ];
      vkObj.z = [
        [vals1d[20], vals1d[21]],
        [vals1d[22], vals1d[23]]
      ];
      vkObj.ic_len = vals1d[24];
      vkObj.ic = chunk(vals1d.slice(25), 2);
      break;
    }
  }

  if (valsOnly) {
    return Object.values(vkObj);
  }

  return vkObj;
};

// Converts a bytes32 -> uint256
const bytes32ToUint256 = b => web3.utils.toBN(b).toString();

// Converts bytes32 values in a 3d array to uint256 values
const toUintArr = arr =>
  arr.map(v1 =>
    v1.map(v2 =>
      v2.constructor === Array
        ? v2.map(v3 => bytes32ToUint256(v3))
        : bytes32ToUint256(v2)
    )
  );

(async () => {
  // Parameters
  const filename = process.argv[2];
  const plaintext = process.argv[3];
  const address = process.argv[4];

  if (!plaintext) return console.error("Missing plaintext.");
  if (!filename) return console.error("Missing filename.");
  if (!address) return console.error("Missing address.");

  // Encode plaintext to UTF-8 buffer
  const data = Buffer.from(plaintext, "utf-8").toString("hex");

  // Split data into 4 chunks (with leading zeros), then parse as ints
  const l_data = Math.ceil(data.length / 4);
  let chunks_data = data
    .split("")
    .reduce((all, one, i) => {
      const ch = Math.floor(i / l_data);
      all[ch] = [].concat(all[ch] || [], one);
      return all;
    }, [])
    .map(c => BigInt("0x" + zpad(c.join("")), 16).toString());

  if (chunks_data.length > 4) return console.error("Error: data overflow");

  // Pad with zeros
  while (chunks_data.length < 4) chunks_data = [0, ...chunks_data];

  // Parse address as Uint < P-1
  const addr = BigInt(address).toString();

  const zok_inputs = [...chunks_data, addr].join(" ");

  // Hash data
  const dataChunkB = chunks_data.map(chunk => {
    const b = Buffer.alloc(16);
    const v = Buffer.from(zpad(BigInt(chunk).toString(16)), "hex");
    b.set(v, 16 - v.byteLength);
    return b;
  });

  const hBuffer = sha256(Buffer.concat(dataChunkB));
  const h0 = BigInt("0x" + hBuffer.slice(0, 16).toString("hex")).toString();
  const h1 = BigInt("0x" + hBuffer.slice(16, 32).toString("hex")).toString();

  console.log("Expected values:");
  console.log("h[0]:", h0);
  console.log("h[1]:", h1);
  console.log("-".repeat(80));

  // Open template
  let zok = fs.readFileSync(filename, "utf8");
  zok = zok.replace("{{h0}}", h0);
  zok = zok.replace("{{h1}}", h1);

  // Export modified template with hard-coded values
  console.log("Exporting ZoKrates verifier...");
  const filenameOut = filename.split(".")[0] + ".zok";
  fs.writeFileSync(filenameOut, zok);
  console.log(filenameOut);
  console.log("-".repeat(80));

  console.log("Circuit inputs:");
  console.log(zok_inputs);
  console.log("-".repeat(80));

  // Create ZoKrates Proofs / Verifiers
  console.log("Generating proofs...");
  const opts = {
    maxBuffer: 1024 ** 3
  };
  await exec(`zokrates compile -i ${filenameOut}`, opts);
  console.log("-".repeat(80));
  console.log("Computing witness...");
  await exec(`zokrates compute-witness -a ${zok_inputs}`, opts);
  console.log("-".repeat(80));

  // Generate verification keys & calculate packed SHA3 hashes
  console.log("Generating G6 Verification Key...");
  await exec("zokrates setup --proving-scheme g16", opts);
  await exec("zokrates generate-proof --proving-scheme g16");

  let proofG16 = JSON.parse(await fs.readFileSync("proof.json", "utf8"));
  let proofG16_proof = Object.values(proofG16.proof);
  let proofG16_inputs = Object.values(proofG16.inputs);
  proofG16 = [...proofG16_proof, proofG16_inputs];

  const proofHashG16 = web3.utils.soliditySha3(
    ...Object.values(proofG16).flat(2)
  );

  proofG16 = toUintArr(proofG16);

  let vkG16Raw = await fs.readFileSync("verification.key", "utf8");
  const vkG16 = readVk(vkG16Raw, "G16");
  const vkG16Id = web3.utils.soliditySha3(...vkG16.flat(3));
  console.log("-".repeat(80));

  console.log("Generating GM17 Verification Key...");
  await exec("zokrates setup --proving-scheme gm17", opts);
  await exec("zokrates generate-proof --proving-scheme gm17");

  let proofGM17 = JSON.parse(await fs.readFileSync("proof.json", "utf8"));
  let proofGM17_proof = Object.values(proofGM17.proof);
  let proofGM17_inputs = Object.values(proofGM17.inputs);
  proofGM17 = [...proofGM17_proof, proofGM17_inputs];

  const proofHashGM17 = web3.utils.soliditySha3(
    ...Object.values(proofGM17).flat(2)
  );

  proofGM17 = toUintArr(proofGM17);

  let vkGM17Raw = await fs.readFileSync("verification.key", "utf8");
  const vkGM17 = readVk(vkGM17Raw, "GM17");
  const vkGM17Id = web3.utils.soliditySha3(...vkGM17.flat(3));
  console.log("-".repeat(80));

  console.log("Generating PGHR13 Verification Key...");
  await exec("zokrates setup --proving-scheme pghr13", opts);
  await exec("zokrates generate-proof --proving-scheme pghr13");

  let proofPGHR13 = JSON.parse(await fs.readFileSync("proof.json", "utf8"));
  let proofPGHR13_proof = Object.values(proofPGHR13.proof);
  let proofPGHR13_inputs = Object.values(proofPGHR13.inputs);
  proofPGHR13 = [...proofPGHR13_proof, proofPGHR13_inputs];

  const proofHashPGHR13 = web3.utils.soliditySha3(
    ...Object.values(proofPGHR13).flat(2)
  );

  proofPGHR13 = toUintArr(proofPGHR13);

  let vkPGHR13Raw = await fs.readFileSync("verification.key", "utf8");
  const vkPGHR13 = readVk(vkPGHR13Raw, "PGHR13");
  const vkPGHR13Id = web3.utils.soliditySha3(...vkPGHR13.flat(2));
  console.log("-".repeat(80));

  // Export verification keys
  console.log("Exporting verification keys & proofs...");
  const filenameVkOut = filename.split(".")[0] + "_vk.json";
  const verificationKeys = { vkG16, vkGM17, vkPGHR13 };
  await fs.writeFileSync(
    filenameVkOut,
    JSON.stringify(verificationKeys, null, 2)
  );

  // Export verification identification signatures
  const filenameVkIdOut = filename.split(".")[0] + "_vk_id.json";
  const verificationKeyIds = { vkG16Id, vkGM17Id, vkPGHR13Id };
  await fs.writeFileSync(
    filenameVkIdOut,
    JSON.stringify(verificationKeyIds, null, 2)
  );

  // Export proof hashes
  const filenameProofHashOut = filename.split(".")[0] + "_proofHash.json";
  const proofHashes = { proofHashG16, proofHashGM17, proofHashPGHR13 };
  await fs.writeFileSync(
    filenameProofHashOut,
    JSON.stringify(proofHashes, null, 2)
  );

  // Export proofs
  const filenameProofOut = filename.split(".")[0] + "_proof.json";
  const proofs = { proofG16, proofGM17, proofPGHR13 };
  await fs.writeFileSync(filenameProofOut, JSON.stringify(proofs, null, 2));

  console.log("-".repeat(80));
  console.log("Done. \\o/");
})();
