'use strict';

const { Contract } = require('fabric-contract-api');

class TdrBondContract extends Contract {
  async CreateBond(ctx, bondJson) {
    const bond = JSON.parse(bondJson);
    const key = `bond~${bond.tdrNumber}`;
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Bond ${bond.tdrNumber} already exists`);
    }

    const record = {
      ...bond,
      status: 'PENDING_L1',
      approvals: [],
      createdAt: new Date().toISOString(),
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
    ctx.stub.setEvent('BondCreated', Buffer.from(bond.tdrNumber));
    return JSON.stringify(record);
  }

  async RecordApproval(
    ctx,
    tdrNumber,
    level,
    decision,
    employeeId,
    signatureHash,
    cerbosCallId,
    remarks,
  ) {
    const key = `bond~${tdrNumber}`;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) throw new Error(`Bond ${tdrNumber} not found`);

    const bond = JSON.parse(data.toString());
    const levelNum = parseInt(level, 10);

    if (levelNum < 1 || levelNum > 4) throw new Error('Invalid approval level');

    const approval = {
      level: levelNum,
      decision,
      employeeId,
      signatureHash,
      cerbosCallId,
      remarks,
      timestamp: new Date().toISOString(),
    };

    bond.approvals = bond.approvals || [];
    bond.approvals.push(approval);

    if (decision === 'APPROVED') {
      if (levelNum === 4) bond.status = 'ACTIVE';
      else if (levelNum === 1) bond.status = 'PENDING_L2';
      else if (levelNum === 2) bond.status = 'PENDING_L3';
      else if (levelNum === 3) bond.status = 'PENDING_L4';
    } else if (decision === 'REJECTED') {
      bond.status = 'REJECTED';
    } else if (decision === 'RETURNED') {
      bond.status = 'DRAFT';
    }

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(bond)));
    ctx.stub.setEvent('ApprovalRecorded', Buffer.from(tdrNumber));
    return JSON.stringify(bond);
  }

  async MintCertificate(ctx, tdrNumber, certificateIpfsCid, commissionerSignatureHash) {
    const key = `bond~${tdrNumber}`;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) throw new Error(`Bond ${tdrNumber} not found`);

    const bond = JSON.parse(data.toString());
    if (bond.status !== 'ACTIVE') throw new Error('Bond must be ACTIVE to mint certificate');

    bond.certificateIpfsCid = certificateIpfsCid;
    bond.commissionerSignatureHash = commissionerSignatureHash;
    bond.mintedAt = new Date().toISOString();

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(bond)));
    ctx.stub.setEvent('CertificateMinted', Buffer.from(tdrNumber));
    return JSON.stringify(bond);
  }

  async GetBond(ctx, tdrNumber) {
    const key = `bond~${tdrNumber}`;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) throw new Error(`Bond ${tdrNumber} not found`);
    return data.toString();
  }

  async GetBondHistory(ctx, tdrNumber) {
    const key = `bond~${tdrNumber}`;
    const iterator = await ctx.stub.getHistoryForKey(key);
    const history = [];
    let result = await iterator.next();
    while (!result.done) {
      history.push({
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        value: result.value.value.toString('utf8'),
      });
      result = await iterator.next();
    }
    return JSON.stringify(history);
  }
}

module.exports = TdrBondContract;
module.exports.contracts = [TdrBondContract];
