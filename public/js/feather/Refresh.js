const { LCDClient } = require("@terra-money/feather.js");

// Initialise Terra
const terra = new LCDClient({
  'pisco-1': {
    lcd: 'https://pisco-lcd.terra.dev',
    chainID: 'pisco-1',
    prefix: 'terra',
  },
});

async function Refresh(connectedWallet) {
  try {
    const contract_address = "terra1jyrqvj839n7xtlwrdh9mt2fu4l7cma68p98xf3pw6ndwpf2hg8ssqluhss";
    console.log('address:', connectedWallet)
    const result = await terra.wasm.contractQuery(
      contract_address,
      { "get_credit": {"purchaser": connectedWallet} }
    );
    console.log('result:', await result)
    return await result;
  } catch (error) {
    const creditCount = 0;
    return creditCount;
  }  
}

module.exports = {
  Refresh,
};