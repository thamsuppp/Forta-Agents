import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import Web3 from "web3";
import { vaultAbi, getYearnVaults } from "./utils";

const web3 = new Web3(getJsonRpcUrl());

export const createFinding = (
  pps: string,
  tracker: string,
  reason: string,
  id: number
) => {
  return Finding.fromObject({
    name: "Yearn PPS Agent",
    description: `Year PPS value: ${reason}`,
    alertId: `Yearn-8-${id}`,
    severity: FindingSeverity.High,
    type: FindingType.Unknown,
    metadata: {
      pps,
      tracker,
    },
  });
};

const provideHandleFunction = (web3: Web3): HandleBlock => {
  let tracker = new BigNumber(1);
  const threshold = 0.1;

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const vaults = await getYearnVaults(web3, blockEvent.blockNumber);

    for (let i = 0; i < vaults.length; i++) {
      const vault = new web3.eth.Contract(vaultAbi as any, vaults[i]);

      const pps = new BigNumber(
        await vault.methods.getPricePerFullShare().call()
      );

      // pps should increase only
      if (pps.isLessThan(tracker)) {
        findings.push(
          createFinding(
            pps.toString(),
            tracker.toString(),
            "Decrease in PPS",
            1
          )
        );
      }

      // swift change in pps
      if (
        Math.abs(pps.minus(tracker).dividedBy(tracker).toNumber()) > threshold
      ) {
        findings.push(
          createFinding(
            pps.toString(),
            tracker.toString(),
            "Very Swift change",
            2
          )
        );
      }

      tracker = pps;
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
