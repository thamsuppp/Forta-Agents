interface TransactionDetails {
  hash: string,
  timestamp: number,
};

export default class FailureCounter {
  timeIntervalMs: number;
  transactionMap: {
    [key: string]: TransactionDetails[],
  };

  constructor(timeIntervalMins: number) {
    this.timeIntervalMs = timeIntervalMins * 60 * 1000;
    this.transactionMap = {};
  }

  failure(protocol: string, txHash: string, blockTimestamp: number): number {
    // if transactions array does not exist, initialize it
    if (!this.transactionMap[protocol]) {
      this.transactionMap[protocol] = [];
    }

    const blockTimestampMs = blockTimestamp * 1000; //convert seconds to ms
    // append transaction
    this.transactionMap[protocol].push({
      hash: txHash,
      timestamp: blockTimestampMs,
    });
    // filter out any transactions that fall outside of the time interval
    this.transactionMap[protocol] = this.transactionMap[protocol].filter(
      (txn) => txn.timestamp > blockTimestampMs - this.timeIntervalMs
    );
    return this.transactionMap[protocol].length;
  }

  getTransactions(protocol: string) : string[] {
    return (
      this.transactionMap[protocol]
      ? this.transactionMap[protocol].map((txn) => txn.hash)
      : []
    );
  }
};
