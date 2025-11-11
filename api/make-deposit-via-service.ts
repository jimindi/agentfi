import { nearContractService } from './src/services/near-contract.service';

const DEPOSIT_ADDRESS = 'aea7e00400c9a63833f9f4b3c60e64e27eaccfb9db5ae18e292ac1879d602386';
const AMOUNT = '10000000000000000000000'; // 0.01 wNEAR

async function makeDeposit() {
  await nearContractService.init();
  
  console.log('Generating deposit instructions...');
  
  const instructions = await nearContractService.generateDepositInstructions({
    userAccountId: DEPOSIT_ADDRESS,
    tokenContractId: 'wrap.near',
    amount: AMOUNT
  });
  
  console.log('\nCLI Command:');
  console.log(instructions.cliCommand);
  
  console.log('\n\nOr use NEAR wallet to call:');
  console.log('Contract:', instructions.contractId);
  console.log('Method:', instructions.methodName);
  console.log('Args:', JSON.stringify(instructions.args, null, 2));
  console.log('Gas:', instructions.gas);
  console.log('Deposit:', instructions.deposit, 'yoctoNEAR');
}

makeDeposit().catch(console.error);
