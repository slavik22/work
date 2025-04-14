import {ethers} from 'hardhat';
import {SimpleChat__factory, SimpleChat} from '../types/typechain';

export default async function main(): Promise<string> {
  console.log('\n[Chat Contract]');
  const factory = (await ethers.getContractFactory('SimpleChat')) as SimpleChat__factory;
  const contract = (await factory.deploy()) as SimpleChat;
  await contract.deployed();

  const receipt = await ethers.provider.getTransactionReceipt(contract.deployTransaction.hash);
  const blockNumber = receipt.blockNumber;

  console.log(`\t✅ Contract deployed at ${contract.address}`);
  console.log(`\t📦 Deployment block number: ${blockNumber}`);
  return contract.address;
}

if (require.main === module) {
  main();
}
