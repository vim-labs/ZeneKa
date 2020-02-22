# ZeneKa

A generalized zkSNARK verification provider.

Zero-knowledge succinct non-interactive argument of knowledge proofs are compiled with ZoKrates and libsnark into Quadratic Arithmetic Programs (QAPs) then submitted as verification keys with 3 supported proving schemes (G16, GM17, and PGHR13). Verification keys are hashed with `keccak256` to create a verification identifier. Proofs are first submitted to a verification id as a sha3 proofHash commit, then revealed in a second stage to validate the requests. Upon validation, the public inputs for a verification id / prover pair are available for further verification and transaction processing.

```bash
node ./example.js node example.js example.zok.tmp 'hello world!' 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

_(output)_

```
Expected values:
h[0]: 11131731503388399332338096774901741037
h[1]: 331326909693098413597148877275635072980
--------------------------------------------------------------------------------
Exporting ZoKrates verifier...
example.zok
--------------------------------------------------------------------------------
Circuit inputs:
(a)     (b)     (c)     (d)     (address)
6841708 7106336 7827314 7103521 827641930419614124039720421795580660909102123457
--------------------------------------------------------------------------------
Generating proofs...
--------------------------------------------------------------------------------
Computing witness...
--------------------------------------------------------------------------------
Generating G6 Verification Key...
--------------------------------------------------------------------------------
Generating GM17 Verification Key...
--------------------------------------------------------------------------------
Generating PGHR13 Verification Key...
--------------------------------------------------------------------------------
Exporting verification keys & proofs...
--------------------------------------------------------------------------------
Done. \o/
```

## How it works

We start with a template for a 5-input ZoKrates Quadratic Arithmetic Program.

_(example.zok.tmp)_

```
import "hashes/sha256/512bitPacked" as sha256packed

def main(private field a, private field b, private field c, private field d, field address) -> (field):
// Hash 512 bits of data split across 4x 128-bit words.
field[2] h = sha256packed([a, b, c, d])

// Validate the expected hash.
h[0] == {{h0}}
h[1] == {{h1}}

// Return our desired recipient
return address
```

The inputs `a`, `b`, `c`, `d` store four private 128-bit words provided as unsigned integers ranging from [0, P-1], where `P` is a large `alt_bn128` prime `21888242871839275222246405745257275088548364400416034343698204186575808495617`. (See [EIP-196](https://eips.ethereum.org/EIPS/eip-196)). This proof allows a prover to demonstrate the possession of information ("hello world!" in this example) to a challenger without revealing any details about that information. Moreover, we can trust the computation which asserts this proof from an untrusted source. A whitelisted challenging Ethereum address used for proof-submission as an unsigned integer `address`, irrevocably intertwining the zkSNARK proof with the prover, such that attempts to resubmit additional valid proofs corrupt this value.

To create a verifier for this proof, we register:

`zeneKa<ProvingScheme>.register<ProvingScheme>(...<Verification_Params>, {from: <Registrant>})`

The verification id and proofHash are calculated as:

```
web3.utils.soliditySha3(...<FlatVerification_Params>)
web3.utils.soliditySha3(...<FlatProof>)
```

To submit a proof, we first commit:

`zeneKa<ProvingScheme>.commit<ProvingScheme>(<Verification_Id>, <ProofHash>, {from: <Prover>})`

Then, prove:

`zeneKa<ProvingScheme>.prove<ProvingScheme>(<Verification_Id>, ...<Proof>, {from: <Prover>})`

Returning the inputs:

`zeneKa<ProvingScheme>.input(<Verification_Id>, <Prover>)`

## Resources

ZoKrates:
https://github.com/Zokrates/ZoKrates

libsnark:
https://github.com/scipr-lab/libsnark

## Ethereum Smart Contracts

**ZeneKa G16**

```
0x599451C385b8Ff0e7E39bCDA0d31Fb795e36B919
```

**ZeneKa GM17**

```
0x2867AC6335C247346454AA7Bd0CE1Eb76fd475B0
```

**ZeneKa PGHR13**

```
0xF13Ca0f66007A20111FedF443F9BbB688c87697F
```
